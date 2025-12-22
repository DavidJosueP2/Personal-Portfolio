import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import type { Project } from "../types"
import { prefersReducedMotion } from "@/lib/motion"

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
export function ProjectsExperience({ projects }: Props) {
  const hostRef = React.useRef<HTMLElement | null>(null)
  const pinRef = React.useRef<HTMLDivElement | null>(null)

  const [activeProjectIndex, setActiveProjectIndex] = React.useState(0)
  const safeProjects = projects.length ? projects : []

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
    const stepPx = () => Math.max(1, Math.round(window.innerHeight * 0.92))

    const st = ScrollTrigger.create({
      trigger: host,
      start: "top top",
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

  if (!safeProjects.length) return null

  return (
    <section
      ref={hostRef}
      className="relative w-full overflow-x-clip"
      style={{ scrollbarGutter: "stable" }}
    >
      {/* The pinned stage (same height as the original implementation) */}
      <div ref={pinRef} className="relative h-[92vh] w-full overflow-x-clip">
        <div className="pointer-events-auto mx-auto h-full w-full px-4 sm:px-6">
          <div className="relative mx-auto h-full w-full max-w-[1400px] min-w-0">
            <ProjectPanel
              key={safeProjects[activeProjectIndex].id}
              project={safeProjects[activeProjectIndex]}
              allProjects={safeProjects}
              index={activeProjectIndex}
              count={safeProjects.length}
              onSelect={(idx) => setActiveProjectIndex(clamp(idx, 0, safeProjects.length - 1))}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function ProjectPanel({
  project,
  allProjects,
  index,
  count,
  onSelect,
}: Readonly<{
  project: Project
  allProjects: Project[]
  index: number
  count: number
  onSelect: (idx: number) => void
}>) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const leftRef = React.useRef<HTMLDivElement | null>(null)
  const rightRef = React.useRef<HTMLDivElement | null>(null)

  // transitions (gallery + right panel) on project change
  React.useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const left = leftRef.current
    const right = rightRef.current
    if (!left || !right) return

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
    tl.fromTo(left, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.38 }, 0)
    tl.fromTo(right, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.42 }, 0.02)

    return () => {
      tl.kill()
    }
  }, [project.id])

  // parallax hover effect (keep!)
  React.useEffect(() => {
    if (prefersReducedMotion()) return

    const root = rootRef.current
    if (!root) return

    const card = root.querySelector<HTMLElement>("[data-water-card]")
    const img = root.querySelector<HTMLElement>("[data-water-img]")
    const fog = root.querySelector<HTMLElement>("[data-accent-fog]")
    const infoBg = root.querySelector<HTMLElement>("[data-info-bg]")

    if (!card || !img) return

    gsap.set(card, { transformPerspective: 1000, transformOrigin: "50% 50%" })

    const onMove = (e: MouseEvent) => {
      const r = card.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      const rotY = (px - 0.5) * 10
      const rotX = -(py - 0.5) * 8

      gsap.to(card, { rotateX: rotX, rotateY: rotY, duration: 0.5, ease: "power3.out" })
      gsap.to(img, { x: (px - 0.5) * -18, y: (py - 0.5) * -14, duration: 0.5, ease: "power3.out" })
      if (fog) gsap.to(fog, { xPercent: (px - 0.5) * 10, yPercent: (py - 0.5) * 6, duration: 0.7, ease: "sine.out" })
    }

    const onEnter = () => {
      root.addEventListener("mousemove", onMove)
      gsap.to(card, { scale: 1.01, duration: 0.35, ease: "power3.out" })
    }

    const onLeave = () => {
      root.removeEventListener("mousemove", onMove)
      gsap.to(card, { rotateX: 0, rotateY: 0, scale: 1, duration: 0.7, ease: "power3.out" })
      gsap.to(img, { x: 0, y: 0, duration: 0.7, ease: "power3.out" })
      if (fog) gsap.to(fog, { xPercent: 0, yPercent: 0, duration: 0.9, ease: "power3.out" })
    }

    root.addEventListener("mouseenter", onEnter)
    root.addEventListener("mouseleave", onLeave)

    if (infoBg) {
      gsap.killTweensOf(infoBg)
      gsap.to(infoBg, { backgroundPosition: "120% 0%", duration: 12, ease: "none", repeat: -1 })
    }

    return () => {
      root.removeEventListener("mouseenter", onEnter)
      root.removeEventListener("mouseleave", onLeave)
      root.removeEventListener("mousemove", onMove)
      gsap.killTweensOf([card, img, fog, infoBg])
    }
  }, [project.id])

  const cover = project.images.cover

  // vertical list previews 01..N
  const previewIndices = React.useMemo(() => Array.from({ length: count }, (_, i) => i), [count])

  const previewTransform: React.CSSProperties | undefined = React.useMemo(() => {
    // Only apply the stacked/tilt transform on md+ sizes.
    if (typeof window === "undefined") return undefined
    return window.matchMedia?.("(min-width: 768px)")?.matches ? ({} as React.CSSProperties) : undefined
  }, [])

  return (
    <div ref={rootRef} className="relative min-w-0 h-full">
      <div className="grid h-full min-w-0 items-center gap-10 max-md:grid-cols-1 max-md:items-start max-md:gap-6 md:grid-cols-[minmax(520px,0.9fr)_minmax(0,1.1fr)]">
        {/* LEFT */}
        <div ref={leftRef} className="relative min-w-0">
          {/* LEFT previews */}
          <div className="absolute left-0 top-1/2 z-20 -translate-y-1/2 max-md:static max-md:mb-4 max-md:translate-y-0">
            <div className="flex flex-col items-center gap-3 max-md:flex-row max-md:items-center">
              <button
                type="button"
                onClick={() => onSelect(index - 1)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/12 bg-black/45 text-white/85 hover:bg-white/5"
                aria-label="Previous project"
              >
                ↑
              </button>

              <div className="flex flex-col gap-2 max-md:flex-row max-md:max-w-full max-md:gap-2 max-md:overflow-x-auto max-md:pb-2">
                {previewIndices.map((pi) => {
                  const p = allProjects[pi]
                  const isActive = pi === index

                  const dist = Math.abs(pi - index)
                  const offsetX = Math.min(24, dist * 10)
                  const tilt = (pi < index ? -1 : 1) * Math.min(10, dist * 4)

                  const style = previewTransform
                    ? { transform: `translateX(${offsetX}px) rotate(${tilt}deg)` }
                    : undefined

                  return (
                    <button
                      key={`preview-${p.id}`}
                      type="button"
                      onClick={() => onSelect(pi)}
                      className={
                        "group relative flex items-center gap-3 rounded-2xl border bg-black/40 px-3 py-2 text-left backdrop-blur transition-colors shrink-0 " +
                        (isActive ? "border-white/25 bg-white/10" : "border-white/10 hover:border-white/20 hover:bg-white/5")
                      }
                      style={style}
                      aria-current={isActive ? "true" : undefined}
                    >
                      <div className="w-10 text-xs font-semibold tracking-[0.2em] text-white/70">{formatIndex(pi + 1)}.</div>
                      <div className="h-9 w-14 overflow-hidden rounded-lg border border-white/10 bg-black/55">
                        <img
                          src={p.images.cover.src}
                          alt=""
                          aria-hidden
                          className={"h-full w-full object-cover transition-opacity " + (isActive ? "opacity-100" : "opacity-70")}
                          loading="lazy"
                        />
                      </div>
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => onSelect(index + 1)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/12 bg-black/45 text-white/85 hover:bg-white/5"
                aria-label="Next project"
              >
                ↓
              </button>
            </div>
          </div>

          {/* Main image card */}
          <div
            data-water-card
            className="relative ml-28 overflow-hidden rounded-3xl border border-white/10 bg-black/50 shadow-[0_25px_120px_rgba(0,0,0,0.65)] max-md:ml-0"
          >
            <div className="relative h-[62vh] max-h-130 min-h-85 max-md:h-[48vh] max-md:min-h-[320px]">
              <img data-water-img src={cover.src} alt={cover.alt} className="h-full w-full object-contain" loading="lazy" />

              <div
                data-accent-fog
                className="pointer-events-none absolute inset-0 mix-blend-screen opacity-90"
                style={{
                  background:
                    "radial-gradient(circle at 40% 45%, rgba(var(--accent-rgb, 52 211 153) / 0.55) 0%, rgba(var(--accent-rgb, 52 211 153) / 0.28) 22%, rgba(0,0,0,0) 58%)",
                  filter: "blur(28px)",
                }}
              />

              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-black/10" />
            </div>
          </div>
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
                  <span
                    className={
                      "rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase " +
                      (project.status === "live"
                        ? "border-emerald-200/20 bg-emerald-400/10 text-emerald-100"
                        : project.status === "wip"
                          ? "border-amber-200/20 bg-amber-400/10 text-amber-100"
                          : "border-white/10 bg-white/5 text-white/65")
                    }
                  >
                    {project.status}
                  </span>
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
