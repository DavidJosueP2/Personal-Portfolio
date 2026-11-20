import { heroFlight, observeHeroFlight } from "@/lib/hero-flight"
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
    const titleTop = masthead.offsetTop + title.offsetTop
    return {
      viewport, enhanced, titleTop,
      panelY: bounds.top + window.scrollY,
      centerY: (viewport - title.offsetHeight) / 2,
      x: (document.documentElement.clientWidth - title.offsetWidth) / 2 - bounds.left - content.offsetLeft - masthead.offsetLeft - title.offsetLeft,
      contentWidth: content.clientWidth,
      flightEnd: hero.getBoundingClientRect().top + window.scrollY + hero.offsetHeight - viewport * 4,
    }
  }
  let geometry = measure()

  const transformTitle = (x: number, y: number, scale = 1) => {
    title.style.transform = x || y || scale !== 1 ? `translate3d(${x}px,${y}px,0) scale(${scale})` : ""
  }

  const render = () => {
    const { enhanced, viewport, panelY, flightEnd, titleTop, centerY, x, contentWidth } = geometry
    const scrollY = window.scrollY
    const remaining = panelY - scrollY
    if (!enhanced) {
      sheet.style.opacity = "1"
      sheet.style.removeProperty("pointer-events")
      transformTitle(contentWidth * 0.84 * (1 - smooth(-remaining / viewport, -0.72, -0.03)), 0)
      title.style.opacity = "1"
      introduction.style.opacity = String(smooth(-remaining / viewport, -0.3, 0))
      work.style.opacity = "1"
      work.style.visibility = "visible"
      heroFlight.covered = false
      return
    }
    const distance = Math.max(1, centerY - titleTop)
    const landing = unit(1 - remaining / (2 * distance))
    const settle = smooth(landing)
    // The quadratic ends at the same one-pixel-per-pixel speed as normal scrolling.
    const y = remaining > 0 ? centerY - distance * landing ** 2 - (titleTop + remaining) : 0
    const appear = smooth(heroFlight.progress, 0.967, 0.997)
    const arrived = smooth(scrollY, flightEnd, flightEnd + viewport * 0.42)
    const windowIn = smooth(scrollY, flightEnd - viewport * 0.82, flightEnd - viewport * 0.2)
    const opacity = (appear + (1 - appear) * arrived) * windowIn
    const scale = 1 + (viewport > 700 && window.innerWidth > 767 ? 0.23 : 0.12) * (1 - settle)
    if (opacity) transformTitle(x * (1 - settle), y, scale)
    else transformTitle(0, 0)
    title.style.opacity = String(opacity)
    introduction.style.opacity = String(smooth(landing, 0.46, 0.94))
    const workReveal = smooth(landing, 0.53, 0.97)
    work.style.opacity = String(workReveal)
    work.style.visibility = workReveal ? "visible" : "hidden"
    const shade = 1 - smooth(remaining / viewport, 0.12, 1.16)
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
  const unsubscribe = observeHeroFlight(() => { if (geometry.enhanced && trigger.isActive) render() })
  refresh()
  return () => {
    unsubscribe()
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
