import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { prefersReducedMotion } from "@/lib/motion"
import { DiagramAction, DiagramBoard, DiagramLabel, DiagramNode, DiagramPacket } from "./DiagramPrimitives"
import { boardGridLines, createProjection, diagramColors, pointOnSegment, projectBox, tracePath, type DiagramSegment } from "./diagram-geometry"

const width = 460
const height = 256
const project = createProjection(width, height, 5.2)
const boardShape = { width: 8.1, depth: 3.55, bottom: -0.27, top: 0 }
const board = projectBox(project, boardShape)
const grid = boardGridLines(boardShape).map(([start, end]) => [project(start), project(end)] as const)
const base = { width: 1.85, depth: 1.46, bottom: 0.04, top: 0.2 }
const job = { width: 0.58, depth: 0.61, bottom: 0.22, top: 0.68 }
const container = { width: 1.45, depth: 0.93, bottom: 0.22, top: 0.51 }
const pod = { width: 0.57, depth: 0.48, bottom: 0.22, top: 0.73 }

const stages = [
  {
    name: "GitHub Actions", x: -2.58, z: -0.15, top: 0.71,
    layers: [projectBox(project, job, -2.94, -0.15), projectBox(project, job, -2.22, -0.15)],
  },
  {
    name: "Docker", x: 0, z: 0, top: 0.87,
    layers: [projectBox(project, container), projectBox(project, { ...container, bottom: 0.53, top: 0.84 })],
  },
  {
    name: "Kubernetes", x: 2.58, z: 0.19, top: 0.76,
    layers: [projectBox(project, pod, 2.58, -0.18), projectBox(project, pod, 2.22, 0.49), projectBox(project, pod, 2.94, 0.49)],
  },
]

const modules = stages.map(({ name, x, z, top, layers }) => ({
  name,
  base: projectBox(project, base, x, z),
  layers,
  label: project([x, top + 0.74, z]),
}))

const segments = stages.slice(1).map((stage, index): DiagramSegment => {
  const previous = stages[index]
  return {
    start: [previous.x, previous.top, previous.z],
    control: [(previous.x + stage.x) / 2, 1.47, (previous.z + stage.z) / 2],
    end: [stage.x, stage.top, stage.z],
  }
})
const traces = segments.map((segment) => tracePath(project, [segment]))
const [packetX, packetY] = project(segments[0].start)

export function DeploymentDemo() {
  const packetRef = useRef<SVGGElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const [activeStage, setActiveStage] = useState(-1)
  const [busy, setBusy] = useState(false)

  useEffect(() => () => { timelineRef.current?.kill() }, [])

  function runDeployment() {
    if (timelineRef.current) return

    const drawPacket = (segment: DiagramSegment, progress: number) => {
      const [x, y] = project(pointOnSegment(segment, progress))
      packetRef.current?.setAttribute("transform", `translate(${x} ${y})`)
    }

    if (prefersReducedMotion()) {
      drawPacket(segments[segments.length - 1], 1)
      setActiveStage(segments.length)
      return
    }

    setBusy(true)
    setActiveStage(0)
    drawPacket(segments[0], 0)

    const timeline = gsap.timeline({
      onComplete: () => {
        timelineRef.current = null
        setBusy(false)
      },
    })
    timelineRef.current = timeline

    segments.forEach((segment, index) => {
      const playhead = { progress: 0 }
      timeline.to(playhead, {
        progress: 1,
        delay: index === 0 ? 0.1 : 0.16,
        duration: 0.56,
        ease: "power1.inOut",
        onUpdate: () => drawPacket(segment, playhead.progress),
      })
      timeline.call(() => setActiveStage(index + 1))
    })
  }

  const status = busy ? "Simulating a deployment." : activeStage === segments.length ? "Deployment reached Kubernetes." : ""

  return (
    <div role="group" aria-label="Deployment pipeline from GitHub Actions through Docker to Kubernetes" className="mx-auto w-full max-w-md min-w-0">
      <div aria-hidden="true" className="relative text-[rgb(var(--accent-rgb,52_211_153))]" style={{ aspectRatio: width / height }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 size-full">
          <DiagramBoard faces={board} grid={grid} />
          {modules.map(({ name, base, layers }, index) => (
            <DiagramNode key={name} base={base} layers={layers} active={index === activeStage} />
          ))}
          {traces.map((trace, index) => (
            <path key={trace} d={trace} fill="none" stroke={activeStage >= index ? "currentColor" : diagramColors.wire} strokeOpacity=".78" strokeWidth="2" />
          ))}
          <DiagramPacket packetRef={packetRef} x={packetX} y={packetY} visible={activeStage >= 0} />
        </svg>
        {modules.map(({ name, label: [x, y] }, index) => (
          <DiagramLabel key={name} x={x / width * 100} y={y / height * 100} active={index === activeStage}>
            {name}
          </DiagramLabel>
        ))}
      </div>

      <DiagramAction onClick={runDeployment} busy={busy}>Run deployment</DiagramAction>
      <p role="status" className="sr-only">{status}</p>
    </div>
  )
}
