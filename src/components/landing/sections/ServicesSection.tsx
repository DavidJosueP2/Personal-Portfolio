import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import clinic from "@/assets/img/projects/clinic/preview.webp"
import moderation from "@/assets/img/projects/moderation/preview.webp"
import fuel from "@/assets/img/projects/fuel-system/preview.webp"
import hospital from "@/assets/img/projects/hospital/preview.webp"
import backendAppointments from "@/assets/img/services/backend-appointments.webp"
import backendModeration from "@/assets/img/services/backend-moderation.webp"
import cloudArchitecture from "@/assets/img/services/cloud-architecture.webp"
import cloudOperations from "@/assets/img/services/cloud-operations.webp"
import cloudQuality from "@/assets/img/services/cloud-quality.webp"
import devopsConsole from "@/assets/img/services/devops-console.webp"
import mobileChat from "@/assets/img/services/mobile-chat.webp"
import mobileSignIn from "@/assets/img/services/mobile-sign-in.webp"

const services = [
  { name: "web", images: [clinic, moderation] },
  { name: "backend", images: [backendModeration, backendAppointments] },
  { name: "microservices", images: [fuel, hospital] },
  { name: "mobile", images: [mobileSignIn, mobileChat] },
  { name: "cloud", images: [cloudArchitecture, cloudOperations] },
  { name: "devops", images: [cloudQuality, devopsConsole] },
] as const

export function ServicesSection() {
  const stageRef = useRef<HTMLDivElement>(null)
  const wordsRef = useRef<HTMLUListElement>(null)
  const selectRef = useRef<(index: number) => void>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const stage = stageRef.current
    const words = wordsRef.current
    if (!stage || !words) return

    const rows = Array.from(words.querySelectorAll<HTMLElement>("[data-service-row]"))
    const photos = Array.from(stage.querySelectorAll<HTMLElement>("[data-service-frame]"), (frame, side) => ({
      frame,
      face: frame.querySelector<HTMLElement>("[data-service-photo]")!,
      images: frame.querySelectorAll<HTMLImageElement>("img"),
      direction: side === 0 ? -1 : 1,
    }))
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const easeFlip = gsap.parseEase("sine.inOut")
    const progress = { position: 0 }
    let centers: number[] = []
    let shown = 0
    let target = 0
    let frameRequest = 0
    let settleTimer = 0

    const draw = () => {
      const { position } = progress
      const index = Math.round(position)
      if (index !== shown) {
        photos.forEach(({ images }) => {
          images[shown].dataset.active = "false"
          images[index].dataset.active = "true"
        })
        shown = index
        setActive(index)
      }
      if (reduced.matches) return

      const segment = position - Math.floor(position)
      const flip = easeFlip(gsap.utils.clamp(0, 1, (segment - 0.18) / 0.64))
      // The next image takes over edge-on, on the opposite side of the same turn.
      const angle = (segment < 0.5 ? flip : flip - 1) * 180

      for (const { frame, face, direction } of photos) {
        const sway = Math.sin(position * 1.55 + direction)
        const rise = Math.cos(position * 1.35 + direction)
        frame.style.transform = `translate3d(${sway * 4}px,${rise * 7}px,0) rotateZ(${sway * 2}deg)`
        face.style.transform = `rotateY(${direction * angle}deg)`
      }
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
      const next = centers.findIndex((rowCenter) => rowCenter > center)
      if (next === -1) return rows.length - 1
      if (next === 0) return 0
      return next - 1 + (center - centers[next - 1]) / (centers[next] - centers[next - 1])
    }

    const measure = () => {
      centers = rows.map((row) => row.offsetTop + row.offsetHeight / 2)
    }

    const syncScroll = (immediate = false) => {
      window.clearTimeout(settleTimer)
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
      resetTransforms()
      window.clearTimeout(settleTimer)
      seek(Math.round(target), true)
    }

    selectRef.current = (index) => {
      window.cancelAnimationFrame(frameRequest)
      window.clearTimeout(settleTimer)
      frameRequest = 0
      seek(index)
    }

    const size = new ResizeObserver(measure)
    size.observe(stage)
    const visibility = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        onResize()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onResize)
      } else {
        stop()
      }
    })
    visibility.observe(stage)
    reduced.addEventListener("change", onMotionPreference)

    return () => {
      visibility.disconnect()
      size.disconnect()
      reduced.removeEventListener("change", onMotionPreference)
      selectRef.current = null
      stop()
      follow.tween.kill()
      resetTransforms()
    }
  }, [])

  return (
    <section id="services" aria-labelledby="services-heading" className="portfolio-container portfolio-section overflow-clip bg-[#f6f6f4] text-ink dark:bg-[#111113]">
      <header data-section-motion="heading" className="flex items-center justify-between gap-4 text-[clamp(1.05rem,2.4vw,2.5rem)] font-bold leading-none tracking-[-0.035em]">
        <p className="flex items-center gap-2.5 sm:gap-4">
          <span aria-hidden="true" className="size-[0.74em] shrink-0 rounded-[0.11em] bg-[rgb(var(--accent-rgb,52_211_153))]" />
          <span>How can I <em className="font-serif-italic">help?</em></span>
        </p>
        <h2 id="services-heading" className="font-sans! leading-none">Services</h2>
      </header>

      <div ref={stageRef} data-service-stage className="relative isolate mt-[clamp(3.5rem,8vw,8.5rem)] mb-[var(--service-stage-end,clamp(1.5rem,3vw,3.5rem))] [--service-word-size:clamp(1.8rem,9.1vw,12rem)]">
        <ul ref={wordsRef} data-section-motion="body" className="relative z-10 grid justify-items-center gap-[clamp(0.55rem,0.9vw,1rem)]">
          {services.map(({ name }, index) => (
            <li key={name} data-service-row>
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
                {name}
              </button>
            </li>
          ))}
        </ul>

        <div aria-hidden="true" data-section-motion="media" className="pointer-events-none absolute inset-x-0 inset-y-[max(1.375rem,calc(var(--service-word-size)*0.465))]">
          <div data-service-rail className="sticky top-[50dvh] flex h-0 items-center justify-between sm:px-[clamp(0.25rem,1.45vw,1.75rem)]">
            {([0, 1] as const).map((side) => (
              <div
                key={side}
                data-service-frame
                className={`w-[clamp(2.5rem,12.2vw,14.5rem)] shrink-0 [perspective:650px] ${side === 0 ? "-rotate-6" : "rotate-6"}`}
              >
                <div data-service-photo className="relative aspect-square overflow-hidden rounded-[4px] bg-panel shadow-[0_12px_28px_-11px_rgb(0_0_0/0.4)] [backface-visibility:hidden] sm:aspect-[3/2]">
                  {services.map(({ name, images }, index) => (
                    <img
                      key={name}
                      src={images[side]}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      data-active={index === 0}
                      className="invisible absolute inset-0 size-full object-cover data-[active=true]:visible"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
