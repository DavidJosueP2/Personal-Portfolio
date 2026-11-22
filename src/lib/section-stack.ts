import { gsap } from "gsap"
import type Lenis from "lenis"
import "lenis/dist/lenis.css"
import { prefersReducedMotion } from "./motion"

let activeScroller: Lenis | undefined

export function setPageScrollPaused(paused: boolean) {
  if (!activeScroller) return
  if (paused) activeScroller.stop()
  else activeScroller.start()
}

const exitTravel = {
  heading: -0.075,
  body: 0.02,
  media: 0.07,
}

const easeEdge = (progress: number) => progress * progress * (3 - 2 * progress)

export function scrollToSection(id: string) {
  const section = document.getElementById(id)
  if (!section) return

  const panel = section.parentElement?.matches("[data-stack-surface]") ? section.closest<HTMLElement>("[data-stack-panel]") : null
  if (activeScroller) {
    activeScroller.scrollTo(panel ?? section)
  } else {
    section.scrollIntoView({ behavior: prefersReducedMotion() ? "instant" : "smooth" })
  }
}

export function setupSectionStack(root: HTMLElement) {
  const motion = gsap.matchMedia()

  motion.add("(prefers-reduced-motion: no-preference)", (context) => {
    let cancelled = false
    void Promise.all([import("gsap/ScrollTrigger"), import("lenis")])
      .then(([{ ScrollTrigger }, { default: Lenis }]) => {
        if (cancelled) return
        gsap.registerPlugin(ScrollTrigger)
        context.add(() => startStack(root, ScrollTrigger, Lenis))
      })
      .catch((error: unknown) => console.error("Could not start section transitions.", error))

    return () => { cancelled = true }
  })

  return () => motion.revert()
}

