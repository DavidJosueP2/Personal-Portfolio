import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
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

type ServiceMotion = {
  activate: (index: number, previous: number) => void
  drift: (offset: number) => void
}

export function ServicesSection() {
  const stageRef = useRef<HTMLDivElement>(null)
  const selected = useRef(0)
  const pointerOnWord = useRef(false)
  const motion = useRef<ServiceMotion>(null)
  const [active, setActive] = useState(0)

  const select = useCallback((index: number, replay = false) => {
    const previous = selected.current
    if (previous === index && !replay) return
    if (previous !== index) {
      selected.current = index
      setActive(index)
    }
    motion.current?.activate(index, previous)
  }, [])

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const words = Array.from(stage.querySelectorAll<HTMLElement>("[data-service-word]"))
    const lettering = Array.from(stage.querySelectorAll<HTMLElement>("[data-service-lettering]"))
    const frames = Array.from(stage.querySelectorAll<HTMLElement>("[data-service-frame]"))
    const photographs = stage.querySelectorAll<HTMLElement>("[data-service-photo]")
    const wide = window.matchMedia("(min-width: 48rem)")
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const follow = { duration: 0.54, ease: "power3.out" }
    const photos = Array.from(photographs, (element, side) => ({
      element,
      restingAngle: side === 0 ? -8 : 7,
      direction: side === 0 ? -1 : 1,
      x: gsap.quickTo(element, "x", follow),
      y: gsap.quickTo(element, "y", follow),
      rotation: gsap.quickTo(element, "rotation", follow),
    }))
    let lastOffset = 0

    function drift(offset: number) {
      if (reduced.matches) return
      const progress = gsap.utils.clamp(-1, 1, offset)
      if (Math.abs(progress - lastOffset) < 0.018) return
      lastOffset = progress

      for (const photo of photos) {
        photo.x(progress * photo.direction * 6)
        photo.y(progress * (photo.direction < 0 ? 10 : 7))
        photo.rotation(photo.restingAngle - progress * photo.direction * 4)
      }
    }

    function place(index: number, animate: boolean) {
      if (!stage) return
      gsap.killTweensOf(frames)
      if (!wide.matches) {
        gsap.set(frames, { clearProps: "transform" })
        return
      }

      const area = stage.getBoundingClientRect()
      const word = words[index].getBoundingClientRect()
      const gap = Math.max(18, Math.min(38, area.width * 0.018))
      const framesBounds = frames.map((frame) => ({ width: frame.offsetWidth, height: frame.offsetHeight }))

      frames.forEach((frame, side) => {
        const { width, height } = framesBounds[side]
        const left = side === 0 ? word.left - width - gap : word.right + gap
        const x = gsap.utils.clamp(8, area.width - width - 8, left - area.left)
        const y = word.top + (word.height - height) / 2 - area.top + (side === 0 ? -9 : 10)
        if (animate && !reduced.matches) {
          gsap.to(frame, { x, y, duration: side === 0 ? 0.59 : 0.67, ease: "power3.out" })
        } else {
          gsap.set(frame, { x, y })
        }
      })
    }

    const resetMotion = () => {
      lastOffset = 0
      for (const photo of photos) {
        photo.x.tween.pause()
        photo.y.tween.pause()
        photo.rotation.tween.pause()
        gsap.set(photo.element, { x: 0, y: 0, rotation: photo.restingAngle })
      }
      gsap.killTweensOf(lettering)
      gsap.set(lettering, { clearProps: "transform,opacity" })
      place(selected.current, false)
    }

    motion.current = {
      activate(index, previous) {
        if (index !== previous) place(index, true)
        if (reduced.matches) return

        const direction = index < previous ? -1 : 1
        gsap.fromTo(lettering[index], {
          yPercent: direction * 12,
          scaleY: 0.9,
          opacity: 0.7,
        }, {
          yPercent: 0,
          scaleY: 1,
          opacity: 1,
          duration: 0.46,
          ease: "power3.out",
          overwrite: true,
          clearProps: "transform,opacity",
        })

        const word = words[index].getBoundingClientRect()
        const center = window.innerHeight / 2
        drift((word.top + word.height / 2 - center) / Math.max(1, center * 0.54))
      },
      drift,
    }

    resetMotion()
    reduced.addEventListener("change", resetMotion)
    const resize = new ResizeObserver(() => place(selected.current, false))
    resize.observe(stage)
    words.forEach((word) => resize.observe(word))

    return () => {
      resize.disconnect()
      reduced.removeEventListener("change", resetMotion)
      gsap.killTweensOf(frames)
      gsap.killTweensOf(lettering)
      gsap.killTweensOf(photographs)
      motion.current = null
    }
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const rows = Array.from(stage.querySelectorAll<HTMLButtonElement>("[data-service-option]"))
    let frame = 0

    const selectAtCenter = () => {
      frame = 0
      const focused = document.activeElement
      const center = window.innerHeight / 2
      const offsets = rows.map((row) => {
        const { top, height } = row.getBoundingClientRect()
        return top + height / 2 - center
      })

      if (!pointerOnWord.current && !(stage.contains(focused) && focused?.matches(":focus-visible"))) {
        let nearest = -1
        let distance = center * 0.44
        offsets.forEach((offset, index) => {
          if (Math.abs(offset) < distance) {
            nearest = index
            distance = Math.abs(offset)
          }
        })
        if (nearest >= 0) select(nearest)
      }

      motion.current?.drift(offsets[selected.current] / Math.max(1, center * 0.54))
    }

    const scheduleSelection = () => {
      if (!frame) frame = window.requestAnimationFrame(selectAtCenter)
    }

    const stopSelection = () => {
      window.removeEventListener("scroll", scheduleSelection)
      window.removeEventListener("resize", scheduleSelection)
      window.cancelAnimationFrame(frame)
      frame = 0
    }

    const visibility = new IntersectionObserver((entries) => {
      if (entries.at(-1)?.isIntersecting) {
        window.addEventListener("scroll", scheduleSelection, { passive: true })
        window.addEventListener("resize", scheduleSelection)
        scheduleSelection()
      } else {
        stopSelection()
      }
    })
    visibility.observe(stage)

    return () => {
      visibility.disconnect()
      stopSelection()
    }
  }, [select])

  return (
    <section id="services" aria-labelledby="services-heading" className="portfolio-container portfolio-section overflow-clip bg-[#f6f6f4] text-ink dark:bg-[#111113]">
      <header className="flex items-center justify-between gap-4 text-[clamp(1.05rem,2.4vw,2.5rem)] font-bold leading-none tracking-[-0.035em]">
        <p className="flex items-center gap-2.5 sm:gap-4">
          <span aria-hidden="true" className="size-[0.74em] shrink-0 rounded-[0.11em] bg-[rgb(var(--accent-rgb,52_211_153))]" />
          How can I help?
        </p>
        <h2 id="services-heading" className="font-sans! leading-none">Services</h2>
      </header>

      <div ref={stageRef} className="relative isolate pb-3 pt-[clamp(3.5rem,8vw,8.5rem)] md:pb-8">
        <ul className="grid justify-items-center gap-[clamp(0.15rem,0.68vw,0.8rem)]">
          {services.map(({ name }, index) => (
            <li key={name} className="relative z-10">
              <button
                type="button"
                data-slot="service-word"
                data-service-option
                aria-pressed={active === index}
                onPointerEnter={(event) => {
                  if (event.pointerType !== "mouse" && event.pointerType !== "pen") return
                  pointerOnWord.current = true
                  select(index, true)
                }}
                onPointerLeave={() => { pointerOnWord.current = false }}
                onClick={() => select(index)}
                onFocus={(event) => select(index, event.currentTarget.matches(":focus-visible"))}
                className="block cursor-pointer rounded-sm px-1 font-sans text-[clamp(2.6rem,10vw,12rem)] font-bold leading-[0.93] tracking-[-0.04em] text-heading focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink aria-pressed:text-accent-ink motion-safe:transition-colors motion-safe:duration-300"
              >
                <span data-service-word className="block">
                  <span data-service-lettering className="block">{name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div aria-hidden="true" className="pointer-events-none mx-auto grid w-full max-w-80 grid-cols-2 gap-6 px-3 pt-9 md:absolute md:inset-0 md:block md:max-w-none md:p-0">
          {([0, 1] as const).map((side) => (
            <div key={side} data-service-frame className="relative w-full md:absolute md:top-0 md:left-0 md:w-[clamp(5.5rem,12vw,14rem)]">
              <div data-service-photo className="relative aspect-[3/2] overflow-hidden rounded-[5px] bg-panel shadow-[0_13px_34px_-13px_rgb(0_0_0/0.36)]">
                {services.map(({ name, images }, index) => (
                  <img
                    key={name}
                    src={images[side]}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    data-active={index === active}
                    className="absolute inset-0 size-full object-cover opacity-0 data-[active=true]:opacity-100 motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
