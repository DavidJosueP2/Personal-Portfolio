import type { Ref } from "react"
import {
  BOARD, DATABASE_LAYERS, NODE_BASE, NODE_BODY, VIEW_HEIGHT, VIEW_WIDTH,
  boardGrid, databaseLinks, entryLink, nodes, packetPosition, projectPoint, routes,
} from "./microservices-flow"

type Box = {
  width: number
  depth: number
  bottom: number
  top: number
}

function boxFaces({ width, depth, bottom, top }: Box, x = 0, z = 0) {
  const left = x - width / 2
  const right = x + width / 2
  const near = z + depth / 2
  const far = z - depth / 2
  const point = (px: number, py: number, pz: number) => projectPoint([px, py, pz]).join(",")

  return {
    front: [point(left, top, near), point(right, top, near), point(right, bottom, near), point(left, bottom, near)].join(" "),
    side: [point(right, top, near), point(right, top, far), point(right, bottom, far), point(right, bottom, near)].join(" "),
    top: [point(left, top, far), point(right, top, far), point(right, top, near), point(left, top, near)].join(" "),
  }
}

const board = boxFaces(BOARD)
const modules = nodes.map(({ name, x, z, database }, index) => ({
  index,
  name,
  base: boxFaces(NODE_BASE, x, z),
  layers: (database ? DATABASE_LAYERS : [NODE_BODY]).map((layer) => boxFaces(layer, x, z)),
  label: projectPoint([x, 1.02, z]),
  depth: z + x * 0.3,
})).sort((a, b) => a.depth - b.depth)

function tracePath(segments: (typeof entryLink)[]) {
  return segments.map(({ start, control, end }) =>
    `M${projectPoint(start).join(",")} Q${projectPoint(control).join(",")} ${projectPoint(end).join(",")}`,
  ).join(" ")
}

const entryTrace = tracePath([entryLink])
const branchTraces = routes.map(({ segments }) => tracePath(segments.slice(1)))
const databaseTrace = tracePath(databaseLinks)

const gridLines = boardGrid.map(([start, end]) => [projectPoint(start), projectPoint(end)] as const)

type Props = {
  canvasRef: Ref<HTMLCanvasElement>
  diagramRef: Ref<HTMLDivElement>
  packetRef: Ref<SVGGElement>
  webGL: boolean
  activeNode: number
  activeReplica: number | null
}

export function RequestDiagram({ canvasRef, diagramRef, packetRef, webGL, activeNode, activeReplica }: Readonly<Props>) {
  const [packetX, packetY] = projectPoint(packetPosition(0, 0))

  return (
    <div className="relative min-w-0 overflow-hidden">
      <div
        ref={diagramRef}
        aria-hidden="true"
        className="relative w-full overflow-hidden bg-[radial-gradient(ellipse_at_52%_53%,rgb(var(--accent-rgb,52_211_153)_/_0.07),transparent_72%)]"
        style={{ aspectRatio: VIEW_WIDTH / VIEW_HEIGHT }}
      >
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className={webGL ? "invisible absolute inset-0 size-full" : "absolute inset-0 size-full"}
        >
          <g stroke="#45606c" strokeLinejoin="round">
            <polygon points={board.front} fill="#0b131b" />
            <polygon points={board.side} fill="#0d1820" />
            <polygon points={board.top} fill="#111d26" />
          </g>
          <g stroke="#29414d" strokeOpacity=".65">
            {gridLines.map(([[x1, y1], [x2, y2]], index) => (
              <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />
            ))}
          </g>
          <path d={databaseTrace} fill="none" stroke="#3b6171" strokeDasharray="3 3" strokeWidth="2" />
          {modules.map(({ name, base, layers, index }) => {
            const selected = activeNode === index
            return (
              <g key={name} stroke={selected ? "currentColor" : "#577482"} strokeLinejoin="round">
                <polygon points={base.front} fill="#101e26" />
                <polygon points={base.side} fill="#152831" />
                <polygon points={base.top} fill="#1d3440" />
                {layers.map((body) => (
                  <g key={body.top}>
                    <polygon points={body.front} fill="#172c36" />
                    <polygon points={body.side} fill="#1e3541" />
                    <polygon points={body.top} fill={selected ? "#2b4148" : "#27434e"} />
                  </g>
                ))}
              </g>
            )
          })}
          <path d={entryTrace} fill="none" stroke="currentColor" strokeOpacity=".7" strokeWidth="2" />
          {branchTraces.map((trace, index) => (
            <path key={trace} d={trace} fill="none" stroke={index === activeReplica ? "currentColor" : "#3b6171"} strokeWidth="2" />
          ))}
          <g ref={packetRef} transform={`translate(${packetX} ${packetY})`}>
            <circle r="12" fill="currentColor" opacity=".18" />
            <path d="M0 -8 L6 0 L0 8 L-6 0Z" fill="currentColor" stroke="#e7faf6" strokeWidth="1.1" />
          </g>
        </svg>

        <canvas ref={canvasRef} className={webGL ? "absolute inset-0 size-full" : "invisible absolute inset-0 size-full"} />

        {modules.map(({ name, label: [left, top], index }) => (
          <span
            key={name}
            className={`absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border bg-[#0b1419] px-1.5 py-0.5 text-[9px] font-medium leading-none sm:text-[11px] ${activeNode === index ? "border-current" : "border-white/15 text-[#b9cad3]"}`}
            style={{ left: `${left / VIEW_WIDTH * 100}%`, top: `${top / VIEW_HEIGHT * 100}%` }}
          >
            {name}
          </span>
        ))}
      </div>

    </div>
  )
}
