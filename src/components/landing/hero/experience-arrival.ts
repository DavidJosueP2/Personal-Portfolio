import { gsap } from "gsap"
import { heroFlight } from "@/lib/hero-flight"
import type { ScrollTrigger as Trigger } from "gsap/ScrollTrigger"

const smooth = (value: number, low = 0, high = 1) => {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)))
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
  const render = () => {
    const viewport = document.documentElement.clientHeight
    const enhanced = hero.hasAttribute("data-hero-journey")
    root.toggleAttribute("data-experience-arrival", enhanced)
    const panelTop = panel.getBoundingClientRect().top
    if (!enhanced) {
      sheet.style.opacity = "1"
      gsap.set(title, { x: content.clientWidth * 0.84 * (1 - smooth(-panelTop / viewport, -0.72, -0.03)), y: 0, scale: 1, opacity: 1 })
      gsap.set(introduction, { opacity: smooth(-panelTop / viewport, -0.3, 0) })
      gsap.set(work, { autoAlpha: 1 })
      heroFlight.covered = false
      return
    }
    const panelY = panelTop + window.scrollY
    const flightEnd = hero.getBoundingClientRect().top + window.scrollY + hero.offsetHeight - viewport * 4
    const settle = smooth(window.scrollY, flightEnd + viewport * 0.7, panelY)
    const appear = smooth(window.scrollY, flightEnd - viewport * 0.65, flightEnd - viewport * 0.15)
    const baseLeft = content.getBoundingClientRect().left + masthead.offsetLeft + title.offsetLeft
    const baseTop = content.getBoundingClientRect().top + masthead.offsetTop + title.offsetTop
    const centerX = (document.documentElement.clientWidth - title.offsetWidth) / 2
    const centerY = (viewport - title.offsetHeight) / 2
    const finalTop = masthead.offsetTop + title.offsetTop
    // The destination stays fixed while the section approaches beneath the title.
    const arrivalY = centerY + (finalTop - centerY) * settle
    gsap.set(title, {
      x: (centerX - baseLeft) * (1 - settle), y: settle < 1 ? arrivalY - baseTop : 0,
      scale: 1 + (viewport > 700 && window.innerWidth > 767 ? 0.3 : 0.14) * (1 - settle),
      opacity: appear, force3D: true,
    })
    gsap.set(introduction, { opacity: smooth(settle, 0.68, 1) })
    gsap.set(work, { autoAlpha: smooth(settle, 0.65, 1) })
    const shade = smooth(settle, 0.02, 0.9)
    sheet.style.opacity = String(shade)
    heroFlight.covered = shade >= 0.999
  }
  ScrollTrigger.create({
    trigger: panel,
    start: () => hero.hasAttribute("data-hero-journey")
      ? hero.getBoundingClientRect().top + window.scrollY + hero.offsetHeight - innerHeight * 5
      : panel.getBoundingClientRect().top + window.scrollY - innerHeight,
    end: "top -10%", onUpdate: render, onRefresh: render,
  })
  render()
  return () => {
    delete root.dataset.experienceArrival
    sheet.style.removeProperty("opacity")
    gsap.set([title, introduction, work], { clearProps: "transform,opacity,visibility" })
    heroFlight.covered = false
  }
}
