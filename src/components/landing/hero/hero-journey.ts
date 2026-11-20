import { gsap } from "gsap"
import { heroFlight, updateHeroFlight } from "@/lib/hero-flight"
import { scheduleIdle } from "@/lib/idle-work"
import { setupPlanetDeparture } from "./planet-departure"

type EarthScene = Awaited<ReturnType<typeof import("./earth-scene").createEarthScene>>

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
    const controller = new AbortController()
    const intro = document.querySelector("[data-hero-intro]")
    const introActive = () => intro?.hasAttribute("data-intro-active") ?? false
    let webgl: WebGL2RenderingContext | null = null
    let scene: EarthScene = null
    let scheduled: (() => void) | undefined
    let earthModule: Promise<typeof import("./earth-scene") | null> | undefined
    let preparation: Promise<EarthScene> | undefined
    let trigger: import("gsap/ScrollTrigger").ScrollTrigger | undefined
    let resize: ResizeObserver | undefined
    let visibility: IntersectionObserver | undefined
    let stageVisible = true
    let departure: ReturnType<typeof setupPlanetDeparture> = null
    let ticking = false
    let elapsed = 0
    let lastFrame = 0
    let renderedProgress = -1
    let cleared = false
    let navigationHidden = false
    let started = false
    const camera = { progress: 0 }
    const details = root.querySelectorAll<HTMLElement>("[data-hero-secondary]")
    const header = document.querySelector<HTMLElement>(".site-header")
    const state = () => {
      updateHeroFlight(Boolean(trigger?.isActive), camera.progress)
      // Hidden controls must also leave keyboard navigation while the camera passes them.
      const hideDetails = camera.progress > 0.15
      if (cleared !== hideDetails) {
        cleared = hideDetails
        details.forEach((element) => { element.inert = cleared })
      }
      const hideNavigation = camera.progress > 0.13 && camera.progress < 0.97 && Boolean(trigger?.isActive)
      if (header && navigationHidden !== hideNavigation) header.inert = navigationHidden = hideNavigation
    }
    const draw = (_time: number, delta: number) => {
      elapsed += Math.min(delta / 1000, 0.05)
      if (!departure?.ownsCanvas && heroFlight.covered) return
      const progress = departure?.ownsCanvas ? departure.progress : camera.progress
      const moving = delta < 24 && Math.abs(progress - renderedProgress) > 0.0001
      if (elapsed - lastFrame < 1 / (moving ? 60 : 30) - 0.001) return
      lastFrame = elapsed
      renderedProgress = progress
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

    const prepare = () => {
      scheduled = undefined
      if (preparation || window.scrollY > window.innerHeight || controller.signal.aborted) return
      // Download the scene during the opening, then allocate WebGL after it settles.
      earthModule ??= import("./earth-scene").catch((error: unknown) => {
        if (!controller.signal.aborted) console.error("Could not load the Earth entrance.", error)
        return null
      })
      if (introActive()) return
      preparation = earthModule.then((earth) => {
        if (controller.signal.aborted || !earth) return null
        webgl = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "high-performance" })
        if (!webgl) return null
        host.append(canvas)
        return earth.createEarthScene(canvas, webgl, controller.signal)
      })
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

            departure = setupPlanetDeparture(canvas, host, (canvasEntered) => {
              // Replace the garden frame before the shared canvas enters the closing section.
              if (canvasEntered && departure?.visible) scene?.drawDeparture(departure.progress, elapsed)
              updateAnimation()
            })
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
    }
    const schedulePreparation = () => {
      if (!scheduled && !preparation && (!earthModule || !introActive()) && window.scrollY <= window.innerHeight) {
        scheduled = scheduleIdle(prepare, 350)
      }
    }
    const opening = new MutationObserver(schedulePreparation)
    if (intro) opening.observe(intro, { attributes: true, attributeFilter: ["data-intro-active"] })
    const firstFrame = window.requestAnimationFrame(schedulePreparation)
    window.addEventListener("scroll", schedulePreparation, { passive: true, signal: controller.signal })

    return () => {
      controller.abort()
      opening.disconnect()
      window.cancelAnimationFrame(firstFrame)
      scheduled?.()
      resize?.disconnect()
      visibility?.disconnect()
      departure?.dispose()
      document.removeEventListener("visibilitychange", updateAnimation)
      gsap.ticker.remove(draw)
      scene?.dispose()
      canvas.remove()
      // Async shader compilation must finish before releasing its context.
      const release = () => webgl?.getExtension("WEBGL_lose_context")?.loseContext()
      void preparation?.then(release, release)
      updateHeroFlight(false, 0)
      details.forEach((element) => { element.inert = false })
      if (header) header.inert = false
      delete root.dataset.heroJourney
      delete root.dataset.heroEarthReady
    }
  })
  return () => media.revert()
}
