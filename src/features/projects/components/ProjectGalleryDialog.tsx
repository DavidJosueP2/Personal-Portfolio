import * as React from "react"
import type { Project } from "../types"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog"
import { Carousel } from "@/components/ui/shadcn/carousel"

function dedupeImages(project: Project) {
  const g = project.images.gallery ?? []
  const all = [project.images.cover, ...g]
  const seen = new Set<string>()
  return all.filter((im) => {
    if (seen.has(im.src)) return false
    seen.add(im.src)
    return true
  })
}

type Props = {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectGalleryDialog({ project, open, onOpenChange }: Readonly<Props>) {
  const images = React.useMemo(() => dedupeImages(project), [project])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 sm:p-6 max-h-[85vh] overflow-hidden">
        <DialogClose asChild>
          <button
            type="button"
            className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-xl border border-white/12 bg-black/35 text-white/90 backdrop-blur hover:bg-black/55 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Close"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </DialogClose>

        <div className="min-w-0 overflow-auto pr-1">
          <DialogHeader>
            <DialogTitle className="pr-10">{project.title}</DialogTitle>
            <DialogDescription>{project.subtitle ?? project.description}</DialogDescription>
          </DialogHeader>

          <Carousel images={images} className="mt-3" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
