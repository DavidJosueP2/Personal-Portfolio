import { ProjectsShowcase } from "@/features/projects/components/ProjectsShowcase"
import { getPortfolioProjects } from "@/features/projects/data/projects"

const portfolioProjects = getPortfolioProjects()

export function ProjectsSection() {
  return portfolioProjects.length > 0 ? <ProjectsShowcase projects={portfolioProjects} /> : null
}
