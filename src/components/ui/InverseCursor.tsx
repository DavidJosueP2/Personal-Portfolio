import { useEffect, useId, useRef } from "react"
import { createPortal } from "react-dom"
import { gsap } from "gsap"
import "./inverse-cursor.css"

const foregroundSelector = '[role="dialog"], [role="menu"]'
const excludedSelector = `img, picture, video, main canvas, iframe, [data-inverse-cursor-exclude], [data-hero-intro]:not([hidden]), ${foregroundSelector}`
const svgNamespace = "http://www.w3.org/2000/svg"

export function InverseCursor() {
  const rootRef = useRef<SVGSVGElement>(null)
  const circleRef = useRef<SVGCircleElement>(null)
  const exclusionsRef = useRef<SVGGElement>(null)
  const surfaceRef = useRef<SVGRectElement>(null)
  const maskId = useId()

  useEffect(() => {
    const root = rootRef.current
    const circle = circleRef.current
    const exclusions = exclusionsRef.current
    const surface = surfaceRef.current
    if (!root || !circle || !exclusions || !surface) return

    const media = gsap.matchMedia()
    media.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const position = { x: 0, y: 0 }
      const followX = gsap.quickTo(position, "x", { duration: 0.28, ease: "power3.out" })
      const followY = gsap.quickTo(position, "y", { duration: 0.28, ease: "power3.out" })
      const holes: SVGRectElement[] = []
      const geometry: string[] = []
      let excluded: Element[] = []
      let refreshElements = true
      let running = false
      let radius = 0
      let previousX = -1
      let previousY = -1
      let previousSurface = ""

      const resize = () => {
        radius = Math.min(82, Math.max(56, window.innerWidth * 0.0575))
        circle.setAttribute("r", String(radius))
      }

      const render = () => {
        if (refreshElements) {
          excluded = Array.from(document.querySelectorAll(excludedSelector))
          refreshElements = false
        }
        const { x, y } = position
        const foreground = document.elementFromPoint(x, y)?.closest(foregroundSelector)
        const bounds = foreground?.getBoundingClientRect()
        const area = bounds
          ? [bounds.left, bounds.top, bounds.width, bounds.height]
          : [0, 0, window.innerWidth, window.innerHeight]
        const surfaceGeometry = area.join(":")
        if (surfaceGeometry !== previousSurface) {
          for (const [index, name] of ["x", "y", "width", "height"].entries()) surface.setAttribute(name, String(area[index]))
          previousSurface = surfaceGeometry
        }
        if (x !== previousX || y !== previousY) {
          circle.setAttribute("cx", String(x))
          circle.setAttribute("cy", String(y))
          previousX = x
          previousY = y
        }

        let used = 0
        // Protect the whole visible bounds, including the corners of tilted image cards.
        for (const element of excluded) {
          // A foreground window owns its own backdrop. Images behind it cannot punch holes through its text.
          if (element === foreground || (foreground && !foreground.contains(element))) continue
          const bounds = element.getBoundingClientRect()
          if (!bounds.width || !bounds.height
            || bounds.right < x - radius || bounds.left > x + radius
            || bounds.bottom < y - radius || bounds.top > y + radius) continue
          const style = getComputedStyle(element)
          if (style.visibility !== "visible" || Number(style.opacity) === 0) continue

          if (!holes[used]) {
            const hole = document.createElementNS(svgNamespace, "rect")
            hole.setAttribute("fill", "black")
            exclusions.append(hole)
            holes.push(hole)
          }
          const hole = holes[used]
          const left = Math.floor(bounds.left - 1)
          const top = Math.floor(bounds.top - 1)
          const width = Math.ceil(bounds.right + 1) - left
          const height = Math.ceil(bounds.bottom + 1) - top
          const next = `${left}:${top}:${width}:${height}`
          if (geometry[used] !== next) {
            hole.setAttribute("x", String(left))
            hole.setAttribute("y", String(top))
            hole.setAttribute("width", String(width))
            hole.setAttribute("height", String(height))
            geometry[used] = next
          }
          hole.removeAttribute("display")
          used++
        }
        for (let index = used; index < holes.length; index++) holes[index].setAttribute("display", "none")
      }

      const hide = () => {
        delete root.dataset.visible
        if (!running) return
        running = false
        gsap.ticker.remove(render)
        followX.tween.pause()
        followY.tween.pause()
      }

      const move = (event: PointerEvent) => {
        if (event.pointerType !== "mouse" || document.hidden) return
        if (event.target instanceof Element && event.target.closest("[data-inverse-cursor-exclude]")) {
          hide()
          return
        }
        if (!running) {
          position.x = event.clientX
          position.y = event.clientY
          render()
          running = true
          root.dataset.visible = ""
          gsap.ticker.add(render)
          return
        }
        followX(event.clientX)
        followY(event.clientY)
      }

      const onVisibility = () => { if (document.hidden) hide() }
      const observer = new MutationObserver((mutations) => {
        if (mutations.some(({ target }) => !root.contains(target))) refreshElements = true
      })
      observer.observe(document.body, { childList: true, subtree: true })
      document.addEventListener("pointermove", move, { passive: true })
      document.addEventListener("pointerleave", hide)
      document.addEventListener("visibilitychange", onVisibility)
      window.addEventListener("blur", hide)
      window.addEventListener("resize", resize)
      resize()

      return () => {
        hide()
        observer.disconnect()
        document.removeEventListener("pointermove", move)
        document.removeEventListener("pointerleave", hide)
        document.removeEventListener("visibilitychange", onVisibility)
        window.removeEventListener("blur", hide)
        window.removeEventListener("resize", resize)
        followX.tween.kill()
        followY.tween.kill()
        exclusions.replaceChildren()
      }
    })
    return () => media.revert()
  }, [])

  return createPortal(
    <svg ref={rootRef} className="inverse-cursor" aria-hidden="true" focusable="false" data-inverse-cursor>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width="100%" height="100%" style={{ maskType: "luminance" }}>
          <rect ref={surfaceRef} width="100%" height="100%" fill="white" />
          <g ref={exclusionsRef} />
        </mask>
      </defs>
      <circle ref={circleRef} fill="white" mask={`url(#${maskId})`} />
    </svg>,
    document.body,
  )
}
