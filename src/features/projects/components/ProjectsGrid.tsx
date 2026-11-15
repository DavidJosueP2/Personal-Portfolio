import { useEffect, useRef } from "react"
import { setupRevealList } from "@/lib/gsap-reveal-list"
import type { Project } from "../types"
import { ProjectCard } from "./ProjectCard"

const columnSpans = ["md:col-span-7", "md:col-span-5", "md:col-span-5", "md:col-span-7"]

export function ProjectsGrid({ projects }: Readonly<{ projects: Project[] }>) {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const grid = gridRef.current
    if (grid) return setupRevealList(grid)
  }, [projects])

  return (
    <div ref={gridRef} data-section-motion="media" className="grid gap-4 md:grid-cols-12 md:gap-5">
      {projects.map((project, index) => {
        const fillsLastRow = index === projects.length - 1 && index % 2 === 0
        return (
          <ProjectCard
            key={project.id}
            project={project}
            className={fillsLastRow ? "md:col-span-12" : columnSpans[index % columnSpans.length]}
            lead={index === 0}
          />
        )
      })}
    </div>
  )
}
