import * as React from "react"
import { gsap } from "gsap"
import { prefersReducedMotion } from "@/lib/motion"

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

export function Footer() {
  const rootRef = React.useRef<HTMLElement | null>(null)

  React.useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const root = rootRef.current
    if (!root) return

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-footer-reveal]"))
    gsap.set(items, { autoAlpha: 0, y: 10 })

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (!e || !e.isIntersecting) return

        gsap.to(items, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.05 })
        io.disconnect()
      },
      { root: null, rootMargin: "0px 0px -15% 0px", threshold: 0.12 }
    )

    io.observe(root)

    return () => io.disconnect()
  }, [])

  const year = new Date().getFullYear()

  return (
    <footer ref={rootRef} className="portfolio-container pb-10 pt-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-5 backdrop-blur">
        {/* subtle grid + glow */}
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[22px_22px]" />
          <div className="absolute -inset-40 bg-[radial-gradient(circle,rgb(var(--accent-rgb,52_211_153)_/_0.12),transparent_60%)]" />
        </div>

        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p data-footer-reveal className="text-xs text-white/60">
            <span className="font-semibold text-white/80">Wake up.</span> Built with React + Vite. Motion by GSAP.
          </p>

          <div data-footer-reveal className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <button type="button" onClick={() => scrollToId("top")} className="text-white/65 hover:text-white">
              Back to top
            </button>
            <button type="button" onClick={() => scrollToId("projects")} className="text-white/65 hover:text-white">
              Projects
            </button>
            <button type="button" onClick={() => scrollToId("skills")} className="text-white/65 hover:text-white">
              Skills
            </button>
            <button type="button" onClick={() => scrollToId("contact")} className="text-white/65 hover:text-white">
              Contact
            </button>
          </div>

          <p data-footer-reveal className="text-xs text-white/45">
            © {year} David Barragán
          </p>
        </div>
      </div>
    </footer>
  )
}
