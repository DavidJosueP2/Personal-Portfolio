import * as React from "react"
import { Button } from "@/components/ui/shadcn/button"
import { prefersReducedMotion } from "@/lib/motion"
import { setupReveal } from "@/lib/gsap-reveal"
import { setupRevealList } from "@/lib/gsap-reveal-list"
import { projects, getFeaturedProjects } from "@/features/projects/data/projects"
import { filterProjects } from "@/features/projects/utils/filterProjects"
import { ProjectsGrid } from "@/features/projects/components/ProjectsGrid"

export function ProjectsSection() {
  const rootRef = React.useRef<HTMLElement | null>(null)
  const gridRef = React.useRef<HTMLDivElement | null>(null)

  const [query, setQuery] = React.useState("")
  const [featuredOnly, setFeaturedOnly] = React.useState(true)

  const visibleProjects = React.useMemo(() => {
    const base = featuredOnly ? getFeaturedProjects() : projects
    return filterProjects(base, { query })
  }, [featuredOnly, query])

  React.useEffect(() => {
    if (prefersReducedMotion()) return
    const root = rootRef.current
    if (!root) return
    return setupReveal(root, { y: 16, stagger: 0.06 })
  }, [])

  React.useEffect(() => {
    if (prefersReducedMotion()) return
    const grid = gridRef.current
    if (!grid) return
    return setupRevealList(grid, { y: 18, duration: 0.75 })
  }, [visibleProjects.length])

  return (
    <section ref={rootRef} id="projects" className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 data-reveal className="text-2xl font-extrabold text-white">Projects</h2>
          <p data-reveal className="mt-2 max-w-prose text-sm text-white/70">
            Each project is a full build: architecture, infra, and real trade-offs. Click any preview to open its gallery.
          </p>
        </div>

        <div data-reveal className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFeaturedOnly((v) => !v)}
            className={
              "rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.12em] transition-colors " +
              (featuredOnly
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/15 bg-transparent text-white/75 hover:bg-white/5")
            }
          >
            {featuredOnly ? "FEATURED" : "ALL"}
          </button>

          <Button
            variant="outline"
            className="rounded-full border-white/15 bg-transparent text-white/80 hover:bg-white/5"
            type="button"
          >
            View all
          </Button>
        </div>
      </div>

      <div data-reveal className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="w-full sm:max-w-sm">
          <span className="sr-only">Search projects</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search (stack, tags, title–)"
            className="w-full rounded-full border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white/85 placeholder:text-white/35 outline-none ring-0 focus:border-white/20"
          />
        </label>

        <p className="text-xs text-white/55">Showing {visibleProjects.length} project(s)</p>
      </div>

      <div ref={gridRef} className="mt-10">
        <ProjectsGrid projects={visibleProjects} />
      </div>
    </section>
  )
}
