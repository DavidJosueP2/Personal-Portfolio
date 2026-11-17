import { gsap } from "gsap"
import { enterGallery, exitGallery, galleryLanding, smoothStep, type GalleryFrame, type ProjectPose as Pose } from "./project-gallery-motion"

const wrap = (value: number, length: number) => ((value % length) + length) % length

export function createProjectSpread(
  section: HTMLElement,
  scene: HTMLElement,
  anchor: HTMLElement,
  runway: HTMLElement,
  pictures: HTMLButtonElement[],
  onActive: (index: number) => void,
) {
  const count = pictures.length
  const outgoing = Math.ceil((count - 1) / 2)
  const first = -outgoing - 0.5
  const incoming = count - 1 - outgoing
  const compact = matchMedia("(max-width: 899px)")
  const reduced = matchMedia("(prefers-reduced-motion: reduce)")
  const cursor = { index: 0 }
  let target = 0
  let active = 0
  let poses: Pose[] = []
  let frame: GalleryFrame
  let tween: gsap.core.Tween | undefined
  let entrance = 1
  let exit = 0
  let jumpToCarousel: (() => void) | undefined
  let interactive = true

  function paint() {
    if (!poses.length) return
    const current = Math.round(cursor.index)
    for (const [index, picture] of pictures.entries()) {
      const offset = wrap(index - cursor.index - first, count) + first
      const lane = (offset - first) * 2
      const step = Math.min(poses.length - 2, Math.floor(lane))
      const a = poses[step]
      const b = poses[step + 1]
      const before = poses[Math.max(0, step - 1)]
      const after = poses[Math.min(poses.length - 1, step + 2)]
      const t = lane - step
      const mix = (from: number, to: number) => from + (to - from) * t
      const trace = (axis: "x" | "y") => {
        const travel = b[axis] - a[axis]
        const exit = (b[axis] - before[axis]) / 2
        const entry = (after[axis] - a[axis]) / 2
        return mix(a[axis], b[axis]) + t * (1 - t) * ((1 - t) * (exit - travel) + t * (travel - entry))
      }
      const carousel = {
        x: trace("x"), y: trace("y"), scale: mix(a.scale, b.scale),
        pitch: mix(a.pitch, b.pitch), yaw: mix(a.yaw, b.yaw), roll: mix(a.roll, b.roll),
        opacity: mix(a.opacity, b.opacity), depth: mix(a.depth, b.depth),
      }
      const pose = entrance < 1
        ? enterGallery(frame, carousel, wrap(index - current, count), count, entrance)
        : exit > 0 ? exitGallery(frame, carousel, index, exit) : carousel
      picture.style.transform = `translate3d(${pose.x}px, ${pose.y}px, 0) translate(-50%, -50%) perspective(1000px) rotateX(${pose.pitch}deg) rotateY(${pose.yaw}deg) rotateZ(${pose.roll}deg) scale(${pose.scale})`
      picture.style.opacity = String(pose.opacity)
      picture.style.visibility = pose.opacity <= 0.015 ? "hidden" : "visible"
      picture.style.zIndex = String(Math.round(pose.depth))
    }

    const next = wrap(current, count)
    if (next !== active) {
      active = next
      onActive(next)
    }
  }

  function measure() {
    const bounds = scene.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    const focus = anchor.getBoundingClientRect()
    const width = scene.clientWidth
    const height = scene.clientHeight
    const centerX = (focus.left + focus.width / 2 - bounds.left) * width / bounds.width
    const centerY = (focus.top + focus.height / 2 - bounds.top) * height / bounds.height
    const mobile = compact.matches
    const upperEdge = Math.min(height, window.innerHeight)
    frame = { width, height: upperEdge, cardWidth: anchor.offsetWidth, compact: mobile }
    const top: Pose = { x: width * (mobile ? 0.79 : 0.28), y: mobile ? centerY - anchor.offsetHeight * 0.67 : 86 + anchor.offsetHeight * 0.25, scale: mobile ? 0.37 : 0.4, pitch: 9, yaw: -15, roll: -8, opacity: 1, depth: 18 }
    const bottom: Pose = { x: width * (mobile ? 0.88 : 0.89), y: mobile ? height - 22 : upperEdge * 0.995, scale: mobile ? 0.36 : 0.46, pitch: 10, yaw: -18, roll: -9, opacity: 1, depth: 18 }
    const center: Pose = { x: centerX, y: centerY, scale: 1, pitch: 0, yaw: 0, roll: 0, opacity: 1, depth: 40 }

    const slot = (offset: number): Pose => {
      if (offset === 0) return center
      const above = offset > 0
      const origin = above ? top : bottom
      const layer = Math.abs(offset) - 1
      return {
        ...origin,
        x: origin.x - layer * width * (mobile ? 0.062 : 0.025),
        y: origin.y - layer * (mobile ? 14 : 19),
        scale: origin.scale * Math.max(0.55, 1 - 0.068 * layer),
        roll: origin.roll + layer * 1.6,
        depth: origin.depth - layer * 4,
      }
    }

    // Each project keeps the same image element around the circuit. The seam is offstage.
    const keys: Pose[] = [{
      ...slot(-outgoing), x: width * 1.13, y: mobile ? bottom.y + 70 : height * 1.14, opacity: 0,
    }]
    for (let offset = -outgoing; offset <= incoming; offset++) {
      const pose = slot(offset)
      keys.push(pose)
      if (offset === incoming) break
      const next = slot(offset + 1)
      keys.push({
        x: (pose.x + next.x) / 2 + (offset === -1 ? width * 0.045 : 0),
        y: (pose.y + next.y) / 2 - (offset === 0 ? anchor.offsetHeight * 0.075 : 0),
        scale: (pose.scale + next.scale) / 2,
        pitch: offset === -1 || offset === 0 ? 7 : (pose.pitch + next.pitch) / 2,
        yaw: offset === -1 ? -22 : (pose.yaw + next.yaw) / 2,
        roll: (pose.roll + next.roll) / 2,
        opacity: 1,
        depth: (pose.depth + next.depth) / 2,
      })
    }
    keys.push({
      ...slot(incoming), x: mobile ? width * 0.92 : width * 0.20, y: mobile ? top.y - 84 : -anchor.offsetHeight / 2, opacity: 0,
    })
    poses = keys
    paint()
  }

  function go(index: number) {
    target = index
    tween?.kill()
    if (reduced.matches) {
      cursor.index = index
      paint()
      return
    }
    tween = gsap.to(cursor, {
      index,
      duration: 0.65 + Math.min(0.32, Math.abs(index - cursor.index) * 0.13),
      ease: "power2.inOut",
      onUpdate: paint,
    })
  }

  const size = new ResizeObserver(measure)
  size.observe(scene)
  size.observe(anchor)
  const settle = () => go(target)
  reduced.addEventListener("change", settle)
  measure()

  const scrollMotion = gsap.matchMedia()
  scrollMotion.add("(prefers-reduced-motion: no-preference)", () => {
    let disposed = false
    let cleanup: (() => void) | undefined
    void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      if (disposed) return
      gsap.registerPlugin(ScrollTrigger)
      const panel = section.closest<HTMLElement>("[data-stack-panel]") ?? section
      const words = Array.from(section.querySelectorAll<HTMLElement>("[data-project-phrase-line]"))

      const render = () => {
        const paper = smoothStep(galleryLanding + 0.075, 0.97, entrance)
        const controls = smoothStep(0.89, 1, entrance) * (1 - smoothStep(0.06, 0.44, exit))
        interactive = entrance >= 0.96 && exit < 0.16
        section.toggleAttribute("data-project-interactive", interactive)
        section.toggleAttribute("data-nav-light", paper >= 0.52)
        section.style.setProperty("--project-darkness", String(1 - paper))
        section.style.setProperty("--project-interface", String(controls))
        for (const [index, word] of words.entries()) {
          const appear = smoothStep(0.19 + index * 0.053, 0.34 + index * 0.053, entrance)
          const depart = smoothStep(galleryLanding - 0.02 + index * 0.02, galleryLanding + 0.10 + index * 0.02, entrance)
          word.style.opacity = String(appear * (1 - depart))
          word.style.transform = `translateY(${(1 - appear) * 80 - depart * 40}%)`
        }
        paint()
      }
      const paintEntrance = ({ progress }: { progress: number }) => {
        entrance = progress
        render()
      }
      const paintExit = ({ progress }: { progress: number }) => {
        exit = progress
        render()
      }
      section.dataset.projectMotion = ""
      measure()
      const intro = ScrollTrigger.create({
        trigger: panel,
        start: "top 78%",
        end: () => `top -${runway.offsetHeight}px`,
        onUpdate: paintEntrance,
        onRefresh: paintEntrance,
      })
      const outro = ScrollTrigger.create({
        trigger: panel,
        start: "bottom bottom",
        end: "bottom 16%",
        onUpdate: paintExit,
        onRefresh: paintExit,
      })
      jumpToCarousel = () => {
        window.scrollTo({ top: intro.end + 2, behavior: "instant" })
        ScrollTrigger.update()
      }
      ScrollTrigger.refresh()

      cleanup = () => {
        intro.kill()
        outro.kill()
        jumpToCarousel = undefined
        entrance = 1
        exit = 0
        interactive = true
        delete section.dataset.projectMotion
        delete section.dataset.projectInteractive
        section.setAttribute("data-nav-light", "")
        section.style.removeProperty("--project-darkness")
        section.style.removeProperty("--project-interface")
        words.forEach((word) => {
          word.style.removeProperty("opacity")
          word.style.removeProperty("transform")
        })
        measure()
      }
    }).catch((error: unknown) => console.error("Could not start the project gallery motion.", error))
    return () => {
      disposed = true
      cleanup?.()
    }
  })

  return {
    canInteract: () => interactive,
    focusCarousel: () => { if (!interactive) jumpToCarousel?.() },
    step: (direction: number) => go(target + direction),
    select: (index: number) => {
      if (index === active) return
      const current = Math.round(cursor.index)
      const distance = wrap(index - current + Math.floor(count / 2), count) - Math.floor(count / 2)
      go(current + distance)
    },
    startDrag: () => {
      tween?.kill()
      return cursor.index
    },
    drag: (index: number) => {
      if (reduced.matches) return
      cursor.index = index
      paint()
    },
    go,
    destroy: () => {
      scrollMotion.revert()
      size.disconnect()
      reduced.removeEventListener("change", settle)
      tween?.kill()
    },
  }
}
