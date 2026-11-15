import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { useAccentTheme } from "@/context/accent-theme"
import { prefersReducedMotion } from "@/lib/motion"
import { DiagramAction } from "./DiagramPrimitives"
import { RequestDiagram } from "./RequestDiagram"
import { activeNodeAt, packetPosition, projectPoint, routes, serviceName } from "./microservices-flow"
import type { RequestScene } from "./microservices-scene"

type Phase = "idle" | "loading" | "running" | "complete"
const FRAME_INTERVAL = 1000 / 60

export function MicroservicesDemo() {
  const { accent } = useAccentTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const diagramRef = useRef<HTMLDivElement>(null)
  const packetRef = useRef<SVGGElement>(null)
  const sceneRef = useRef<RequestScene | null>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const inView = useRef(true)
  const pendingLoad = useRef<AbortController | null>(null)
  const noWebGL = useRef(false)
  const nextReplica = useRef(0)
  const [webGL, setWebGL] = useState(false)
  const [phase, setPhase] = useState<Phase>("idle")
  const [replica, setReplica] = useState<number | null>(null)
  const [activeNode, setActiveNode] = useState(-1)

  useEffect(() => {
    const diagram = diagramRef.current
    const canvas = canvasRef.current
    if (!diagram || !canvas) return

    const syncPlayback = () => {
      timelineRef.current?.paused(!inView.current || document.hidden)
    }
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.at(-1)
      if (!entry) return
      inView.current = entry.isIntersecting
      syncPlayback()
    })
    observer.observe(diagram)
    document.addEventListener("visibilitychange", syncPlayback)

    const onContextLost = () => {
      noWebGL.current = true
      const scene = sceneRef.current
      sceneRef.current = null
      scene?.dispose()
      setWebGL(false)
    }
    canvas.addEventListener("webglcontextlost", onContextLost)

    return () => {
      pendingLoad.current?.abort()
      observer.disconnect()
      document.removeEventListener("visibilitychange", syncPlayback)
      canvas.removeEventListener("webglcontextlost", onContextLost)
      timelineRef.current?.kill()
      sceneRef.current?.dispose()
      pendingLoad.current = null
      timelineRef.current = null
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.syncAccent()
  }, [accent])

  const busy = phase === "loading" || phase === "running"

  async function sendRequest() {
    if (busy || pendingLoad.current || timelineRef.current) return
    const selected = nextReplica.current
    nextReplica.current = (selected + 1) % routes.length
    setReplica(selected)
    setActiveNode(0)

    if (prefersReducedMotion()) {
      sceneRef.current?.draw(0, selected)
      setPhase("complete")
      return
    }

    const canvas = canvasRef.current
    if (canvas && !sceneRef.current && !noWebGL.current) {
      const controller = new AbortController()
      try {
        const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" })
        if (context) {
          pendingLoad.current = controller
          setPhase("loading")
          const { createRequestScene } = await import("./microservices-scene")
          if (controller.signal.aborted) return
          if (!context.isContextLost()) {
            sceneRef.current = createRequestScene(canvas, context)
            setWebGL(true)
          }
        }
      } catch {
        if (controller.signal.aborted) return
      } finally {
        if (pendingLoad.current === controller) pendingLoad.current = null
      }
      noWebGL.current = !sceneRef.current
    }

    const playhead = { progress: 0 }
    let nextFrame = 0
    const draw = (force = false) => {
      const now = performance.now()
      if (!force && now + 0.5 < nextFrame) return
      nextFrame = Math.max(now, nextFrame + FRAME_INTERVAL)

      const { progress } = playhead
      const [x, y] = projectPoint(packetPosition(selected, progress))
      packetRef.current?.setAttribute("transform", `translate(${x} ${y})`)
      sceneRef.current?.draw(progress, selected)
    }
    draw(true)
    setPhase("running")
    const timeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        draw(true)
        timelineRef.current = null
        setPhase("complete")
      },
    })
    timelineRef.current = timeline

    const outboundLegs = routes[selected].segments.length
    for (let index = 1; index <= outboundLegs * 2; index++) {
      timeline.to(playhead, {
        progress: index,
        delay: index === outboundLegs + 1 ? 0.22 : 0,
        duration: index <= outboundLegs ? 0.48 : 0.3,
        ease: "none",
        onUpdate: draw,
      })
      timeline.call(() => setActiveNode(activeNodeAt(selected, index)))
    }
    if (inView.current && !document.hidden) timeline.play()
  }

  const status = busy ? "Sending a simulated request."
    : phase === "complete" && replica !== null
      ? `Response received through ${serviceName(replica)} and PostgreSQL ${replica + 1}.`
      : ""

  return (
    <div aria-label="Microservices" role="group" className="mx-auto w-full max-w-72 min-w-0 sm:max-w-80 2xl:max-w-[21rem]">
      <div className="text-[rgb(var(--accent-rgb,52_211_153))]">
        <RequestDiagram
          canvasRef={canvasRef}
          diagramRef={diagramRef}
          packetRef={packetRef}
          webGL={webGL}
          activeNode={activeNode}
          activeReplica={replica}
        />
      </div>
      <DiagramAction onClick={sendRequest} busy={busy}>Send request</DiagramAction>
      <p role="status" className="sr-only">{status}</p>
    </div>
  )
}
