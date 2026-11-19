import { gsap } from "gsap"
import { updatePlanetDeparture } from "@/lib/hero-flight"

export function setupPlanetDeparture(canvas: HTMLCanvasElement, home: HTMLElement, changed: () => void) {
  const root = document.getElementById("contact")
  const stage = root?.querySelector<HTMLElement>("[data-departure-stage]")
  const host = root?.querySelector<HTMLElement>("[data-departure-scene]")
  const invitation = root?.querySelector<HTMLElement>(".contact-invitation")
  const button = root?.querySelector<HTMLElement>(".contact-action")
  const header = document.querySelector<HTMLElement>(".site-header")
  if (!root || !stage || !host || !invitation || !button) return null
  const state = { progress: 0 }
  let visible = false
  let ownsCanvas = false
  root.dataset.planetDeparture = ""
  const update = () => {
    const shouldOwn = state.progress > 0.0001
    if (shouldOwn !== ownsCanvas) {
      ownsCanvas = shouldOwn
      ;(ownsCanvas ? host : home).append(canvas)
    }
    updatePlanetDeparture(ownsCanvas, state.progress)
    button.inert = state.progress > 0.13 && state.progress < 0.91
    if (header) header.inert = state.progress > 0.13 && state.progress < 0.9
    changed()
  }
  const timeline = gsap.timeline({
    scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.4, invalidateOnRefresh: true, onRefresh: update },
    onUpdate: update,
  })
    .to(state, { progress: 1, duration: 1, ease: "none" }, 0)
    .fromTo(host, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "sine.inOut" }, 0.025)
    .to(invitation, { autoAlpha: 0, y: -45, duration: 0.12, ease: "power2.in" }, 0)
    .to(button, { opacity: 0, y: -16, duration: 0.1 }, 0.025)
    .to(header, { autoAlpha: 0, yPercent: -100, duration: 0.1, ease: "power2.in" }, 0.025)
    .to(host, { opacity: 0, duration: 0.12, ease: "sine.inOut" }, 0.74)
    .fromTo(invitation, { y: 35 }, { autoAlpha: 1, y: 0, duration: 0.1, ease: "power3.out", immediateRender: false }, 0.88)
    .to(button, { opacity: 1, y: 0, duration: 0.09, ease: "power2.out" }, 0.91)
    .to(header, { autoAlpha: 1, yPercent: 0, duration: 0.08, ease: "power2.out" }, 0.9)
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; changed() })
  observer.observe(stage)
  return {
    get ownsCanvas() { return ownsCanvas },
    get visible() { return visible && state.progress < 0.87 },
    get progress() { return state.progress },
    dispose() {
      observer.disconnect()
      timeline.scrollTrigger?.kill()
      timeline.kill()
      home.append(canvas)
      delete root.dataset.planetDeparture
      updatePlanetDeparture(false, 0)
      button.inert = false
      if (header) header.inert = false
    },
  }
}
