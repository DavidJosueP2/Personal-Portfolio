import { ArrowRight, ArrowUpRight } from "lucide-react"
import { socialLogos } from "@/assets/img/tech"
import { cn } from "@/lib/utils"
import type { Project } from "../types"
import { ProjectGalleryDialog } from "./ProjectGalleryDialog"

type Props = {
  project: Project
  className: string
  lead: boolean
}

export function ProjectCard({ project, className, lead }: Readonly<Props>) {
  const { cover, previewSrc } = project.images
  const technologies = project.tech?.filter(({ iconSrc }) => iconSrc) ?? []
  const repositories = project.links.filter(({ kind }) => kind === "repo")
  const demo = project.links.find(({ kind }) => kind === "demo")

  return (
    <article
      data-reveal-item
      className={cn(
        "portfolio-glass group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 motion-safe:transition-colors hover:border-white/20 md:backdrop-blur-xs",
        className,
      )}
    >
      <div className="flex grow flex-col px-4 pt-5 sm:px-5 lg:px-6 lg:pt-6">
        <h3 className={cn(
          "text-balance font-display text-[1.45rem] leading-tight text-[#ece9e2] sm:text-[1.65rem]",
          lead && "lg:text-[1.9rem]",
        )}>
          {project.title}
        </h3>
        <p className="mt-2 max-w-[53ch] text-sm leading-relaxed text-[#afb7bd]">
          {project.subtitle ?? project.description}
        </p>

        <div className="mt-auto pt-4">
          {technologies.length > 0 ? (
            <ul aria-label="Technologies" className="flex flex-wrap items-center gap-3">
              {technologies.map(({ name, iconSrc }) => (
                <li key={name} title={name}>
                  <img src={iconSrc} alt={name} width={20} height={20} loading="lazy" decoding="async" className="h-5 w-5 object-contain" />
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4">
            <ProjectGalleryDialog project={project}>
              <button
                type="button"
                data-slot="project-trigger"
                aria-label={`View project: ${project.title}`}
                className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-sm text-sm font-medium text-[rgb(var(--accent-rgb)_/_0.86)] hover:text-[rgb(var(--accent-rgb))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb))]"
              >
                View project
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </ProjectGalleryDialog>

            {demo || repositories.length > 0 ? (
              <ul aria-label={demo ? "Project links" : "GitHub repositories"} className="flex flex-wrap items-center gap-x-3">
                {demo ? (
                  <li>
                    <a
                      href={demo.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Visit ${project.title} live site`}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-xs font-medium text-[#afb7bd]! hover:text-white! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb))]"
                    >
                      {demo.label}
                      <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    </a>
                  </li>
                ) : null}
                {repositories.map(({ href, label }) => (
                  <li key={href}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label === "GitHub" ? `${project.title} on GitHub` : `${project.title}: ${label} repository on GitHub`}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-xs font-medium text-[#afb7bd]! hover:text-white! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb))]"
                    >
                      <img src={socialLogos.GitHub} width={15} height={15} alt="" className="h-3.75 w-3.75 object-contain opacity-85" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-2 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6">
        <div className={cn(
          "aspect-[2.08] overflow-hidden rounded-lg border border-white/12 bg-[#0c1012] md:aspect-auto",
          project.category === "microservices" ? "md:h-44 lg:h-55" : "md:h-38 lg:h-45",
        )}>
          <img
            src={previewSrc ?? cover.src}
            alt={cover.alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-top opacity-90 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-300"
          />
        </div>
      </div>
    </article>
  )
}
