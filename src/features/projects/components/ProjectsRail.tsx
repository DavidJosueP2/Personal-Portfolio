import * as React from "react"
import type { Project } from "../types"

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function formatIndex(n: number) {
  return String(n).padStart(2, "0")
}

type Props = {
  projects: Project[]
  activeIndex: number
  onSelect: (idx: number) => void
}

/**
 * ProjectsRail
 * Desktop: sticky rail scoped to the Projects section (NOT fixed to viewport).
 * Mobile: horizontal previews.
 */
export function ProjectsRail({ projects, activeIndex, onSelect }: Readonly<Props>) {
  const count = projects.length
  const safeActive = clamp(activeIndex, 0, Math.max(0, count - 1))

  const previewIndices = React.useMemo(() => Array.from({ length: count }, (_, i) => i), [count])

  return (
    <>
      {/* Desktop fixed rail */}
      <div className="fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 md:block">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => onSelect(safeActive - 1)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/12 bg-black/45 text-white/85 hover:bg-white/5"
            aria-label="Previous project"
          >
            ↑
          </button>

          <div className="flex flex-col gap-2">
            {previewIndices.map((pi) => {
              const p = projects[pi]
              const isActive = pi === safeActive

              const dist = Math.abs(pi - safeActive)
              const offsetX = Math.min(26, dist * 10)
              const tilt = (pi < safeActive ? -1 : 1) * Math.min(10, dist * 4)

              return (
                <button
                  key={`rail-preview-${p.id}`}
                  type="button"
                  onClick={() => onSelect(pi)}
                  className={
                    "group relative flex items-center gap-3 rounded-2xl border bg-black/40 px-3 py-2 text-left backdrop-blur transition-colors " +
                    (isActive ? "border-white/25 bg-white/10" : "border-white/10 hover:border-white/20 hover:bg-white/5")
                  }
                  style={{ transform: `translateX(${offsetX}px) rotate(${tilt}deg)` }}
                  aria-current={isActive ? "true" : undefined}
                >
                  <div className="w-10 text-xs font-semibold tracking-[0.2em] text-white/70">{formatIndex(pi + 1)}.</div>
                  <div className="h-9 w-14 overflow-hidden rounded-lg border border-white/10 bg-black/55">
                    <img
                      src={p.images.cover.src}
                      alt=""
                      aria-hidden
                      className={"h-full w-full object-cover transition-opacity " + (isActive ? "opacity-100" : "opacity-70")}
                      loading="lazy"
                    />
                  </div>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => onSelect(safeActive + 1)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/12 bg-black/45 text-white/85 hover:bg-white/5"
            aria-label="Next project"
          >
            ↓
          </button>
        </div>
      </div>

      {/* Mobile horizontal rail */}
      <div className="mb-4 md:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelect(safeActive - 1)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/12 bg-black/45 text-white/85 hover:bg-white/5"
            aria-label="Previous project"
          >
            ↑
          </button>

          <div className="flex max-w-full gap-2 overflow-x-auto pb-2">
            {previewIndices.map((pi) => {
              const p = projects[pi]
              const isActive = pi === safeActive
              return (
                <button
                  key={`rail-mobile-preview-${p.id}`}
                  type="button"
                  onClick={() => onSelect(pi)}
                  className={
                    "group relative flex items-center gap-3 rounded-2xl border bg-black/40 px-3 py-2 text-left backdrop-blur transition-colors shrink-0 " +
                    (isActive ? "border-white/25 bg-white/10" : "border-white/10 hover:border-white/20 hover:bg-white/5")
                  }
                  aria-current={isActive ? "true" : undefined}
                >
                  <div className="w-10 text-xs font-semibold tracking-[0.2em] text-white/70">{formatIndex(pi + 1)}.</div>
                  <div className="h-9 w-14 overflow-hidden rounded-lg border border-white/10 bg-black/55">
                    <img
                      src={p.images.cover.src}
                      alt=""
                      aria-hidden
                      className={"h-full w-full object-cover transition-opacity " + (isActive ? "opacity-100" : "opacity-70")}
                      loading="lazy"
                    />
                  </div>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => onSelect(safeActive + 1)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/12 bg-black/45 text-white/85 hover:bg-white/5"
            aria-label="Next project"
          >
            ↓
          </button>
        </div>
      </div>
    </>
  )
}
