import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import type { Project } from "../types"
import { prefersReducedMotion } from "@/lib/motion"
import { ProjectGalleryDialog } from "./ProjectGalleryDialog"
import { ProjectsRail } from "./ProjectsRail"
import { ProjectsExperienceLeftMedia } from "./ProjectsExperienceLeftMedia"

type Props = {
  projects: Project[]
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function readAccentRGB() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim()
  const parts = raw.includes(",") ? raw.split(",") : raw.split(" ")
  const r = Number(parts[0])
  const g = Number(parts[1])
  const b = Number(parts[2])
  return {
    r: Number.isFinite(r) ? r : 52,
    g: Number.isFinite(g) ? g : 211,
    b: Number.isFinite(b) ? b : 153,
  }
}

function formatIndex(n: number) {
  return String(n).padStart(2, "0")
}

function formatCategory(category: Project["category"]) {
  switch (category) {
    case "microservices":
      return "Microservices"
    case "fullstack":
      return "Fullstack"
    case "web":
      return "Web"
    case "backend":
      return "Backend"
    case "mobile":
      return "Mobile"
    case "devops":
      return "DevOps"
    case "other":
      return "Other"
  }
}

function formatCategoryLabel(category: Project["category"]) {
  return formatCategory(category).toUpperCase()
}

/**
 * One-at-a-time projects experience (scroll-driven):
 * - Pinned section via ScrollTrigger
 * - Scroll progress maps to discrete steps (0..N-1) with snap
 * - Single source of truth: activeProjectIndex
 * - Only the active project renders the heavy content (gallery + right panel)
 * - Previews render minimal UI and are synced with active index
 */
