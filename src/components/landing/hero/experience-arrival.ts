import { heroFlight } from "@/lib/hero-flight"
import type { ScrollTrigger as Trigger } from "gsap/ScrollTrigger"

const unit = (value: number) => Math.max(0, Math.min(1, value))
const smooth = (value: number, low = 0, high = 1) => {
  const t = unit((value - low) / (high - low))
  return t * t * (3 - 2 * t)
}

export function setupExperienceArrival(root: HTMLElement, ScrollTrigger: typeof Trigger) {
  const panel = root.closest<HTMLElement>("[data-stack-panel]") ?? root
  const content = root.querySelector<HTMLElement>(".experience-content")!
  const masthead = root.querySelector<HTMLElement>(".experience-masthead")!
  const title = root.querySelector<HTMLElement>("#experience-heading")!
  const introduction = masthead.querySelector("p")!
  const work = root.querySelector<HTMLElement>(".experience-work")!
  const sheet = root.querySelector<HTMLElement>(".experience-sheet")!
  const hero = document.getElementById("top")!
  const measure = () => {
    const viewport = window.innerHeight
    const bounds = panel.getBoundingClientRect()
    const enhanced = hero.hasAttribute("data-hero-journey")
    const titleTop = content.offsetTop + masthead.offsetTop + title.offsetTop
    const centerY = Math.max(titleTop + 1, (viewport - title.offsetHeight) / 2)
    return {
      viewport, enhanced, titleTop,
      panelY: bounds.top + window.scrollY,
      centerY,
      travel: viewport * 1.22,
      flightEnd: hero.getBoundingClientRect().top + window.scrollY + hero.offsetHeight - viewport * 4,
    }
  }
  let geometry = measure()

  const render = () => {
    const { enhanced, viewport, panelY, flightEnd, titleTop, centerY, travel } = geometry
    const scrollY = window.scrollY
    const remaining = panelY - scrollY
    if (!enhanced) {
      sheet.style.opacity = "1"
      sheet.style.removeProperty("pointer-events")
      title.style.removeProperty("transform")
      title.style.opacity = "1"
      introduction.style.opacity = String(smooth(-remaining / viewport, -0.3, 0))
      work.style.opacity = "1"
      work.style.visibility = "visible"
      heroFlight.covered = false
      return
    }
    const distance = centerY - titleTop
    const landing = unit(1 - remaining / travel)
    // Match natural scrolling at the end of the curve so releasing the title is seamless.
    const screenY = centerY - distance * landing ** (travel / distance)
    const offset = screenY - titleTop - remaining
    const opacity = smooth(scrollY, flightEnd - viewport * 0.53, flightEnd + viewport * 0.09)
    title.style.transform = opacity && remaining > 0 ? `translate3d(0,${offset}px,0)` : ""
    title.style.opacity = String(opacity)
    introduction.style.opacity = String(smooth(landing, 0.27, 0.93))
    const workReveal = smooth(landing, 0.42, 0.98)
    work.style.opacity = String(workReveal)
    work.style.visibility = workReveal ? "visible" : "hidden"
    const shade = 1 - smooth(remaining / viewport, 0.12, 1.5)
    sheet.style.opacity = String(shade)
    sheet.style.pointerEvents = shade > 0.95 ? "" : "none"
    heroFlight.covered = shade === 1
  }

  const refresh = () => {
    geometry = measure()
    root.toggleAttribute("data-experience-arrival", geometry.enhanced)
    render()
  }
  const trigger = ScrollTrigger.create({
    trigger: panel,
    start: () => hero.hasAttribute("data-hero-journey")
      ? hero.getBoundingClientRect().top + window.scrollY + hero.offsetHeight - innerHeight * 5
      : panel.getBoundingClientRect().top + window.scrollY - innerHeight,
    end: "top -10%", onUpdate: render, onRefresh: refresh,
  })
  const size = new ResizeObserver(refresh)
  size.observe(title)
  refresh()
  return () => {
    size.disconnect()
    trigger.kill()
    delete root.dataset.experienceArrival
    sheet.style.removeProperty("opacity")
    sheet.style.removeProperty("pointer-events")
    title.style.removeProperty("transform")
    for (const element of [title, introduction, work]) element.style.removeProperty("opacity")
    work.style.removeProperty("visibility")
    heroFlight.covered = false
  }
}
