import { gsap } from "gsap"
import { heroFlight, updateHeroFlight } from "@/lib/hero-flight"
import { setupPlanetDeparture } from "./planet-departure"

export function setupHeroJourney(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>("[data-hero-stage]")
  const name = root.querySelector<HTMLElement>("[data-hero-name]")
  const host = root.querySelector<HTMLElement>("[data-hero-earth-host]")
  const credit = root.querySelector<HTMLElement>("[data-hero-credit]")
  if (!stage || !name || !host || !credit) return

  const media = gsap.matchMedia()
  media.add("(prefers-reduced-motion: no-preference)", (context) => {
    // This imperative canvas has one owner and one GPU context across both flights.
    const canvas = document.createElement("canvas")
    canvas.dataset.heroEarth = ""
    canvas.className = "hero-earth"
    canvas.setAttribute("aria-hidden", "true")
    host.append(canvas)
    const webgl = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "high-performance" })
    if (!webgl) { canvas.remove(); return }
    const controller = new AbortController()
    let scene: Awaited<ReturnType<typeof import("./earth-scene").createEarthScene>> = null
    let trigger: import("gsap/ScrollTrigger").ScrollTrigger | undefined
    let resize: ResizeObserver | undefined
    let visibility: IntersectionObserver | undefined
    let stageVisible = true
    let departure: ReturnType<typeof setupPlanetDeparture> = null
    let ticking = false
    let elapsed = 0
    let lastFrame = 0
    let started = false
    const camera = { progress: 0 }
    const details = root.querySelectorAll<HTMLElement>("[data-hero-secondary]")
    const header = document.querySelector<HTMLElement>(".site-header")
    const state = () => {
      updateHeroFlight(Boolean(trigger?.isActive), camera.progress)
      // Hidden controls must also leave keyboard navigation while the camera passes them.
      const cleared = camera.progress > 0.15
      details.forEach((element) => { element.inert = cleared })
      if (header) header.inert = camera.progress > 0.13 && camera.progress < 0.97 && Boolean(trigger?.isActive)
    }
    const draw = (_time: number, delta: number) => {
      elapsed += Math.min(delta / 1000, 0.05)
      if (elapsed - lastFrame < 1 / 30) return
      lastFrame = elapsed
      if (departure?.ownsCanvas) scene?.drawDeparture(departure.progress, elapsed)
      else if (camera.progress >= 0.22 && !heroFlight.covered) scene?.draw(camera.progress, elapsed)
    }
    const updateAnimation = () => {
      const visible = !document.hidden && (departure?.ownsCanvas ? departure.visible : stageVisible) && camera.progress >= 0.22
      if (visible === ticking) return
      ticking = visible
      if (visible) gsap.ticker.add(draw)
      else gsap.ticker.remove(draw)
    }

    const preparation = import("./earth-scene").then(({ createEarthScene }) => controller.signal.aborted ? null : createEarthScene(canvas, webgl, controller.signal))
    void Promise.all([
      import("gsap/ScrollTrigger"),
      preparation,
      document.fonts.ready,
    ]).then(([{ ScrollTrigger }, earth]) => {
      if (controller.signal.aborted || !earth) { earth?.dispose(); return }
      scene = earth
      gsap.registerPlugin(ScrollTrigger)
      const startAtTop = () => {
        // A slow connection must never strand a visitor in an unready, pinned scene.
        // If they already started reading, keep that layout until they return home.
        if (started || controller.signal.aborted || window.scrollY > 1 || Math.abs(root.getBoundingClientRect().top) > 1) return
        started = true
        context.add(() => {
          root.dataset.heroJourney = ""
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: root, start: "top top", end: "bottom 400%", scrub: 0.35,
              invalidateOnRefresh: true,
              onUpdate: () => { state(); updateAnimation() },
              onToggle: () => { state(); updateAnimation() },
              onRefresh: () => { scene?.resize(); state(); updateAnimation() },
            },
            onUpdate: () => { state(); updateAnimation() },
          })
          trigger = timeline.scrollTrigger
          timeline
            .to(camera, { progress: 0.64, duration: 0.52, ease: "none" }, 0)
            .to(camera, { progress: 1, duration: 0.48, ease: "none" }, 0.52)
            .to(details, { opacity: 0, y: -26, duration: 0.1, stagger: 0.005, ease: "power2.in" }, 0)
            .to(header, { autoAlpha: 0, yPercent: -100, duration: 0.1, ease: "power2.in" }, 0.025)
            .to(name, {
              y: () => stage.clientHeight / 2 - name.offsetTop - name.offsetHeight / 2,
              scale: 1.04, duration: 0.16, ease: "power2.inOut",
            }, 0)
            .to(name, { scale: 14, autoAlpha: 0, duration: 0.14, ease: "power3.in" }, 0.2)
            .to(canvas, { opacity: 1, duration: 0.09, ease: "sine.inOut" }, 0.245)
            .to(credit, { autoAlpha: 1, duration: 0.035, ease: "sine.out" }, 0.34)
            .to(credit, { autoAlpha: 0, duration: 0.025 }, 0.45)
            // Restore the navigation for the first content section, after the flight.
            .to(header, { autoAlpha: 1, yPercent: 0, duration: 0.03, ease: "power2.out" }, 0.97)

          departure = setupPlanetDeparture(canvas, host, updateAnimation)
          resize = new ResizeObserver(() => scene?.resize())
          resize.observe(stage)
          visibility = new IntersectionObserver(([entry]) => {
            stageVisible = entry.isIntersecting
            updateAnimation()
          })
          visibility.observe(stage)
          document.addEventListener("visibilitychange", updateAnimation)
          root.dataset.heroEarthReady = ""
          ScrollTrigger.refresh()
        })
      }
      window.addEventListener("scroll", startAtTop, { passive: true, signal: controller.signal })
      startAtTop()
    }).catch((error: unknown) => {
      delete root.dataset.heroJourney
      updateHeroFlight(false, 0)
      console.error("Could not start the Earth entrance.", error)
      void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => ScrollTrigger.refresh())
    })

    return () => {
      controller.abort()
      resize?.disconnect()
      visibility?.disconnect()
      departure?.dispose()
      document.removeEventListener("visibilitychange", updateAnimation)
      gsap.ticker.remove(draw)
      scene?.dispose()
      canvas.remove()
      // Async shader compilation must finish before releasing its context.
      const release = () => webgl.getExtension("WEBGL_lose_context")?.loseContext()
      void preparation.then(release, release)
      updateHeroFlight(false, 0)
      details.forEach((element) => { element.inert = false })
      if (header) header.inert = false
      delete root.dataset.heroJourney
      delete root.dataset.heroEarthReady
    }
  })
  return () => media.revert()
}
