import * as React from "react"
import { Button } from "@/components/ui/shadcn/button"
import { prefersReducedMotion } from "@/lib/motion"
import { setupReveal } from "@/lib/gsap-reveal"

export function ProjectsSection() {
  const rootRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (prefersReducedMotion()) return
    const root = rootRef.current
    if (!root) return
    return setupReveal(root, { y: 16, stagger: 0.06 })
  }, [])

  return (
    <section ref={rootRef} id="projects" className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 data-reveal className="text-2xl font-extrabold text-white">Projects</h2>
          <p data-reveal className="mt-2 max-w-prose text-sm text-white/70">
            Real case studies with measurable impact, architecture notes, and links. These cards are placeholders—we’ll replace them
            with work that speaks.
          </p>
        </div>
        <Button
          data-reveal
          variant="outline"
          className="rounded-full border-white/15 bg-transparent text-white/80 hover:bg-white/5"
          type="button"
        >
          View all
        </Button>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <article
            data-reveal
            key={n}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="absolute -inset-24 bg-[radial-gradient(circle,rgba(0,255,170,0.18),transparent_60%)] [html[data-accent='red']_&]:bg-[radial-gradient(circle,rgba(255,60,90,0.2),transparent_60%)] [html[data-accent='cyan']_&]:bg-[radial-gradient(circle,rgba(34,211,238,0.2),transparent_60%)] [html[data-accent='violet']_&]:bg-[radial-gradient(circle,rgba(167,139,250,0.2),transparent_60%)] [html[data-accent='amber']_&]:bg-[radial-gradient(circle,rgba(251,191,36,0.2),transparent_60%)]" />
            </div>
            <p className="text-xs font-semibold tracking-[0.25em] text-white/60">CASE {n}</p>
            <h3 className="mt-3 text-lg font-bold text-white">Project placeholder</h3>
            <p className="mt-2 text-sm text-white/70">Performance, animation, UI systems, DX—this is where the receipts go.</p>
          </article>
        ))}
      </div>
    </section>
  )
}
