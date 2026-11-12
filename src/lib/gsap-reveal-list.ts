import { gsap } from "gsap"
import { prefersReducedMotion } from "./motion"

export function setupRevealList(root: HTMLElement) {
  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return

  const context = gsap.context(() => {}, root)
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      observer.unobserve(entry.target)
      context.add(() => {
        gsap.fromTo(
          entry.target,
          { opacity: 0.75, y: 10 },
          { opacity: 1, y: 0, duration: 0.48, ease: "power3.out", clearProps: "opacity,transform" },
        )
      })
    }
  }, { rootMargin: "0px 0px 6% 0px" })

  root.querySelectorAll("[data-reveal-item]").forEach((item) => observer.observe(item))

  return () => {
    observer.disconnect()
    context.revert()
  }
}
