import { useEffect, useRef, useState } from "react"
import { ArrowRight } from "lucide-react"
import { gsap } from "gsap"
import { Button } from "@/components/ui/shadcn/button"
import { useAccentTheme } from "@/context/accent-theme"
import { prefersReducedMotion } from "@/lib/motion"
import { RequestDiagram } from "./RequestDiagram"
import { activeNodeAt, packetPosition, projectPoint, routes } from "./microservices-flow"
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
  const [activeNode, setActiveNode] = useState(0)

  useEffect(() => {
    const diagram = diagramRef.current
    const canvas = canvasRef.current
    if (!diagram || !canvas) return

    const syncPlayback = () => {
      timelineRef.current?.paused(!inView.current || document.hidden)
    }
    const observer = new IntersectionObserver(([entry]) => {
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
      pendingLoad.current = controller
      setPhase("loading")
      try {
        const { createRequestScene } = await import("./microservices-scene")
        if (controller.signal.aborted) return
        sceneRef.current = createRequestScene(canvas)
        noWebGL.current = !sceneRef.current
        setWebGL(Boolean(sceneRef.current))
      } catch {
        if (controller.signal.aborted) return
        noWebGL.current = true
      } finally {
        if (pendingLoad.current === controller) pendingLoad.current = null
      }
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
      ? `Response received through Trips ${replica + 1} and PostgreSQL ${replica + 1}.`
      : ""

  return (
    <div aria-label="Microservices" role="group" className="mx-auto w-full max-w-96 min-w-0">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={sendRequest}
          aria-disabled={busy}
          className="min-h-11 rounded-full border border-white/15 bg-black/25 text-white hover:bg-white/10 aria-disabled:cursor-wait aria-disabled:opacity-65"
        >
          Send request
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
      <div className="mt-2 text-[rgb(var(--accent-rgb,52_211_153))]">
        <RequestDiagram
          canvasRef={canvasRef}
          diagramRef={diagramRef}
          packetRef={packetRef}
          webGL={webGL}
          activeNode={activeNode}
          activeReplica={replica}
        />
      </div>
      <p role="status" className="sr-only">{status}</p>
    </div>
  )
}
