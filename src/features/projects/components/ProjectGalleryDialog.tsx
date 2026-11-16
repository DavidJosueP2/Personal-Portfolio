import type { ReactElement } from "react"
import { ArrowUpRight, X } from "lucide-react"
import { socialLogos } from "@/assets/img/tech"
import type { Project } from "../types"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/shadcn/dialog"
import { Carousel } from "@/components/ui/shadcn/carousel"

function dedupeImages(project: Project) {
  const all = [project.images.cover, ...(project.images.gallery ?? [])]
  const seen = new Set<string>()
  return all.filter((image) => {
    if (seen.has(image.src)) return false
    seen.add(image.src)
    return true
  })
}

const statusLabels: Record<NonNullable<Project["status"]>, string> = {
  live: "Deployment live",
  offline: "Deployment offline",
  wip: "In development",
}

type Props = {
  project: Project
  children: ReactElement
}

export function ProjectGalleryDialog({ project, children }: Readonly<Props>) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden bg-panel p-0 backdrop-blur-none sm:max-h-[calc(100dvh-3rem)]">
        <DialogHeader className="flex-row items-start justify-between gap-3 border-b border-ink/10 px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <DialogTitle className="font-display text-2xl font-normal leading-tight sm:text-3xl">
              {project.title}
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-2xl leading-relaxed">
              {project.description}
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              data-slot="dialog-close"
              aria-label="Close project"
              className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-lg border border-ink/15 text-ink/85 hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="grid min-h-0 min-w-0 gap-6 overflow-y-auto overscroll-contain p-4 sm:p-6 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] md:gap-7">
          <Carousel images={dedupeImages(project)} />

          <div className="min-w-0 space-y-5">
            {project.highlights?.length ? (
              <section>
                <h3 className="font-semibold text-ink">Technical highlights</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-ink/75 marker:text-accent-ink">
                  {project.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                </ul>
              </section>
            ) : null}

            {project.stack.length > 0 ? (
              <section>
                <h3 className="font-semibold text-ink">Technology stack</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">{project.stack.join(" · ")}</p>
              </section>
            ) : null}

            {project.links.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-ink/15 px-3 text-sm text-ink/85! hover:bg-ink/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
                  >
                    {link.kind === "repo" ? <img src={socialLogos.GitHub} width={16} height={16} alt="" className="h-4 w-4 object-contain" data-monochrome-logo /> : null}
                    {link.label}
                    {link.kind !== "repo" ? <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /> : null}
                  </a>
                ))}
              </div>
            ) : null}

            {project.status ? <p className="text-xs text-ink/65">{statusLabels[project.status]}</p> : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
