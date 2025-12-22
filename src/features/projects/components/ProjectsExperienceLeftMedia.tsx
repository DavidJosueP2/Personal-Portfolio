import * as React from "react"
import { gsap } from "gsap"
import { prefersReducedMotion } from "@/lib/motion"
import type { Project } from "../types"

/**
 * Left media card for ProjectsExperience.
 *
 * Contract:
 * - Always render the cover image above decorative overlays.
 * - Decorative layers (fog/vignette/loading) must never hide the image.
 * - Click opens gallery.
 */
export function ProjectsExperienceLeftMedia({
  project,
  onOpenGallery,
  hoverRef,
}: Readonly<{
  project: Project
  onOpenGallery: () => void
  hoverRef?: React.RefObject<HTMLElement | null>
}>) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const cardRef = React.useRef<HTMLDivElement | null>(null)
  const imgRef = React.useRef<HTMLImageElement | null>(null)
  const fogRef = React.useRef<HTMLDivElement | null>(null)

  const [coverLoaded, setCoverLoaded] = React.useState(false)
  const [coverFailed, setCoverFailed] = React.useState(false)

  const cover = project.images.cover

  React.useEffect(() => {
    setCoverLoaded(false)
    setCoverFailed(false)
  }, [project.id])

  // Parallax hover (card + image + fog). Keep this scoped to the media only.
  React.useEffect(() => {
    if (prefersReducedMotion()) return

    const scopeEl = hoverRef?.current ?? rootRef.current
    const card = cardRef.current
    const img = imgRef.current
    const fog = fogRef.current
    if (!scopeEl || !card || !img) return

    gsap.set(card, { transformPerspective: 1000, transformOrigin: "50% 50%" })

    const onMove = (e: PointerEvent) => {
      const r = scopeEl.getBoundingClientRect()
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      if (!inside) return

      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      const rotY = (px - 0.5) * 10
      const rotX = -(py - 0.5) * 8

      gsap.to(card, { rotateX: rotX, rotateY: rotY, duration: 0.5, ease: "power3.out" })
      gsap.to(img, { x: (px - 0.5) * -18, y: (py - 0.5) * -14, duration: 0.5, ease: "power3.out" })
      if (fog) {
        gsap.to(fog, {
          xPercent: (px - 0.5) * 10,
          yPercent: (py - 0.5) * 6,
          duration: 0.7,
          ease: "sine.out",
        })
      }
    }

    const reset = () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, scale: 1, duration: 0.7, ease: "power3.out" })
      gsap.to(img, { x: 0, y: 0, duration: 0.7, ease: "power3.out" })
      if (fog) gsap.to(fog, { xPercent: 0, yPercent: 0, duration: 0.9, ease: "power3.out" })
    }

    const onLeaveWindow = () => reset()

    gsap.to(card, { scale: 1.01, duration: 0.35, ease: "power3.out" })
    window.addEventListener("pointermove", onMove)
    window.addEventListener("blur", onLeaveWindow)

    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("blur", onLeaveWindow)
      gsap.killTweensOf([card, img, fog])
      reset()
    }
  }, [project.id, hoverRef])

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-[620px]">
      {/* energetic aura behind */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 opacity-95"
        style={{
          background:
            "radial-gradient(60% 55% at 40% 45%, rgba(var(--accent-rgb, 52 211 153) / 0.55) 0%, rgba(var(--accent-rgb, 52 211 153) / 0.18) 35%, rgba(0,0,0,0) 70%), radial-gradient(55% 45% at 75% 25%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 22%, rgba(0,0,0,0) 55%), radial-gradient(40% 35% at 25% 80%, rgba(var(--accent-rgb, 52 211 153) / 0.25) 0%, rgba(0,0,0,0) 60%)",
          filter: "blur(18px)",
        }}
      />

      <div
        ref={cardRef}
        data-water-card
        className="relative isolate overflow-hidden rounded-3xl bg-black/55 shadow-[0_25px_120px_rgba(0,0,0,0.70)]"
      >
        {/* IMPORTANT: this ring is decorative; keep it BEHIND the image */}
        <div className="pointer-events-none absolute inset-0 z-0 rounded-3xl ring-1 ring-white/8" aria-hidden />

        <div className="relative isolate h-[62vh] max-h-[520px] min-h-[340px] max-md:h-[48vh] max-md:min-h-[320px] group">
          {/* Decorative layers (always behind image) */}
          <div
            className={
              "pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 " +
              (coverLoaded ? "opacity-0" : "opacity-100")
            }
            aria-hidden
          >
            <div className="h-full w-full animate-pulse bg-white/3" />
            <div className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs text-white/70">
              Loading preview…
            </div>
          </div>

          <div
            ref={fogRef}
            data-accent-fog
            className="pointer-events-none absolute inset-0 z-0 mix-blend-screen opacity-75"
            style={{
              background:
                "radial-gradient(circle at 40% 45%, rgba(var(--accent-rgb, 52 211 153) / 0.55) 0%, rgba(var(--accent-rgb, 52 211 153) / 0.28) 22%, rgba(0,0,0,0) 58%)",
              filter: "blur(28px)",
            }}
          />

          <div className="pointer-events-none absolute inset-0 z-0 bg-linear-to-t from-black/55 via-black/10 to-black/10" />

          {coverFailed ? (
            <div className="absolute inset-0 z-20 grid place-items-center bg-black/30">
              <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-xs text-white/70">
                Preview unavailable
              </div>
            </div>
          ) : null}

          {/* Click on the image opens the gallery */}
          <img
            ref={imgRef}
            data-water-img
            key={cover.src}
            src={cover.src}
            alt={cover.alt}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer object-cover"
            loading="eager"
            decoding="async"
            onClick={onOpenGallery}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onOpenGallery()
            }}
            onLoad={() => {
              setCoverLoaded(true)
              setCoverFailed(false)
            }}
            onError={() => {
              setCoverLoaded(true)
              setCoverFailed(true)
              console.warn("Failed to load project cover:", cover.src)
            }}
          />

          {/* Top UI (doesn't block clicks, but stays above the image) */}
          <div className="pointer-events-none absolute inset-0 z-30" aria-hidden>
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.08),transparent_55%)]" />

            <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/55 px-3 py-1 text-xs text-white/85 backdrop-blur-sm">
              View gallery <span className="text-white/65">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
