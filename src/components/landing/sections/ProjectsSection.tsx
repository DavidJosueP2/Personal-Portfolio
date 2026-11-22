import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ProjectsShowcase } from "@/features/projects/components/ProjectsShowcase"
import { getPortfolioProjects } from "@/features/projects/data/projects"

export function ProjectsSection() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const portfolioProjects = useMemo(() => getPortfolioProjects(t, language), [t, language])

  return portfolioProjects.length > 0 ? <ProjectsShowcase projects={portfolioProjects} /> : null
}