function startStack(root: HTMLElement, ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger, Lenis: typeof import("lenis").default) {
  const panels = Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-stack-panel]"))
  root.dataset.stackReady = ""
  const lenis = new Lenis({
    lerp: 0.13,
    syncTouch: false,
    prevent: (node) => node.matches('[role="dialog"], textarea'),
    virtualScroll: (input) => {
      if (input.event.type !== "wheel" || Math.abs(input.deltaX) >= Math.abs(input.deltaY)) return true

      // Preserve fine trackpad deltas and soften larger wheel steps after Lenis normalizes them.
      const fineStep = 32
      const step = Math.abs(input.deltaY)
      if (step > fineStep) input.deltaY = Math.sign(input.deltaY) * (fineStep + (step - fineStep) * 0.65)
      return true
    },
  })
  activeScroller = lenis
  let scrollTime = 0
  const tick = (_seconds: number, elapsedMs: number) => {
    // Keep a delayed frame from applying too much pending scroll at once.
    scrollTime += Math.min(elapsedMs, 1000 / 30)
    lenis.raf(scrollTime)
  }
  const unsubscribe = lenis.on("scroll", () => ScrollTrigger.update())
  gsap.ticker.add(tick)

  const surfaces = panels.map((panel) => panel.querySelector<HTMLElement>("[data-stack-surface]")!)
  const transitions = surfaces.slice(0, -1).flatMap((surface, index) => {
    const panel = panels[index]
    const incoming = panels[index + 1]
    // The first section blends directly with the live botanical scene.
    if (incoming.querySelector("[data-scene-handoff]")) return []
    const enteringContact = incoming.querySelector("#contact") !== null
    const services = incoming.querySelector<HTMLElement>("#services")
    const incomingEntry = incoming.querySelector<HTMLElement>("[data-stack-entry]")!
    const items = Array.from(surface.querySelectorAll<HTMLElement>("[data-section-motion]"), (element) => ({
      element,
      travel: exitTravel[element.dataset.sectionMotion as keyof typeof exitTravel] ?? 0,
    }))
    const render = ({ progress, start, end }: { progress: number; start: number; end: number }) => {
      const betweenPanels = progress > 0 && progress < 1
      // Each offset returns to zero before the handoff, in either scroll direction.
      const travel = betweenPanels ? (end - start) * Math.sin(Math.PI * progress) ** 2 : 0
      const lift = travel * (services ? 0.18 : 0.12)
      const covered = travel * (services ? 0.18 : 0.13)
      const retreat = gsap.utils.clamp(0, 1, (progress - 0.12) / 0.68)
      const release = gsap.utils.clamp(0, 1, (1 - progress) / 0.1)
      const depth = enteringContact ? easeEdge(retreat) * easeEdge(release) : 0

      incomingEntry.style.translate = lift ? `0 ${-lift}px` : ""
      // Keep the cut aligned with the incoming edge as the surfaces slide past each other.
      surface.style.translate = travel ? `0 ${covered - lift}px` : ""
      surface.style.clipPath = covered ? `inset(0 0 ${covered}px 0${depth ? ` round ${depth * 32}px` : ""})` : ""
      if (enteringContact) {
        surface.style.transformOrigin = depth ? `center calc(100% - ${covered}px)` : ""
        surface.style.scale = depth ? String(1 - 0.06 * depth) : ""
      }
      if (services) {
        const title = easeEdge(gsap.utils.clamp(0, 1, (progress - 0.18) / 0.62))
        const question = easeEdge(gsap.utils.clamp(0, 1, (progress - 0.43) / 0.48))
        services.style.setProperty("--services-title-progress", String(title))
        services.style.setProperty("--services-question-progress", String(question))
      }
      for (const { element, travel: amount } of items) {
        const offset = travel * amount
        element.style.translate = offset ? `0 ${offset}px` : ""
      }
    }

    const trigger = ScrollTrigger.create({
      trigger: incoming,
      start: () => incoming.getBoundingClientRect().top + window.scrollY - Math.min(panel.offsetHeight, window.innerHeight),
      end: "top top",
      onUpdate: render,
      onRefresh: render,
    })

    return [{ surface, incomingEntry, items, trigger, services }]
  })

  const revealFocus = (event: FocusEvent) => {
    const target = event.target
    if (!(target instanceof HTMLElement) || !target.matches(":focus-visible")) return

    const transition = transitions.find(({ surface, trigger }) => trigger.isActive && surface.contains(target))
    if (!transition) return

    const { incomingEntry, trigger } = transition
    const targetRect = target.getBoundingClientRect()
    if (targetRect.bottom <= incomingEntry.getBoundingClientRect().top) return

    const targetScroll = window.scrollY + targetRect.top - window.innerHeight * 0.4
    lenis.scrollTo(Math.min(trigger.start, targetScroll), { immediate: true })
  }
  root.addEventListener("focusin", revealFocus)

  let refreshFrame = 0
  const sizes = new Map<Element, number>()
  const resize = new ResizeObserver((entries) => {
    let changed = false
    for (const entry of entries) {
      const height = entry.contentRect.height
      if (sizes.has(entry.target) && sizes.get(entry.target) !== height) changed = true
      sizes.set(entry.target, height)
    }

    if (changed && !refreshFrame) {
      refreshFrame = window.requestAnimationFrame(() => {
        refreshFrame = 0
        ScrollTrigger.refresh()
        lenis.resize()
      })
    }
  })
  surfaces.forEach((surface) => resize.observe(surface))
  ScrollTrigger.refresh()
  lenis.resize()

  return () => {
    resize.disconnect()
    window.cancelAnimationFrame(refreshFrame)
    root.removeEventListener("focusin", revealFocus)
    for (const { surface, incomingEntry, items, services } of transitions) {
      surface.style.removeProperty("clip-path")
      surface.style.removeProperty("translate")
      surface.style.removeProperty("transform-origin")
      surface.style.removeProperty("scale")
      incomingEntry.style.removeProperty("translate")
      services?.style.removeProperty("--services-title-progress")
      services?.style.removeProperty("--services-question-progress")
      for (const { element } of items) element.style.removeProperty("translate")
    }
    gsap.ticker.remove(tick)
    unsubscribe()
    lenis.destroy()
    if (activeScroller === lenis) activeScroller = undefined
    delete root.dataset.stackReady
  }
}
