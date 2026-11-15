import { useEffect, useRef } from "react"
import { setupRevealList } from "@/lib/gsap-reveal-list"
import { scrollToSection } from "@/lib/section-stack"

const links = [
  { id: "top", label: "Back to top" },
  { id: "services", label: "Services" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
]

export function Footer() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const footer = rootRef.current
    if (footer) return setupRevealList(footer)
  }, [])

  const year = new Date().getFullYear()

  return (
    <footer ref={rootRef} className="portfolio-container flex flex-col gap-y-3 border-t border-ink/12 py-5 text-xs md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-5 md:py-7">
      <p data-reveal-item className="text-ink/65">
        <span className="font-semibold text-ink/80">Wake up.</span> Built with React + Vite. Motion by GSAP.
      </p>

      <nav data-reveal-item aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-5 gap-y-1">
        {links.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            data-slot="footer-link"
            onClick={() => scrollToSection(id)}
            className="min-h-10 cursor-pointer text-ink/65 underline-offset-4 hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
          >
            {label}
          </button>
        ))}
      </nav>

      <p data-reveal-item className="text-ink/65">© {year} David Barragán</p>
    </footer>
  )
}