export function ProjectsExperience({ projects }: Readonly<Props>) {
  const hostRef = React.useRef<HTMLElement | null>(null)
  const pinRef = React.useRef<HTMLDivElement | null>(null)

  const [activeProjectIndex, setActiveProjectIndex] = React.useState(0)
  const safeProjects = projects.length ? projects : []

  const [showRail, setShowRail] = React.useState(false)

  // Keep active index valid even if filters change the list length
  React.useEffect(() => {
    if (!safeProjects.length) return
    setActiveProjectIndex((prev) => clamp(prev, 0, safeProjects.length - 1))
  }, [safeProjects.length])

  const activeRef = React.useRef(activeProjectIndex)
  React.useEffect(() => {
    activeRef.current = activeProjectIndex
  }, [activeProjectIndex])

  // keep accent values up-to-date
  React.useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const applyAccent = () => {
      const { r, g, b } = readAccentRGB()
      host.style.setProperty("--px", String(r))
      host.style.setProperty("--py", String(g))
      host.style.setProperty("--pz", String(b))
    }

    applyAccent()

    const mo = new MutationObserver(() => applyAccent())
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-accent", "style", "class"] })

    return () => mo.disconnect()
  }, [])

  // ScrollTrigger: pin + steps + snap
  React.useEffect(() => {
    if (!safeProjects.length) return
    if (prefersReducedMotion()) return

    gsap.registerPlugin(ScrollTrigger)

    const host = hostRef.current
    const pin = pinRef.current
    if (!host || !pin) return

    const totalSteps = Math.max(1, safeProjects.length)

    const getNavHeight = () => {
      const nav = document.querySelector("header") as HTMLElement | null
      if (!nav) return 0
      const rect = nav.getBoundingClientRect()
      return Number.isFinite(rect.height) ? rect.height : 0
    }

    const getViewportAvailableHeight = () => {
      // visible viewport below the fixed navbar
      return Math.max(1, window.innerHeight - getNavHeight())
    }

    const getPinHeight = () => {
      // Prefer real rendered height instead of assuming 92vh
      const rect = pin.getBoundingClientRect()
      return Math.max(1, Math.round(rect.height || 0))
    }

    const stepPx = () => {
      // Match scroll distance per-project to what user actually sees
      // (viewport without navbar) and keep it stable even on resize.
      return Math.max(1, Math.round(getViewportAvailableHeight() * 0.92))
    }

    const start = () => {
      // We want to pin when the pinned stage is centered in the *available* viewport
      // (viewport height minus navbar).
      //
      // Condition for centering:
      //   pinTop == navHeight + (availableHeight - pinHeight)/2
      const navH = getNavHeight()
      const availableH = getViewportAvailableHeight()
      const pinH = getPinHeight()
      const desiredTop = navH + Math.max(0, (availableH - pinH) / 2)

      // ScrollTrigger parsing: "top top+=X" means trigger's top reaches viewport top + X
      // So we convert desiredTop into a top offset.
      return `top top+=${Math.round(desiredTop)}`
    }

    const st = ScrollTrigger.create({
      trigger: host,
      start,
      end: () => `+=${(totalSteps - 1) * stepPx()}`,
      pin: pin,
      pinSpacing: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      snap:
        totalSteps <= 1
          ? undefined
          : {
              snapTo: (value) => {
                const step = 1 / (totalSteps - 1)
                return Math.round(value / step) * step
              },
              duration: { min: 0.12, max: 0.28 },
              ease: "power2.out",
            },
      onUpdate: (self) => {
        if (totalSteps <= 1) return
        const idx = clamp(Math.round(self.progress * (totalSteps - 1)), 0, totalSteps - 1)
        if (idx !== activeRef.current) setActiveProjectIndex(idx)
      },
    })

    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener("resize", refresh)
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      window.removeEventListener("resize", refresh)
      cancelAnimationFrame(raf)
      st.kill()
    }
  }, [safeProjects.length])

  // Scope the fixed rail to the Projects section only (no extra ScrollTriggers).
  React.useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        setShowRail(Boolean(e?.isIntersecting))
      },
      // Tight margins so it doesn't appear during About or linger into Skills.
      // It will show when the section is roughly in the middle band of the viewport.
      { root: null, threshold: 0, rootMargin: "-30% 0px -30% 0px" }
    )

    io.observe(host)
    return () => io.disconnect()
  }, [])

  if (!safeProjects.length) return null

  return (
    <section
      ref={hostRef}
      className="relative w-full overflow-x-clip"
      style={{ scrollbarGutter: "stable" }}
    >
      {/*
        Rail: keep mounted to avoid React commit crashes while ScrollTrigger pins/unpins.
        We only toggle visibility + pointer-events.
      */}
      <div
        className={
          "transition-opacity duration-150 " +
          (showRail ? "opacity-100" : "pointer-events-none opacity-0")
        }
        aria-hidden={!showRail}
      >
        <ProjectsRail
          projects={safeProjects}
          activeIndex={activeProjectIndex}
          onSelect={(idx) => setActiveProjectIndex(clamp(idx, 0, safeProjects.length - 1))}
        />
      </div>

      {/* The pinned stage (drives the scroll-to-switch-projects experience) */}
      <div ref={pinRef} className="relative h-[92vh] w-full overflow-x-clip">
        <div className="pointer-events-auto mx-auto h-full w-full px-4 sm:px-6">
          <div className="relative mx-auto h-full w-full max-w-[1400px] min-w-0">
            <ProjectPanel
              key={safeProjects[activeProjectIndex].id}
              project={safeProjects[activeProjectIndex]}
              index={activeProjectIndex}
              count={safeProjects.length}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function ProjectPanel({
  project,
  index,
  count,
}: Readonly<{
  project: Project
  index: number
  count: number
}>) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const leftRef = React.useRef<HTMLDivElement | null>(null)
  const rightRef = React.useRef<HTMLDivElement | null>(null)

  const [galleryOpen, setGalleryOpen] = React.useState(false)

  // Close gallery when switching projects to avoid showing stale images
  React.useEffect(() => {
    setGalleryOpen(false)
  }, [project.id])

  // transitions (gallery + right panel) on project change
  React.useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const left = leftRef.current
    const right = rightRef.current
    if (!left || !right) return

    gsap.killTweensOf([left, right])

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } })

    // Start from a clean known state
    gsap.set([left, right], { willChange: "transform,opacity,filter" })

    // Quick, subtle exit to avoid a hard cut when switching projects
    tl.to([left, right], { autoAlpha: 0, y: -5, filter: "blur(5px)", duration: 0.10 }, 0)

    // Enter faster but still smooth
    tl.fromTo(
      left,
      { autoAlpha: 0, y: 10, filter: "blur(10px)" },
      { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.36 },
      0.06
    )
    tl.fromTo(
      right,
      { autoAlpha: 0, y: 12, filter: "blur(12px)" },
      { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.40 },
      0.08
    )

    return () => {
      tl.kill()
      gsap.killTweensOf([left, right])
      gsap.set([left, right], { clearProps: "opacity,visibility,filter,transform,willChange" })
    }
  }, [project.id])

  return (
    <div ref={rootRef} className="relative min-w-0 h-full">
      <div className="grid h-full min-w-0 items-center gap-10 max-md:grid-cols-1 max-md:items-start max-md:gap-6 md:grid-cols-[minmax(520px,0.9fr)_minmax(0,1.1fr)]">
        {/* LEFT */}
        <div ref={leftRef} className="relative min-w-0">
          <ProjectsExperienceLeftMedia
            project={project}
            onOpenGallery={() => setGalleryOpen(true)}
            hoverRef={rootRef}
          />
          <ProjectGalleryDialog project={project} open={galleryOpen} onOpenChange={setGalleryOpen} />
        </div>

        {/* RIGHT */}
        <div ref={rightRef} className="relative min-w-0">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-8 backdrop-blur">
            <div
              data-info-bg
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.08), transparent 45%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05), transparent 50%), linear-gradient(120deg, rgba(255,255,255,0.03), transparent 55%)",
                backgroundSize: "180% 180%",
                backgroundPosition: "0% 0%",
              }}
            />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold tracking-[0.35em] text-white/55">
                  {project.featured ? "★ " : ""}
                  {formatCategoryLabel(project.category)}
                </p>

                {project.status ? (
                  <ProjectStatusPill status={project.status} />
                ) : null}
              </div>

              <h3 className="mt-4 text-4xl leading-[0.98] text-white" style={{ fontFamily: "Gloock, Onest, system-ui" }}>
                {project.title}
              </h3>

              {project.subtitle ? <p className="mt-3 text-sm text-white/70">{project.subtitle}</p> : null}

              <p className="mt-5 text-sm leading-relaxed text-white/75">{project.description}</p>

              {/* Highlights */}
              {project.highlights?.length ? (
                <ul className="mt-6 space-y-2 text-sm text-white/70">
                  {project.highlights.map((h) => (
                    <li key={`${project.id}-hl-${h}`} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {/* Tech (icons) */}
              {project.tech?.length ? (
                <div className="mt-7">
                  <p className="text-xs font-semibold tracking-[0.25em] text-white/55">TECH</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {project.tech.map((t) => (
                      <div
                        key={`${project.id}-tech-${t.name}`}
                        className="flex items-center gap-2 rounded-full border border-white/12 bg-black/25 px-3 py-1.5"
                        title={t.name}
                      >
                        {t.iconSrc ? <img src={t.iconSrc} alt="" aria-hidden className="h-4 w-4 object-contain" /> : null}
                        <span className="text-xs text-white/80">{t.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Links */}
              {project.links.length ? (
                <div className="mt-7 flex flex-wrap gap-2">
                  {project.links.map((l, li) => (
                    <a
                      key={`link-${project.id}-${l.kind}-${l.href}-${li}`}
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                      className="rounded-full border border-white/15 bg-transparent px-4 py-2 text-xs text-white/80 hover:bg-white/5"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 text-xs text-white/40">
            {formatIndex(index + 1)} / {formatIndex(count)}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectStatusPill({ status }: Readonly<{ status: NonNullable<Project["status"]> }>) {
  const klass =
    status === "live"
      ? "border-emerald-200/20 bg-emerald-400/10 text-emerald-100"
      : status === "wip"
        ? "border-amber-200/20 bg-amber-400/10 text-amber-100"
        : "border-white/10 bg-white/5 text-white/65"

  return (
    <span className={"rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase " + klass}>
      {status}
    </span>
  )
}
