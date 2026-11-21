import { gsap } from "gsap"
import { planetDepartureTiming, updatePlanetDeparture } from "@/lib/hero-flight"

function phase(progress: number, start: number, end: number) {
  return gsap.utils.clamp(0, 1, (progress - start) / (end - start))
}

function revealContact(element: HTMLElement, amount: number, offset: number) {
  element.style.opacity = String(amount)
  element.style.visibility = amount > 0 ? "visible" : "hidden"
  element.style.transform = `translateY(${(1 - amount) * offset}px)`
}

export function setupPlanetDeparture(canvas: HTMLCanvasElement, home: HTMLElement, changed: (canvasEntered?: boolean) => void) {
  const root = document.getElementById("contact")
  const stage = root?.querySelector<HTMLElement>("[data-departure-stage]")
  const host = root?.querySelector<HTMLElement>("[data-departure-scene]")
  const invitation = root?.querySelector<HTMLElement>(".contact-invitation")
  const button = root?.querySelector<HTMLElement>(".contact-action")
  if (!root || !stage || !host || !invitation || !button) return null
  const panel = root.closest<HTMLElement>("[data-stack-panel]") ?? root
  const { auroraStart, planetGone, contactStart } = planetDepartureTiming
  const state = { progress: 0 }
  let visible = false
  let ownsCanvas = false
  const easeFade = gsap.parseEase("sine.inOut")
  const easeTitle = gsap.parseEase("power3.out")
  const easeButton = gsap.parseEase("power2.out")
  root.dataset.planetDeparture = ""
  const update = () => {
    const progress = state.progress
    const shouldOwn = progress > 0
    const canvasEntered = shouldOwn && !ownsCanvas
    if (shouldOwn !== ownsCanvas) {
      ownsCanvas = shouldOwn
      ;(ownsCanvas ? host : home).append(canvas)
    }
    updatePlanetDeparture(ownsCanvas, progress)
    const planetIn = easeFade(phase(progress, 0, 0.13))
    const planetOut = easeFade(phase(progress, auroraStart, planetGone))
    host.style.opacity = String(planetIn * (1 - planetOut))
    revealContact(invitation, easeTitle(phase(progress, contactStart, 0.98)), 35)
    const action = easeButton(phase(progress, contactStart + 0.035, 0.99))
    revealContact(button, action, 16)
    button.inert = action === 0
    changed(canvasEntered)
  }
  const timeline = gsap.timeline({
    scrollTrigger: { trigger: panel, start: "top 75%", end: "bottom bottom", scrub: 0.4, invalidateOnRefresh: true, onRefresh: update },
    onUpdate: update,
  })
    .to(state, { progress: 1, duration: 1, ease: "none" }, 0)
  update()
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; changed() })
  observer.observe(stage)
  return {
    get ownsCanvas() { return ownsCanvas },
    get visible() { return visible && state.progress < planetGone },
    get progress() { return state.progress },
    dispose() {
      observer.disconnect()
      timeline.scrollTrigger?.kill()
      timeline.revert()
      home.append(canvas)
      delete root.dataset.planetDeparture
      updatePlanetDeparture(false, 0)
      host.style.removeProperty("opacity")
      for (const element of [invitation, button]) {
        element.style.removeProperty("opacity")
        element.style.removeProperty("visibility")
        element.style.removeProperty("transform")
      }
      button.inert = false
    },
  }
}
