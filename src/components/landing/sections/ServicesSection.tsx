import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { Trans, useTranslation } from "react-i18next"
import clinic from "@/assets/img/projects/clinic/preview-576.webp"
import moderation from "@/assets/img/projects/moderation/preview-576.webp"
import fuel from "@/assets/img/projects/fuel-system/preview-576.webp"
import hospital from "@/assets/img/projects/hospital/preview-576.webp"
import backendAppointments from "@/assets/img/services/backend-appointments.webp"
import backendModeration from "@/assets/img/services/backend-moderation.webp"
import cloudArchitecture from "@/assets/img/services/cloud-architecture.webp"
import cloudOperations from "@/assets/img/services/cloud-operations.webp"
import cloudQuality from "@/assets/img/services/cloud-quality.webp"
import devopsConsole from "@/assets/img/services/devops-console.webp"
import mobileChat from "@/assets/img/services/mobile-chat.webp"
import mobileSignIn from "@/assets/img/services/mobile-sign-in.webp"
import { connectServiceGarden } from "./services-garden"
import "./services-section.css"

const services = [
  { id: "web", images: [clinic, moderation] },
  { id: "backend", images: [backendModeration, backendAppointments] },
  { id: "microservices", images: [fuel, hospital] },
  { id: "mobile", images: [mobileSignIn, mobileChat] },
  { id: "cloud", images: [cloudArchitecture, cloudOperations] },
  { id: "devops", images: [cloudQuality, devopsConsole] },
] as const

type PreviewPose = { x: number; scale: number }
type ServicePose = { center: number; previews: PreviewPose[] }

const interpolate = (from: number, to: number, fraction: number) => from + (to - from) * fraction

