import type { ReactNode, Ref } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/shadcn/button"
import { diagramColors, type projectBox } from "./diagram-geometry"

type Faces = ReturnType<typeof projectBox>
type Grid = ReadonlyArray<readonly [readonly [number, number], readonly [number, number]]>

export function DiagramBoard({ faces, grid }: Readonly<{ faces: Faces; grid: Grid }>) {
  return (
    <>
      <g stroke={diagramColors.boardEdge} strokeLinejoin="round">
        <polygon points={faces.front} fill="#0d1518" />
        <polygon points={faces.side} fill="#101a1e" />
        <polygon points={faces.top} fill={diagramColors.boardTop} />
      </g>
      <g stroke={diagramColors.grid} strokeOpacity=".56">
        {grid.map(([[x1, y1], [x2, y2]]) => (
          <line key={`${x1},${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
    </>
  )
}

export function DiagramNode({ base, layers, active }: Readonly<{ base: Faces; layers: Faces[]; active: boolean }>) {
  return (
    <g stroke={active ? "currentColor" : diagramColors.nodeEdge} strokeLinejoin="round">
      <polygon points={base.front} fill="#121e22" />
      <polygon points={base.side} fill="#17272d" />
      <polygon points={base.top} fill="#1e3036" />
      {layers.map((layer) => (
        <g key={layer.top}>
          <polygon points={layer.front} fill="#19282d" />
          <polygon points={layer.side} fill="#203138" />
          <polygon points={layer.top} fill={active ? "color-mix(in srgb, currentColor 19%, #25373d)" : "#293c43"} />
        </g>
      ))}
    </g>
  )
}

export function DiagramLabel({ children, x, y, active }: Readonly<{ children: ReactNode; x: number; y: number; active: boolean }>) {
  return (
    <span
      className={`absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border bg-[#0e1518] px-1.5 py-0.5 text-[10px] font-semibold leading-none sm:text-[11px] ${active ? "border-current" : "border-white/15 text-[#c3ced1]"}`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {children}
    </span>
  )
}

export function DiagramPacket({ packetRef, x, y, visible }: Readonly<{ packetRef: Ref<SVGGElement>; x: number; y: number; visible: boolean }>) {
  return (
    <g ref={packetRef} transform={`translate(${x} ${y})`} visibility={visible ? "visible" : "hidden"}>
      <circle r="11" fill="currentColor" opacity=".18" />
      <path d="M0 -7 L5.5 0 L0 7 L-5.5 0Z" fill="currentColor" stroke="#e7faf6" strokeWidth="1.1" />
    </g>
  )
}

export function DiagramAction({ children, busy, onClick }: Readonly<{ children: ReactNode; busy: boolean; onClick: () => void }>) {
  return (
    <div className="flex justify-center">
      <Button
        type="button"
        onClick={onClick}
        aria-disabled={busy}
        className="min-h-11 rounded-full border border-white/15 bg-[#101518]/65 text-white hover:bg-white/10 aria-disabled:cursor-wait aria-disabled:opacity-65"
      >
        {children}
        <ArrowRight aria-hidden="true" />
      </Button>
    </div>
  )
}
