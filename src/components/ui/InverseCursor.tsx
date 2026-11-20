import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { gsap } from "gsap"
import { cursorCardSelector, cursorMediaSelector, eraseCursorMedia } from "./inverse-cursor-media"
import "./inverse-cursor.css"

const foregroundSelector = '[role="dialog"], [role="menu"], [data-inverse-cursor-surface]'
const excludedSelector = "[data-inverse-cursor-exclude], [data-hero-intro]:not([hidden])"

export function InverseCursor() {
  const rootRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const media = gsap.matchMedia()
    media.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      let canvasContext: CanvasRenderingContext2D | null = null
      const position = { x: 0, y: 0 }
      const followX = gsap.quickTo(position, "x", { duration: 0.28, ease: "power3.out" })
      const followY = gsap.quickTo(position, "y", { duration: 0.28, ease: "power3.out" })
      const frames = new Map<Element, HTMLSpanElement>()
      let protectedSurfaces: Element[] = []
      const protectedMedia = new Set<Element>()
      const mediaVisibility = new IntersectionObserver((entries) => {
        for (const { target, isIntersecting } of entries) {
          if (isIntersecting) protectedMedia.add(target)
          else protectedMedia.delete(target)
        }
      }, { rootMargin: "90px" })
      let refreshElements = true
      let running = false
      let radius = 0
      let extent = 0
      let scale = 1
      let previousX = -1
      let previousY = -1

      const resize = () => {
        radius = Math.min(82, Math.max(56, window.innerWidth * 0.0575))
        extent = Math.ceil(radius) + 2
        const size = extent * 2
        root.width = root.height = Math.ceil(size * Math.min(3, window.devicePixelRatio || 1))
        root.style.width = root.style.height = `${size}px`
        scale = root.width / size
        previousX = previousY = -1
      }

      const render = () => {
        const context = canvasContext
        if (!context) return
        if (refreshElements) {
          protectedSurfaces = Array.from(document.querySelectorAll(`${excludedSelector}, ${foregroundSelector}`))
          mediaVisibility.disconnect()
          protectedMedia.clear()
          for (const element of document.querySelectorAll(cursorMediaSelector)) {
            if (element.closest(excludedSelector) || element.parentElement?.closest(cursorCardSelector)) continue
            protectedMedia.add(element)
            mediaVisibility.observe(element)
          }
          for (const [element, frame] of frames) {
            if (element.isConnected) continue
            frame.remove()
            frames.delete(element)
          }
          refreshElements = false
        }
        const { x, y } = position
        const left = x - extent
        const top = y - extent
        if (x !== previousX || y !== previousY) {
          root.style.transform = `translate3d(${left}px, ${top}px, 0)`
          previousX = x
          previousY = y
        }

        context.resetTransform()
        context.clearRect(0, 0, root.width, root.height)
        const target = document.elementFromPoint(x, y)
        if (target?.closest(excludedSelector)) return
        const foreground = target?.closest(foregroundSelector)

        context.save()
        context.setTransform(scale, 0, 0, scale, -left * scale, -top * scale)
        if (foreground) {
          const bounds = foreground.getBoundingClientRect()
          context.beginPath()
          context.rect(bounds.left, bounds.top, bounds.width, bounds.height)
          context.clip()
        }
        context.fillStyle = "white"
        context.beginPath()
        context.arc(x, y, radius, 0, Math.PI * 2)
        context.fill()
        context.globalCompositeOperation = "destination-out"

        const styles = new Map<Element, CSSStyleDeclaration>()
        const layout = (element: Element) => {
          let style = styles.get(element)
          if (!style) {
            style = getComputedStyle(element)
            styles.set(element, style)
          }
          return style
        }
        const intersects = (bounds: DOMRect) => bounds.width && bounds.height
          && bounds.right >= x - radius && bounds.left <= x + radius
          && bounds.bottom >= y - radius && bounds.top <= y + radius

        for (const element of protectedSurfaces) {
          if (element === foreground || (foreground && !foreground.contains(element))) continue
          const bounds = element.getBoundingClientRect()
          if (intersects(bounds) && layout(element).visibility === "visible" && Number(layout(element).opacity) > 0) {
            context.fillRect(bounds.left, bounds.top, bounds.width, bounds.height)
          }
        }
        for (const element of protectedMedia) {
          // A modal owns its backdrop, including the media protection inside it.
          if (foreground && !foreground.contains(element)) continue
          const bounds = element.getBoundingClientRect()
          if (intersects(bounds)) eraseCursorMedia(context, element, bounds, layout, frames)
        }
        context.restore()
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
          if (!canvasContext) {
            canvasContext = root.getContext("2d")
            if (!canvasContext) return
            resize()
          }
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
        if (mutations.some(({ target }) => !(target instanceof Element && target.closest(cursorCardSelector)))) refreshElements = true
      })
      observer.observe(document.body, { childList: true, subtree: true })
      document.addEventListener("pointermove", move, { passive: true })
      document.addEventListener("pointerleave", hide)
      document.addEventListener("visibilitychange", onVisibility)
      window.addEventListener("blur", hide)
      window.addEventListener("resize", resize)

      return () => {
        hide()
        observer.disconnect()
        mediaVisibility.disconnect()
        document.removeEventListener("pointermove", move)
        document.removeEventListener("pointerleave", hide)
        document.removeEventListener("visibilitychange", onVisibility)
        window.removeEventListener("blur", hide)
        window.removeEventListener("resize", resize)
        followX.tween.kill()
        followY.tween.kill()
        for (const frame of frames.values()) frame.remove()
      }
    })
    return () => media.revert()
  }, [])

  return createPortal(
    <canvas ref={rootRef} className="inverse-cursor" aria-hidden="true" data-inverse-cursor />,
    document.body,
  )
}