export function ServicesSection() {
  const { t } = useTranslation()
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const wordsRef = useRef<HTMLUListElement>(null)
  const previewsRef = useRef<HTMLDivElement>(null)
  const selectRef = useRef<(index: number) => void>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const disconnectGarden = connectServiceGarden(section)
    const targets = section.querySelectorAll("[data-service-paint], [data-service-frame]")
    const visibility = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) target.toggleAttribute("data-service-in-view", isIntersecting)
    })
    targets.forEach((target) => visibility.observe(target))
    const onPageVisibility = () => section.toggleAttribute("data-service-tab-hidden", document.hidden)
    document.addEventListener("visibilitychange", onPageVisibility)
    onPageVisibility()

    return () => {
      disconnectGarden()
      visibility.disconnect()
      document.removeEventListener("visibilitychange", onPageVisibility)
      section.removeAttribute("data-service-tab-hidden")
      targets.forEach((target) => target.removeAttribute("data-service-in-view"))
    }
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    const words = wordsRef.current
    const previews = previewsRef.current
    if (!stage || !words || !previews) return

    const rows = Array.from(words.querySelectorAll<HTMLElement>("[data-service-row]"))
    const buttons = rows.map((row) => row.querySelector<HTMLButtonElement>("button"))
    const photos = Array.from(previews.querySelectorAll<HTMLElement>("[data-service-frame]"), (frame, side) => ({
      frame,
      face: frame.querySelector<HTMLElement>("[data-service-photo]")!,
      images: frame.querySelectorAll<HTMLImageElement>("img"),
      direction: side === 0 ? -1 : 1,
    }))
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const easeFlip = gsap.parseEase("sine.inOut")
    const progress = { position: 0 }
    let poses: ServicePose[] = []
    let shown = 0
    let target = 0
    let frameRequest = 0
    let settleTimer = 0
    let disposed = false
    let visible = false

    const draw = () => {
      const { position } = progress
      if (!poses.length) return
      const index = Math.round(position)
      if (index !== shown) {
        photos.forEach(({ images }) => {
          images[shown].dataset.active = "false"
          images[index].dataset.active = "true"
        })
        shown = index
        setActive(index)
      }
      const from = Math.floor(position)
      const to = Math.min(from + 1, poses.length - 1)
      const segment = position - from
      const flip = easeFlip(gsap.utils.clamp(0, 1, (segment - 0.18) / 0.64))
      // The next image takes over edge-on, on the opposite side of the same turn.
      const angle = reduced.matches ? 0 : (segment < 0.5 ? flip : flip - 1) * 180
      const y = interpolate(poses[from].center, poses[to].center, segment)

      for (const [side, { frame, face, direction }] of photos.entries()) {
        const a = poses[from].previews[side]
        const b = poses[to].previews[side]
        const x = interpolate(a.x, b.x, segment)
        const scale = interpolate(a.scale, b.scale, segment)
        frame.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${scale})`
        face.style.transform = `rotateY(${direction * angle}deg)`
      }
      previews.dataset.servicePlaced = ""
    }
    const follow = gsap.quickTo(progress, "position", { duration: 0.38, ease: "power2.out", onUpdate: draw })

    const seek = (position: number, immediate = false) => {
      if (immediate || reduced.matches) {
        follow.tween.pause()
        progress.position = position
        draw()
      } else if (position !== target) {
        follow(position, progress.position)
      }
      target = position
    }

    const readPosition = () => {
      const center = window.innerHeight / 2 - words.getBoundingClientRect().top
      const next = poses.findIndex((pose) => pose.center > center)
      if (next === -1) return rows.length - 1
      if (next === 0) return 0
      const previous = poses[next - 1].center
      return next - 1 + (center - previous) / (poses[next].center - previous)
    }

    const measure = () => {
      if (disposed || !words.clientWidth) return
      const width = words.clientWidth
      const gap = gsap.utils.clamp(6, 26, width * 0.016)
      const drift = gsap.utils.clamp(2, 5, width * 0.008)
      const cardWidths = photos.map(({ frame }) => frame.offsetWidth)
      poses = rows.map((row) => {
        const edges = [row.offsetLeft, row.offsetLeft + row.offsetWidth]
        return {
          center: row.offsetTop + row.offsetHeight / 2,
          previews: edges.map((edge, side) => {
            const direction = photos[side].direction
            const available = side === 0 ? edge : width - edge
            // Budget room for the tilt and idle drift around each word, including wide labels on phones.
            const footprint = cardWidths[side] * 1.15
            const size = Math.max(0, Math.min(footprint, available - gap - drift * 2))
            return { x: edge + direction * (gap + drift + size / 2), scale: size / footprint }
          }),
        }
      })
      draw()
    }

    const syncScroll = (immediate = false) => {
      window.clearTimeout(settleTimer)
      if (!poses.length) return
      const focused = buttons.findIndex((button) => button?.matches(":focus-visible"))
      if (focused !== -1) {
        seek(focused, immediate)
        return
      }
      const position = readPosition()
      const nearest = Math.round(position)
      seek(reduced.matches ? nearest : position, immediate)
      // Finish the turn if scrolling stops between two word centers.
      if (!reduced.matches && position !== nearest) {
        settleTimer = window.setTimeout(() => seek(nearest), 180)
      }
    }

    const onScroll = () => {
      if (frameRequest) return
      frameRequest = window.requestAnimationFrame(() => {
        frameRequest = 0
        syncScroll()
      })
    }
    const onResize = () => {
      if (disposed || !visible) return
      measure()
      syncScroll(true)
    }
    const stop = () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      window.cancelAnimationFrame(frameRequest)
      window.clearTimeout(settleTimer)
      frameRequest = 0
      follow.tween.pause()
    }
    const resetTransforms = () => {
      for (const { frame, face } of photos) {
        frame.style.removeProperty("transform")
        face.style.removeProperty("transform")
      }
    }
    const onMotionPreference = () => {
      window.clearTimeout(settleTimer)
      seek(Math.round(target), true)
    }

    selectRef.current = (index) => {
      window.cancelAnimationFrame(frameRequest)
      window.clearTimeout(settleTimer)
      frameRequest = 0
      seek(index)
    }

    const size = new ResizeObserver(onResize)
    size.observe(words)
    for (const row of rows) size.observe(row)
    for (const { frame } of photos) size.observe(frame)
    void document.fonts.ready.then(onResize)
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) {
        onResize()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onResize)
      } else {
        stop()
      }
    }, { rootMargin: "30% 0px" })
    visibility.observe(stage)
    reduced.addEventListener("change", onMotionPreference)

    return () => {
      disposed = true
      visibility.disconnect()
      size.disconnect()
      reduced.removeEventListener("change", onMotionPreference)
      selectRef.current = null
      stop()
      follow.tween.kill()
      resetTransforms()
      delete previews.dataset.servicePlaced
    }
  }, [])

  return (
    <section ref={sectionRef} id="services" aria-labelledby="services-heading" className="services-section portfolio-section overflow-clip">
      <div className="services-flowers" aria-hidden="true">
        <canvas className="services-flowers-early-left" data-service-paint="daisy" data-service-edge="left" />
        <canvas className="services-flowers-early-right" data-service-paint="poppy" data-service-edge="right" />
      </div>
      <header data-section-motion="heading" className="services-heading">
        <h2 id="services-heading">{t("services.heading")}</h2>
        <p>
          <span aria-hidden="true" className="services-mark" />
          <span>
            <Trans
              i18nKey="services.question"
              components={{ 1: <em className="font-serif-italic" /> }}
            />
          </span>
        </p>
      </header>

      <div ref={stageRef} data-service-stage className="relative isolate mt-[clamp(3.5rem,8vw,8.5rem)] mb-[var(--service-stage-end,clamp(1.5rem,3vw,3.5rem))] [--service-word-size:clamp(1.8rem,9.1vw,12rem)]">
        <div className="services-flowers" aria-hidden="true">
          <canvas className="services-flowers-late-left" data-service-paint="lavender" data-service-edge="left" data-service-climb />
          <canvas className="services-flowers-late-right" data-service-paint="daisy" data-service-edge="right" data-service-climb />
        </div>
        <div className="relative" data-section-motion="body">
          <ul ref={wordsRef} className="relative z-10 grid justify-items-center gap-[clamp(0.55rem,0.9vw,1rem)]">
            {services.map(({ id }, index) => (
              <li key={id} data-service-row>
                <button
                  type="button"
                  data-slot="service-word"
                  aria-pressed={active === index}
                  onPointerMove={(event) => {
                    if (event.pointerType === "mouse" || event.pointerType === "pen") selectRef.current?.(index)
                  }}
                  onClick={() => selectRef.current?.(index)}
                  onFocus={(event) => {
                    if (event.currentTarget.matches(":focus-visible")) selectRef.current?.(index)
                  }}
                  className={`block min-h-11 cursor-pointer rounded-sm px-1 text-[length:var(--service-word-size)] leading-[0.93] text-heading aria-pressed:text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink motion-safe:transition-[color,transform] motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.02] ${index % 2 === 0 ? "font-sans font-bold tracking-[-0.04em]" : "font-serif-italic tracking-[-0.025em]"}`}
                >
                  {t(`services.items.${id}`)}
                </button>
              </li>
            ))}
          </ul>

          <div ref={previewsRef} className="services-previews" aria-hidden="true">
            {([0, 1] as const).map((side) => (
              <div key={side} className="services-preview" data-service-frame>
                <div className="services-preview-drift">
                  <div data-service-photo className="relative aspect-square overflow-hidden rounded-[4px] bg-panel shadow-[0_12px_28px_-11px_rgb(0_0_0/0.4)] [backface-visibility:hidden] sm:aspect-[3/2]">
                    {services.map(({ id, images }, index) => (
                      <img
                        key={id}
                        src={images[side]}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        data-active={index === 0}
                        className="invisible absolute inset-0 size-full object-cover data-[active=true]:visible"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="services-meadow" aria-hidden="true">
        <canvas data-service-paint="meadow" />
      </div>
    </section>
  )
}
