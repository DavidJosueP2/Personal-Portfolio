import { gsap } from "gsap"

export type RevealListOptions = {
  y?: number
  duration?: number
  ease?: string
  threshold?: number
  rootMargin?: string
}

const DEFAULTS: Required<RevealListOptions> = {
  y: 18,
  duration: 0.8,
  ease: "power3.out",
  threshold: 0.18,
  rootMargin: "0px 0px -12% 0px",
}

/**
 * Reveal items individually as they enter the viewport.
 * Targets: descendants with [data-reveal-item]
 */
export function setupRevealList(root: HTMLElement, options: RevealListOptions = {}) {
  const opts = { ...DEFAULTS, ...options }

  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal-item]"))
  if (items.length === 0) return () => {}

  gsap.set(items, { autoAlpha: 0, y: opts.y })

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const el = e.target as HTMLElement
        io.unobserve(el)

        gsap.killTweensOf(el)
        gsap.to(el, {
          autoAlpha: 1,
          y: 0,
          duration: opts.duration,
          ease: opts.ease,
          clearProps: "willChange",
        })
      }
    },
    {
      root: null,
      rootMargin: opts.rootMargin,
      threshold: opts.threshold,
    }
  )

  for (const el of items) io.observe(el)

  return () => {
    io.disconnect()
    gsap.killTweensOf(items)
  }
}

