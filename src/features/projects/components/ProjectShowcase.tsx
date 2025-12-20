import * as React from "react"
import { gsap } from "gsap"
import type { Project } from "../types"
import { prefersReducedMotion } from "@/lib/motion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog"
import { Carousel } from "@/components/ui/shadcn/carousel"

export function ProjectShowcase({
  project,
  reverse = false,
}: Readonly<{ project: Project; reverse?: boolean }>) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (prefersReducedMotion()) return
    const root = rootRef.current
    if (!root) return

    const media = root.querySelector<HTMLElement>("[data-project-media]")
    const glow = root.querySelector<HTMLElement>("[data-project-glow]")
    const shine = root.querySelector<HTMLElement>("[data-project-shine]")
    const orb = root.querySelector<HTMLElement>("[data-project-orb]")

    if (!media) return

    // Accent-aware orb color (reads CSS token)
    if (orb) {
      const raw = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim()
      const parts = raw.includes(",") ? raw.split(",") : raw.split(" ")
      const r = Number(parts[0])
      const g = Number(parts[1])
      const b = Number(parts[2])
      const rr = Number.isFinite(r) ? r : 52
      const gg = Number.isFinite(g) ? g : 211
      const bb = Number.isFinite(b) ? b : 153

      orb.style.background = `radial-gradient(circle, rgba(${rr},${gg},${bb},0.22) 0%, rgba(${rr},${gg},${bb},0.10) 35%, rgba(0,0,0,0) 70%)`
    }

    gsap.set(media, { transformPerspective: 900, transformOrigin: "50% 50%" })
    if (orb) gsap.set(orb, { xPercent: -50, yPercent: -50, autoAlpha: 0 })

    const moveOrb = (e: MouseEvent) => {
      if (!orb) return
      const r = root.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      gsap.to(orb, { x, y, autoAlpha: 1, duration: 0.25, ease: "power3.out" })
    }

    const onMove = (e: MouseEvent) => {
      const r = root.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      const rotY = (px - 0.5) * 7
      const rotX = -(py - 0.5) * 5

      gsap.to(media, {
        rotateX: rotX,
        rotateY: rotY,
        scale: 1.02,
        duration: 0.6,
        ease: "power3.out",
      })

      if (shine) {
        gsap.to(shine, {
          xPercent: (px - 0.5) * 30,
          yPercent: (py - 0.5) * 20,
          duration: 0.6,
          ease: "power3.out",
        })
      }

      moveOrb(e)
    }

    const onEnter = () => {
      gsap.killTweensOf([media, glow, shine, orb])
      if (glow) gsap.to(glow, { autoAlpha: 1, duration: 0.45, ease: "power3.out" })
      if (shine) gsap.to(shine, { autoAlpha: 1, duration: 0.3, ease: "power2.out" })

      // one subtle sweep
      if (shine) {
        gsap.fromTo(
          shine,
          { xPercent: -40, yPercent: -20 },
          { xPercent: 40, yPercent: 20, duration: 1.15, ease: "sine.inOut" }
        )
      }

      root.addEventListener("mousemove", onMove)
    }

    const onLeave = () => {
      root.removeEventListener("mousemove", onMove)
      gsap.killTweensOf([media, glow, shine, orb])
      gsap.to(media, { rotateX: 0, rotateY: 0, scale: 1, duration: 0.9, ease: "power3.out" })
      if (glow) gsap.to(glow, { autoAlpha: 0, duration: 0.6, ease: "power3.out" })
      if (shine) gsap.to(shine, { autoAlpha: 0, duration: 0.35, ease: "power3.out" })
      if (orb) gsap.to(orb, { autoAlpha: 0, duration: 0.25, ease: "power3.out" })
    }

    root.addEventListener("mouseenter", onEnter)
    root.addEventListener("mouseleave", onLeave)

    return () => {
      root.removeEventListener("mouseenter", onEnter)
      root.removeEventListener("mouseleave", onLeave)
      root.removeEventListener("mousemove", onMove)
      gsap.killTweensOf([media, glow, shine, orb])
    }
  }, [])

  const images = React.useMemo(() => {
    const g = project.images.gallery ?? []
    const all = [project.images.cover, ...g]
    // de-dupe by src
    const seen = new Set<string>()
    return all.filter((im) => {
      if (seen.has(im.src)) return false
      seen.add(im.src)
      return true
    })
  }, [project.images.cover, project.images.gallery])

  const gridClass = reverse
    ? "grid gap-6 p-6 md:grid-cols-[0.9fr_1.1fr] md:items-center md:p-8"
    : "grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr] md:items-center md:p-8"

  return (
    <div
      ref={rootRef}
      data-reveal-item
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/25 backdrop-blur"
    >
      {/* subtle texture so it isn't flat */}
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_40%),radial-gradient(circle_at_85%_30%,rgba(255,255,255,0.04),transparent_45%),radial-gradient(circle_at_40%_90%,rgba(255,255,255,0.03),transparent_50%)]" />

      {/* accent glow (shown on hover) */}
      <div className="pointer-events-none absolute inset-0 opacity-0" data-project-glow>
        <div className="absolute -inset-48 bg-[radial-gradient(circle,rgba(0,255,170,0.14),transparent_60%)] [html[data-accent='red']_&]:bg-[radial-gradient(circle,rgba(255,60,90,0.18),transparent_60%)] [html[data-accent='cyan']_&]:bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_60%)] [html[data-accent='violet']_&]:bg-[radial-gradient(circle,rgba(167,139,250,0.18),transparent_60%)] [html[data-accent='amber']_&]:bg-[radial-gradient(circle,rgba(251,191,36,0.18),transparent_60%)]" />
      </div>

      {/* accent orb that follows the mouse (smaller than full glow) */}
      <div
        data-project-orb
        className="pointer-events-none absolute left-0 top-0 h-36 w-36 rounded-full blur-3xl opacity-0"
      />

      <div className={gridClass}>
        {/* Left/Right blocks */}
        <div className={reverse ? "order-2 md:order-2" : "order-2 md:order-1"}>
          <p className="text-xs font-semibold tracking-[0.25em] text-white/55">{project.category.toUpperCase()}</p>

          <h3 className="mt-3 text-2xl font-extrabold text-white md:text-3xl">{project.title}</h3>
          {project.subtitle ? <p className="mt-2 text-sm text-white/70">{project.subtitle}</p> : null}

          <p className="mt-4 text-sm leading-relaxed text-white/72">{project.description}</p>

          {project.highlights?.length ? (
            <ul className="mt-5 space-y-2 text-sm text-white/70">
              {project.highlights.slice(0, 4).map((h) => (
                <li key={h} className="flex gap-2">
                  <span className="mt-1.75 h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {project.tech?.length ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {project.tech.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5"
                  title={t.name}
                >
                  {t.iconSrc ? <img src={t.iconSrc} alt="" aria-hidden className="h-4 w-4 object-contain" /> : null}
                  <span className="text-xs text-white/75">{t.name}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-2">
            {project.links.map((l) => (
              <a
                key={`${project.id}-${l.kind}-${l.href}`}
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                className="rounded-full border border-white/15 bg-transparent px-4 py-2 text-xs text-white/80 hover:bg-white/5"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <div className={reverse ? "order-1 md:order-1" : "order-1 md:order-2"}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/35 text-left"
          >
            <div data-project-media className="relative">
              <div className="relative h-56 w-full bg-black/55 md:h-80">
                <img src={project.images.cover.src} alt={project.images.cover.alt} className="h-full w-full object-contain" loading="lazy" />

                <div
                  data-project-shine
                  className="pointer-events-none absolute inset-0 opacity-0"
                  style={{
                    background:
                      "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.16) 35%, rgba(255,255,255,0.06) 55%, transparent 75%)",
                  }}
                />

                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-black/5" />

                <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs text-white/80">
                  Click to open gallery
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{project.title}</DialogTitle>
            <DialogDescription>{project.subtitle ?? project.description}</DialogDescription>
          </DialogHeader>
          <Carousel images={images} className="mt-3" />
        </DialogContent>
      </Dialog>
    </div>
  )
}
