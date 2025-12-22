import { gsap } from "gsap"

export type RevealOptions = {
  y?: number
  delay?: number
  duration?: number
  stagger?: number
  ease?: string
  start?: string
  once?: boolean
}

const DEFAULTS: Required<Pick<RevealOptions, "y" | "delay" | "duration" | "stagger" | "ease" | "start" | "once">> = {
  y: 14,
  delay: 0,
  duration: 0.9,
  stagger: 0.08,
  ease: "power3.out",
  start: "top 82%",
  once: true,
}

/**
 * Lightweight reveal animation without ScrollTrigger.
 * Uses IntersectionObserver to trigger a GSAP timeline.
 */
export function setupReveal(root: HTMLElement, options: RevealOptions = {}) {
  const opts = { ...DEFAULTS, ...options }

  const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"))
  if (targets.length === 0) return () => {}

  // initial state
  gsap.set(targets, { autoAlpha: 0, y: opts.y })

  const play = () => {
    gsap.killTweensOf(targets)
    gsap
      .timeline({ defaults: { ease: opts.ease } })
      .to(targets, { autoAlpha: 1, y: 0, duration: opts.duration, stagger: opts.stagger, delay: opts.delay, clearProps: "willChange" })
  }

  // IO
  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0]
      if (!e || !e.isIntersecting) return
      play()
      if (opts.once) io.disconnect()
    },
    {
      root: null,
      // approximates start:"top 82%" feel
      rootMargin: "0px 0px -18% 0px",
      threshold: 0.12,
    }
  )

  io.observe(root)

  return () => {
    io.disconnect()
    gsap.killTweensOf(targets)
  }
}

export default setupReveal
