import * as React from "react"
import { prefersReducedMotion } from "@/lib/motion"
import { setupReveal } from "@/lib/gsap-reveal"

export type TimelineItem = {
  range: string
  title: string
  org: string
  location?: string
  description: string
}

export function ExperienceTimeline({ items }: Readonly<{ items: TimelineItem[] }>) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (prefersReducedMotion()) return
    const root = rootRef.current
    if (!root) return
    return setupReveal(root, { y: 12, stagger: 0.06 })
  }, [])

  if (!items.length) return null

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-20">
      <div
        ref={rootRef}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/2 p-8 backdrop-blur md:p-12"
      >
        <div className="pointer-events-none absolute inset-0 opacity-45">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[22px_22px]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_60%)]" />
        </div>

        <div className="relative">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 data-reveal className="text-sm font-semibold tracking-[0.25em] text-white/80">
                EXPERIENCE
              </h3>
              <p data-reveal className="mt-2 max-w-prose text-sm text-white/70">
                A quick timeline of what I’ve been building.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <ol className="relative">
              <span aria-hidden className="absolute left-2.5 top-0 h-full w-px bg-white/10" />

              {items.map((it) => (
                <li
                  key={`${it.range}-${it.title}`}
                  data-reveal
                  className="relative grid gap-6 pb-12 pl-10 md:grid-cols-[minmax(280px,420px)_minmax(0,1fr)] md:items-start md:pb-14"
                >
                  {/* dot */}
                  <span
                    aria-hidden
                    className="absolute left-0 top-1.5 grid h-5 w-5 place-items-center rounded-full border border-white/15 bg-black/40"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--accent-rgb,52_211_153))]" />
                  </span>

                  {/* left meta */}
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-[0.22em] text-white/50">{it.range}</p>

                    <p className="mt-2 text-lg font-semibold leading-snug">
                      <span className="text-[rgb(var(--accent-rgb,52_211_153))]">{it.title}</span>
                      {it.location ? <span className="text-white/55"> · {it.location}</span> : null}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-white/85">{it.org}</p>
                  </div>

                  {/* right description */}
                  <div className="min-w-0">
                    <p className="text-sm leading-relaxed text-white/70">{it.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
