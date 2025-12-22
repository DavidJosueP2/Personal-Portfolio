import * as React from "react"
import { prefersReducedMotion } from "@/lib/motion"
import { setupReveal } from "@/lib/gsap-reveal"

export function AboutSection() {
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (prefersReducedMotion()) return
    const root = rootRef.current
    if (!root) return
    return setupReveal(root, { y: 14, stagger: 0.08 })
  }, [])

  return (
    <section id="about" className="mx-auto w-full max-w-6xl px-6 py-20">
      <div
        ref={rootRef}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/2 p-8 backdrop-blur md:p-12"
      >
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[22px_22px]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_55%)]" />
        </div>

        <div className="relative grid gap-10 md:grid-cols-2 md:gap-12">
          <div>
            <h2
              data-reveal
              className="text-3xl font-extrabold text-white md:text-4xl"
              style={{ fontFamily: "Gloock, Onest, system-ui" }}
            >
              About
            </h2>
            <p data-reveal className="mt-2 max-w-prose text-sm text-white/70">
              Get to know me!
            </p>
            <p data-reveal className="mt-3 max-w-prose text-sm text-white/70">
              I'm David Barragán, a Software Engineer who delivers both: product-grade frontend and reliable backend foundations.
            </p>
            <p data-reveal className="mt-3 max-w-prose text-sm text-white/70">
              I care about clean architecture, strong fundamentals, and motion used as a tool—not decoration.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <h3 data-reveal className="text-sm font-semibold tracking-[0.25em] text-white/80">EDUCATION</h3>
            <div data-reveal className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-white/85">Software Engineering</p>
                <p className="mt-1 text-xs text-white/60">Technical University of Ambato, 7th semester</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/85">Continuous Learning</p>
                <p className="mt-1 text-xs text-white/60">Certifications, self-driven projects, and hands-on building.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
