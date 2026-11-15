import type { Ref } from "react"
import { DiagramBoard, DiagramLabel, DiagramNode, DiagramPacket } from "./DiagramPrimitives"
import { diagramColors, projectBox, tracePath } from "./diagram-geometry"
import {
  BOARD, DATABASE_LAYERS, NODE_BASE, NODE_BODY, VIEW_HEIGHT, VIEW_WIDTH,
  boardGrid, databaseLinks, entryLink, nodes, packetPosition, projectPoint, routes,
} from "./microservices-flow"

const board = projectBox(projectPoint, BOARD)
const grid = boardGrid.map(([start, end]) => [projectPoint(start), projectPoint(end)] as const)
const modules = nodes.map(({ name, x, z, database }, index) => ({
  index,
  name,
  base: projectBox(projectPoint, NODE_BASE, x, z),
  layers: (database ? DATABASE_LAYERS : [NODE_BODY]).map((layer) => projectBox(projectPoint, layer, x, z)),
  label: projectPoint([x, 1.02, z]),
  depth: z + x * 0.3,
})).sort((a, b) => a.depth - b.depth)

const entryTrace = tracePath(projectPoint, [entryLink])
const branchTraces = routes.map(({ segments }) => tracePath(projectPoint, segments.slice(1)))
const databaseTrace = tracePath(projectPoint, databaseLinks)
const [packetX, packetY] = projectPoint(packetPosition(0, 0))

type Props = {
  canvasRef: Ref<HTMLCanvasElement>
  diagramRef: Ref<HTMLDivElement>
  packetRef: Ref<SVGGElement>
  webGL: boolean
  activeNode: number
  activeReplica: number | null
}

export function RequestDiagram({ canvasRef, diagramRef, packetRef, webGL, activeNode, activeReplica }: Readonly<Props>) {
  return (
    <div ref={diagramRef} aria-hidden="true" className="relative w-full" style={{ aspectRatio: VIEW_WIDTH / VIEW_HEIGHT }}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={webGL ? "invisible absolute inset-0 size-full" : "absolute inset-0 size-full"}
      >
        <DiagramBoard faces={board} grid={grid} />
        <path d={databaseTrace} fill="none" stroke={diagramColors.wire} strokeDasharray="3 3" strokeWidth="2" />
        {modules.map(({ name, base, layers, index }) => (
          <DiagramNode key={name} base={base} layers={layers} active={index === activeNode} />
        ))}
        <path d={entryTrace} fill="none" stroke={activeReplica === null ? diagramColors.wire : "currentColor"} strokeOpacity=".75" strokeWidth="2" />
        {branchTraces.map((trace, index) => (
          <path key={trace} d={trace} fill="none" stroke={index === activeReplica ? "currentColor" : diagramColors.wire} strokeWidth="2" />
        ))}
        <DiagramPacket packetRef={packetRef} x={packetX} y={packetY} visible={activeReplica !== null} />
      </svg>

      <canvas ref={canvasRef} className={webGL ? "absolute inset-0 size-full" : "invisible absolute inset-0 size-full"} />

      {modules.map(({ name, label: [x, y], index }) => (
        <DiagramLabel key={name} x={x / VIEW_WIDTH * 100} y={y / VIEW_HEIGHT * 100} active={index === activeNode}>
          {name}
        </DiagramLabel>
      ))}
    </div>
  )
}
