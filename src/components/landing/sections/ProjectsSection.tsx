import * as React from "react"
import { projects, getFeaturedProjects } from "@/features/projects/data/projects"
import { filterProjects } from "@/features/projects/utils/filterProjects"
import { ProjectsExperience } from "@/features/projects/components/ProjectsExperience"

export function ProjectsSection() {
  const [query, setQuery] = React.useState("")
  const [featuredOnly, setFeaturedOnly] = React.useState(true)

  const visibleProjects = React.useMemo(() => {
    const base = featuredOnly ? getFeaturedProjects() : projects
    return filterProjects(base, { query })
  }, [featuredOnly, query])

  return (
    <section id="projects" className="mx-auto w-full max-w-6xl px-6 py-20 overflow-x-clip">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2
            className="text-3xl font-extrabold text-white md:text-4xl"
            style={{ fontFamily: "Gloock, Onest, system-ui" }}
          >
            Projects
          </h2>
          <p className="mt-2 max-w-prose text-sm text-white/70">Scroll to switch projects.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <label className="w-full sm:w-auto">
            <span className="sr-only">Search projects</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-full border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white/85 placeholder:text-white/35 outline-none ring-0 focus:border-white/20 sm:w-64"
            />
          </label>
        </div>
      </div>

      <div className="mt-10">
        <ProjectsExperience projects={visibleProjects} />
      </div>
    </section>
  )
}
