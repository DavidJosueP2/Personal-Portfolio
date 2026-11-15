import { ProjectsGrid } from "@/features/projects/components/ProjectsGrid"
import { getPortfolioProjects } from "@/features/projects/data/projects"

const portfolioProjects = getPortfolioProjects()

export function ProjectsSection() {
  return (
    <section id="projects" aria-labelledby="projects-heading" className="portfolio-container portfolio-section">
      <div data-section-motion="heading" className="mb-7 border-b border-ink/10 pb-5 sm:mb-8 sm:pb-6">
        <h2 id="projects-heading" className="font-display text-4xl leading-none text-heading sm:text-5xl">
          Projects
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-copy sm:text-base">
          Microservices on Azure, <em className="font-serif-italic text-heading">distributed data</em>, and full-stack applications.
        </p>
      </div>

      <ProjectsGrid projects={portfolioProjects} />
    </section>
  )
}
