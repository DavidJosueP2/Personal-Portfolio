import type { Project } from "../types"
import { ProjectShowcase } from "./ProjectShowcase"

export function ProjectsGrid({ projects }: Readonly<{ projects: Project[] }>) {
  return (
    <div className="space-y-6">
      {projects.map((p, idx) => (
        <ProjectShowcase key={p.id} project={p} reverse={idx % 2 === 1} />
      ))}
    </div>
  )
}
