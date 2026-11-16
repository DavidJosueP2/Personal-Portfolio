import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"
import type { Project, ProjectCategory } from "../types"
import { ProjectGalleryDialog } from "./ProjectGalleryDialog"
import { createProjectSpread } from "./project-spread-motion"
import "./projects-showcase.css"

const categoryLabels: Record<ProjectCategory, string> = {
  web: "Web development",
  backend: "Backend",
  mobile: "Mobile",
  devops: "DevOps",
  microservices: "Microservices",
  fullstack: "Full-stack development",
  other: "Software development",
}

type Gesture = {
  pointer: number
  x: number
  y: number
  slide: number | null
}

export function ProjectsShowcase({ projects }: Readonly<{ projects: readonly Project[] }>) {
  const sceneRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const motionRef = useRef<ReturnType<typeof createProjectSpread>>(null)
  const gestureRef = useRef<Gesture>(null)
  const suppressClick = useRef(false)
  const [active, setActive] = useState(0)
  const project = projects[active]
  const demo = project.links.find(({ kind }) => kind === "demo")
  const repositories = project.links.filter(({ kind }) => kind === "repo")
  const technologies = project.tech?.filter(({ iconSrc }) => iconSrc)
  const navigable = projects.length > 1

  useLayoutEffect(() => {
    const scene = sceneRef.current
    const media = mediaRef.current
    const anchor = anchorRef.current
    if (!scene || !media || !anchor) return

    const pictures = [...media.querySelectorAll<HTMLButtonElement>("[data-project-preview]")]
    const motion = createProjectSpread(media, anchor, pictures, setActive)
    motionRef.current = motion

    let previousWheel = -Infinity
    let wheelDistance = 0
    let wheelHandled = false
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || !event.cancelable || !navigable) return
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
      scene.removeEventListener("wheel", onWheel)
      motion.destroy()
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
    if (!navigable || !event.isPrimary || event.button !== 0) return
    const target = event.target
    if (!(target instanceof Element) || !target.closest("[data-project-preview]")) return
    gestureRef.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, slide: null }
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const gesture = gestureRef.current
    const motion = motionRef.current
    if (!gesture || gesture.pointer !== event.pointerId || !motion) return
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
      className="project-spread"
      aria-labelledby="projects-heading"
      aria-roledescription="carousel"
      tabIndex={0}
      data-lenis-prevent-horizontal
      onKeyDown={onKeyDown}
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
      <h2 id="projects-heading" className="project-heading" data-section-motion="heading">
        <span>Selected</span>{" "}<em className="font-serif-italic">work.</em>
      </h2>

      <div ref={mediaRef} className="project-media">
        {projects.map(({ id, title, images }, index) => (
          <button
            type="button"
            key={id}
            data-slot="project-preview"
            data-project-preview={id}
            data-current={active === index}
            aria-label={active === index ? images.cover.alt : `Show ${title}`}
            tabIndex={-1}
            aria-disabled={active === index}
            onClick={() => motionRef.current?.select(index)}
          >
            <img
              src={images.previewSrc ?? images.cover.src}
              alt=""
              width={1600}
              height={900}
              loading="lazy"
              decoding="async"
              fetchPriority={index === 0 ? "high" : index === 1 || index === projects.length - 1 ? "auto" : "low"}
              draggable={false}
            />
          </button>
        ))}
      </div>

      <div className="project-details" data-section-motion="body">
        <dl key={project.id} className="project-swap">
          <div>
            <dt>Category</dt>
            <dd>{categoryLabels[project.category]}</dd>
          </div>
          <div>
            <dt>Technologies</dt>
            <dd>
              {technologies?.length ? (
                <ul className="project-technologies">
                  {technologies.map(({ name, iconSrc }) => (
                    <li key={name} title={name}><img src={iconSrc} alt={name} width={21} height={21} /></li>
                  ))}
                </ul>
              ) : project.stack.join(" · ")}
            </dd>
          </div>
          {repositories.length > 0 && (
            <div>
              <dt>Source</dt>
              <dd className="project-repositories">
                {repositories.map(({ href, label }) => (
                  <a key={href} href={href} target="_blank" rel="noreferrer" aria-label={`${project.title}: ${label} repository`}>
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
                <a href={demo.href} aria-label={`Visit ${project.title} live site`} target="_blank" rel="noreferrer">
                  <span>{project.title}</span><ArrowUpRight aria-hidden="true" />
                </a>
              ) : project.title}
            </h3>
            <ProjectGalleryDialog project={project}>
              <button type="button" data-slot="project-trigger" className="project-gallery-link" aria-label={`View project: ${project.title}`}>
                View project <ArrowRight aria-hidden="true" size={15} />
              </button>
            </ProjectGalleryDialog>
          </div>
        </div>
      </div>

      <div className="project-summary" data-section-motion="body">
        <p key={project.id} className="project-swap">{project.subtitle ?? project.description}</p>
      </div>

      {navigable && (
        <div className="project-controls" data-project-controls role="group" aria-label="Project navigation">
          <button type="button" data-slot="project-previous" aria-label="Previous project" onClick={() => motionRef.current?.step(-1)}>
            <ArrowLeft aria-hidden="true" size={18} />
          </button>
          <span aria-hidden="true">{String(active + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</span>
          <button type="button" data-slot="project-next" aria-label="Next project" onClick={() => motionRef.current?.step(1)}>
            <ArrowRight aria-hidden="true" size={18} />
          </button>
        </div>
      )}
      <p className="sr-only" role="status">{project.title}, project {active + 1} of {projects.length}</p>
    </section>
  )
}
