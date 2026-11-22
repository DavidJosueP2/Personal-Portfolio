import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"
import { Trans, useTranslation } from "react-i18next"
import type { Project } from "../types"
import { ProjectGalleryDialog } from "./ProjectGalleryDialog"
import { createProjectSpread } from "./project-spread-motion"
import "./projects-showcase.css"

type Gesture = {
  pointer: number
  x: number
  y: number
  slide: number | null
}

export function ProjectsShowcase({ projects }: Readonly<{ projects: readonly Project[] }>) {
  const { t } = useTranslation()
  const sceneRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const runwayRef = useRef<HTMLDivElement>(null)
  const motionRef = useRef<ReturnType<typeof createProjectSpread>>(null)
  const gestureRef = useRef<Gesture>(null)
  const suppressClick = useRef(false)
  const [active, setActive] = useState(0)
  const [previewsReady, setPreviewsReady] = useState(false)
  const project = projects[active]
  const demo = project.links.find(({ kind }) => kind === "demo")
  const repositories = project.links.filter(({ kind }) => kind === "repo")
  const technologies = project.tech?.filter(({ iconSrc }) => iconSrc)
  const navigable = projects.length > 1

  useLayoutEffect(() => {
    const scene = sceneRef.current
    const media = mediaRef.current
    const anchor = anchorRef.current
    const runway = runwayRef.current
    if (!scene || !media || !anchor || !runway) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const reserve = () => scene.toggleAttribute("data-project-layout", !reduced.matches)
    reserve()
    reduced.addEventListener("change", reserve)

    const start = () => {
      if (motionRef.current) return
      visibility.disconnect()
      const pictures = [...media.querySelectorAll<HTMLButtonElement>("[data-project-preview]")]
      motionRef.current = createProjectSpread(scene, media, anchor, runway, pictures, setActive)
      setPreviewsReady(true)
    }
    const visibility = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start()
    }, { rootMargin: "120% 0px" })
    visibility.observe(scene)
    scene.addEventListener("focusin", start)

    let previousWheel = -Infinity
    let wheelDistance = 0
    let wheelHandled = false
    const onWheel = (event: WheelEvent) => {
      const motion = motionRef.current
      if (event.ctrlKey || !event.cancelable || !navigable || !motion?.canInteract()) return
      const x = event.deltaX || (event.shiftKey ? event.deltaY : 0)
      const y = event.shiftKey ? 0 : event.deltaY
      if (!x || Math.abs(x) < Math.abs(y) * 1.35) return

      event.preventDefault()
      event.stopPropagation()
      const time = performance.now()
      if (time - previousWheel > 145) {
        wheelDistance = 0
        wheelHandled = false
      }
      previousWheel = time
      wheelDistance += x * (event.deltaMode === 1 ? 16 : 1)
      if (!wheelHandled && Math.abs(wheelDistance) >= 48) {
        wheelHandled = true
        motion.step(Math.sign(wheelDistance))
      }
    }
    scene.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      visibility.disconnect()
      reduced.removeEventListener("change", reserve)
      delete scene.dataset.projectLayout
      scene.removeEventListener("focusin", start)
      scene.removeEventListener("wheel", onWheel)
      motionRef.current?.destroy()
      motionRef.current = null
    }
  }, [navigable])

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!navigable || !["ArrowLeft", "ArrowRight"].includes(event.key)) return
    const target = event.target
    if (target !== event.currentTarget && !(target instanceof Element && target.closest("[data-project-controls]"))) return
    event.preventDefault()
    motionRef.current?.step(event.key === "ArrowLeft" ? -1 : 1)
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    suppressClick.current = false
    if (!navigable || !event.isPrimary || event.button !== 0 || !motionRef.current?.canInteract()) return
    const target = event.target
    if (!(target instanceof Element) || !target.closest("[data-project-preview]")) return
    gestureRef.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, slide: null }
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const gesture = gestureRef.current
    const motion = motionRef.current
    if (!gesture || gesture.pointer !== event.pointerId || !motion?.canInteract()) return
    const dx = event.clientX - gesture.x
    const dy = event.clientY - gesture.y
    if (gesture.slide === null) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
        gestureRef.current = null
        return
      }
      if (Math.abs(dx) < 12) return
      gesture.slide = motion.startDrag()
      event.currentTarget.setPointerCapture(event.pointerId)
      suppressClick.current = true
    }
    const distance = Math.max(100, event.currentTarget.clientWidth * 0.25)
    motion.drag(gesture.slide - Math.max(-1.2, Math.min(1.2, dx / distance)))
  }

  function endDrag(event: PointerEvent<HTMLElement>, cancelled = false) {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointer !== event.pointerId) return
    gestureRef.current = null
    if (gesture.slide === null) return
    const dx = event.clientX - gesture.x
    motionRef.current?.go(Math.round(gesture.slide) - (cancelled || Math.abs(dx) < 42 ? 0 : Math.sign(dx)))
  }

  return (
    <section
      ref={sceneRef}
      id="projects"
      data-nav-light
      className="project-scene"
      aria-labelledby="projects-heading"
      aria-roledescription={t("projects.actions.carouselRole")}
      tabIndex={0}
      data-lenis-prevent-horizontal
      onKeyDown={onKeyDown}
      onFocusCapture={(event) => {
        if (event.currentTarget.contains(event.target) && event.target.matches(":focus-visible")) {
          motionRef.current?.focusCarousel()
        }
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => endDrag(event)}
      onPointerCancel={(event) => endDrag(event, true)}
      onLostPointerCapture={(event) => {
        if (event.target === event.currentTarget) endDrag(event, true)
      }}
      onClickCapture={(event) => {
        if (!suppressClick.current || event.detail === 0) return
        suppressClick.current = false
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      <div className="project-spread">
        <p className="project-phrase">
          <span><span data-project-phrase-line>{t("projects.phrase.line1")}</span></span>{" "}
          <span>
            <span data-project-phrase-line>
              <Trans
                i18nKey="projects.phrase.line2"
                components={{ 1: <em className="font-serif-italic" /> }}
              />
            </span>
          </span>{" "}
          <span><span data-project-phrase-line>{t("projects.phrase.line3")}</span></span>
        </p>

        <h2 id="projects-heading" className="project-heading" data-section-motion="heading">
          <span>{t("projects.heading.lead")}</span>{" "}<em className="font-serif-italic">{t("projects.heading.accent")}</em>
        </h2>

        <div ref={mediaRef} className="project-media">
          {projects.map(({ id, title, images }, index) => (
            <button
              type="button"
              key={id}
              data-slot="project-preview"
              data-project-preview={id}
              data-current={active === index}
              aria-label={active === index ? images.cover.alt : t("projects.actions.showProjectAria", { title })}
              tabIndex={-1}
              aria-disabled={active === index}
              onClick={() => motionRef.current?.select(index)}
            >
              {previewsReady && (
                <img
                  src={images.previewSrc ?? images.cover.src}
                  srcSet={images.previewSrcSet}
                  sizes="(max-width: 899px) min(calc(100vw - 2 * clamp(1rem, 4vw, 2.5rem)), 37rem), clamp(23rem, 31vw, 42rem)"
                  alt=""
                  width={1600}
                  height={900}
                  decoding="async"
                  fetchPriority={index === 0 ? "auto" : "low"}
                  draggable={false}
                />
              )}
            </button>
          ))}
        </div>

        <div className="project-details" data-section-motion="body">
          <dl key={project.id} className="project-swap">
            <div>
              <dt>{t("projects.details.category")}</dt>
              <dd>{t(`projects.categories.${project.category}`)}</dd>
            </div>
            <div>
              <dt>{t("projects.details.technologies")}</dt>
              <dd>
                {technologies?.length ? (
                  <ul className="project-technologies">
                    {technologies.map(({ name, iconSrc }) => (
                      <li key={name} title={name}><img src={iconSrc} alt={name} width={21} height={21} loading="lazy" decoding="async" /></li>
                    ))}
                  </ul>
                ) : project.stack.join(" · ")}
              </dd>
            </div>
            {repositories.length > 0 && (
              <div>
                <dt>{t("projects.details.source")}</dt>
                <dd className="project-repositories">
                  {repositories.map(({ href, label }) => (
                    <a key={href} href={href} target="_blank" rel="noreferrer" aria-label={t("projects.actions.repoAria", { title: project.title, label })}>
                      {label} <ArrowUpRight aria-hidden="true" size={13} />
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="project-feature">
          <div ref={anchorRef} className="project-preview-anchor" aria-hidden="true" />
          <div className="project-caption">
            <div key={project.id} className="project-swap">
              <h3>
                {demo ? (
                  <a href={demo.href} aria-label={t("projects.actions.liveSiteAria", { title: project.title })} target="_blank" rel="noreferrer">
                    <span>{project.title}</span><ArrowUpRight aria-hidden="true" />
                  </a>
                ) : project.title}
              </h3>
              <ProjectGalleryDialog project={project}>
                <button type="button" data-slot="project-trigger" className="project-gallery-link" aria-label={t("projects.actions.viewProjectAria", { title: project.title })}>
                  {t("projects.actions.viewProject")} <ArrowRight aria-hidden="true" size={15} />
                </button>
              </ProjectGalleryDialog>
            </div>
          </div>
        </div>

        <div className="project-summary" data-section-motion="body">
          <p key={project.id} className="project-swap">{project.subtitle ?? project.description}</p>
        </div>

        {navigable && (
          <div className="project-controls" data-project-controls role="group" aria-label={t("projects.actions.navAria")}>
            <button type="button" data-slot="project-previous" aria-label={t("projects.actions.previousAria")} onClick={() => motionRef.current?.step(-1)}>
              <ArrowLeft aria-hidden="true" size={18} />
            </button>
            <span aria-hidden="true">{String(active + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</span>
            <button type="button" data-slot="project-next" aria-label={t("projects.actions.nextAria")} onClick={() => motionRef.current?.step(1)}>
              <ArrowRight aria-hidden="true" size={18} />
            </button>
          </div>
        )}
        <p className="sr-only" role="status">{t("projects.actions.statusSr", { title: project.title, current: active + 1, total: projects.length })}</p>
      </div>
      <div ref={runwayRef} className="project-runway" aria-hidden="true" />
    </section>
  )
}
