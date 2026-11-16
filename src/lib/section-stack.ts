import { gsap } from "gsap"
import type Lenis from "lenis"
import "lenis/dist/lenis.css"
import { prefersReducedMotion } from "./motion"

let activeScroller: Lenis | undefined

const exitTravel = {
  heading: -0.075,
  body: 0.02,
  media: 0.07,
}

export function scrollToSection(id: string) {
  const section = document.getElementById(id)
  if (!section) return

  const panel = section.closest<HTMLElement>("[data-stack-panel]")
  if (activeScroller && panel) {
    activeScroller.scrollTo(panel)
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
  })
  activeScroller = lenis
  const tick = (seconds: number) => lenis.raf(seconds * 1000)
  const unsubscribe = lenis.on("scroll", () => ScrollTrigger.update())
  gsap.ticker.add(tick)

  const surfaces = panels.map((panel) => panel.querySelector<HTMLElement>("[data-stack-surface]")!)
  const transitions = surfaces.slice(0, -1).map((surface, index) => {
    const panel = panels[index]
    const incoming = panels[index + 1]
    const enteringContact = incoming.querySelector("#contact") !== null
    const incomingEntry = incoming.querySelector<HTMLElement>("[data-stack-entry]")!
    const items = Array.from(surface.querySelectorAll<HTMLElement>("[data-section-motion]"), (element) => ({
      element,
      travel: exitTravel[element.dataset.sectionMotion as keyof typeof exitTravel] ?? 0,
    }))
    const animationState = { progress: 0 }
    let distance = 0

    const render = () => {
      const { progress } = animationState
      const active = progress > 0 && progress < 1
      const travel = active ? distance * progress ** 2 * (3 - 2 * progress) : 0
      const lift = active ? distance * 0.12 * Math.sin(Math.PI * progress) ** 2 : 0
      const covered = travel * 0.25
      const retreat = active && enteringContact ? gsap.utils.clamp(0, 1, (progress - 0.12) / 0.68) : 0
      const depth = retreat ** 2 * (3 - 2 * retreat)

      incomingEntry.style.translate = lift ? `0 ${-lift}px` : ""
      // Keep the cut at the incoming edge and increase coverage as the page scrolls.
      // At the end the outgoing surface is above the viewport, so it can reset.
      surface.style.translate = active ? `0 ${covered - lift}px` : ""
      surface.style.clipPath = covered ? `inset(0 0 ${covered}px 0${depth ? ` round ${depth * 32}px` : ""})` : ""
      // Scale around the cut line so the panels still meet as the outgoing one recedes.
      surface.style.transformOrigin = retreat ? `center calc(100% - ${covered}px)` : ""
      surface.style.scale = depth ? String(1 - 0.06 * depth) : ""
      for (const { element, travel: amount } of items) {
        const offset = travel * amount
        element.style.translate = offset ? `0 ${offset}px` : ""
      }
    }

    const trigger = ScrollTrigger.create({
      trigger: incoming,
      start: () => incoming.getBoundingClientRect().top + window.scrollY - Math.min(panel.offsetHeight, window.innerHeight),
      end: "top top",
      scrub: true,
      animation: gsap.to(animationState, { progress: 1, ease: "none", paused: true, onUpdate: render }),
      onRefresh: (self) => {
        distance = self.end - self.start
        render()
      },
    })

    return { surface, incomingEntry, items, trigger }
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
    for (const { surface, incomingEntry, items } of transitions) {
      surface.style.removeProperty("clip-path")
      surface.style.removeProperty("translate")
      surface.style.removeProperty("transform-origin")
      surface.style.removeProperty("scale")
      incomingEntry.style.removeProperty("translate")
      for (const { element } of items) element.style.removeProperty("translate")
    }
    gsap.ticker.remove(tick)
    unsubscribe()
    lenis.destroy()
    if (activeScroller === lenis) activeScroller = undefined
    delete root.dataset.stackReady
  }
}
