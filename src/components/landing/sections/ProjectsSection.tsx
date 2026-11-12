import { ProjectsGrid } from "@/features/projects/components/ProjectsGrid"
import { getPortfolioProjects } from "@/features/projects/data/projects"

const portfolioProjects = getPortfolioProjects()

export function ProjectsSection() {
  return (
    <section id="projects" aria-labelledby="projects-heading" className="mx-auto w-full max-w-6xl scroll-mt-7 px-6 py-16 sm:py-20">
      <div className="mb-7 border-b border-white/10 pb-5 sm:mb-8 sm:pb-6">
        <h2 id="projects-heading" className="font-display text-4xl leading-none text-[#ece9e2] sm:text-5xl">
          Projects
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#afb7bd] sm:text-base">
          Microservices on Azure, distributed data, and full-stack applications.
        </p>
      </div>

      <ProjectsGrid projects={portfolioProjects} />
    </section>
  )
}
