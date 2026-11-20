export const cursorCardSelector = "[data-service-photo], [data-project-preview]"
export const cursorMediaSelector = `img, main canvas, video, iframe, ${cursorCardSelector}`

type Layout = (element: Element) => CSSStyleDeclaration
type Size = { width: number; height: number }

function boxSize(style: CSSStyleDeclaration): Size {
  const width = parseFloat(style.width)
  const height = parseFloat(style.height)
  if (style.boxSizing === "border-box") return { width, height }
  return {
    width: width + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth),
    height: height + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth),
  }
}

function paintCard(
  context: CanvasRenderingContext2D,
  element: Element,
  style: CSSStyleDeclaration,
  frames: Map<Element, HTMLSpanElement>,
) {
  let frame = frames.get(element)
  if (!frame) {
    frame = document.createElement("span")
    frame.className = "inverse-cursor-frame"
    frame.setAttribute("aria-hidden", "true")
    frame.style.inset = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth]
      .map((border) => `${-parseFloat(border)}px`).join(" ")
    frame.append(...Array.from({ length: 4 }, () => document.createElement("i")))
    element.append(frame)
    frames.set(element, frame)
  }

  // Let the browser project the corners through each card's live 3D transform.
  const corners = Array.from(frame.children, (point) => point.getBoundingClientRect())
  const radius = parseFloat(style.borderTopLeftRadius)
  const size = boxSize(style)
  const toward = (i: number, next: number) => {
    const from = corners[i]
    const to = corners[(i + next + 4) % 4]
    const fraction = Math.min(0.5, radius / ((i % 2 === 0) === (next === 1) ? size.width : size.height))
    return [from.x + (to.x - from.x) * fraction, from.y + (to.y - from.y) * fraction] as const
  }
  context.beginPath()
  context.moveTo(...toward(3, 1))
  corners.forEach(({ x, y }, i) => {
    context.lineTo(...toward(i, -1))
    context.quadraticCurveTo(x, y, ...toward(i, 1))
  })
  context.closePath()
  context.fill()
}

function paintMedia(
  context: CanvasRenderingContext2D,
  element: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | HTMLIFrameElement,
  style: CSSStyleDeclaration,
  width: number,
  height: number,
) {
  const radius = parseFloat(style.borderTopLeftRadius)
  context.beginPath()
  context.roundRect(0, 0, width, height, radius)
  context.clip()

  if (element instanceof HTMLIFrameElement) {
    context.fillRect(0, 0, width, height)
    return
  }

  if (element instanceof HTMLCanvasElement) {
    if (element.width && element.height) context.drawImage(element, 0, 0, width, height)
    return
  }

  // Keep a logo's own background, but leave gaps in transparent image files open.
  context.fillStyle = style.backgroundColor
  context.fillRect(0, 0, width, height)
  const naturalWidth = element instanceof HTMLImageElement ? element.naturalWidth : element.videoWidth
  const naturalHeight = element instanceof HTMLImageElement ? element.naturalHeight : element.videoHeight
  if (!naturalWidth || !naturalHeight || (element instanceof HTMLVideoElement && element.readyState < 2)) return

  const left = parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth)
  const top = parseFloat(style.paddingTop) + parseFloat(style.borderTopWidth)
  const contentWidth = width - left - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth)
  const contentHeight = height - top - parseFloat(style.paddingBottom) - parseFloat(style.borderBottomWidth)
  const fitX = contentWidth / naturalWidth
  const fitY = contentHeight / naturalHeight
  const contain = Math.min(fitX, fitY)
  const scale = style.objectFit === "cover" ? Math.max(fitX, fitY)
    : style.objectFit === "contain" ? contain
    : style.objectFit === "scale-down" ? Math.min(1, contain) : 1
  const drawWidth = style.objectFit === "fill" ? contentWidth : naturalWidth * scale
  const drawHeight = style.objectFit === "fill" ? contentHeight : naturalHeight * scale
  const [positionX = "50%", positionY = "50%"] = style.objectPosition.split(" ")
  const offset = (position: string, space: number) => position.endsWith("%") ? parseFloat(position) / 100 * space : parseFloat(position) || 0
  context.beginPath()
  context.rect(left, top, contentWidth, contentHeight)
  context.clip()
  context.drawImage(element, left + offset(positionX, contentWidth - drawWidth), top + offset(positionY, contentHeight - drawHeight), drawWidth, drawHeight)
}

export function eraseCursorMedia(
  context: CanvasRenderingContext2D,
  element: Element,
  bounds: DOMRect,
  layout: Layout,
  frames: Map<Element, HTMLSpanElement>,
) {
  const style = layout(element)
  if (style.visibility !== "visible") return

  context.save()
  let opacity = 1
  let transform = new DOMMatrix()
  const card = element.matches(cursorCardSelector)
  for (let current: Element | null = element; current; current = current.parentElement) {
    const css = layout(current)
    opacity *= Number(css.opacity)
    if (current !== element && (css.overflowX === "clip" || css.overflowX === "hidden" || css.clipPath !== "none")) {
      const clip = current.getBoundingClientRect()
      // Section handoffs trim the bottom edge of the outgoing panel during scroll.
      const bottomInset = parseFloat(css.clipPath.match(/^inset\(0px 0px ([\d.]+)px/)?.[1] ?? "0")
      context.beginPath()
      context.rect(clip.left, clip.top, clip.width, Math.max(0, clip.height - bottomInset))
      context.clip()
    }
    if (!card && (css.transform !== "none" || css.scale !== "none" || css.rotate !== "none")) {
      const local = new DOMMatrix(css.transform === "none" ? undefined : css.transform)
      const [scaleX = 1, scaleY = scaleX] = css.scale === "none" ? [] : css.scale.split(" ").map(Number)
      const rotation = css.rotate === "none" ? 0 : parseFloat(css.rotate)
      const linear = new DOMMatrix().rotate(rotation).scale(scaleX, scaleY)
      transform = linear.multiply(new DOMMatrix([local.a, local.b, local.c, local.d, 0, 0])).multiply(transform)
    }
  }
  context.globalAlpha = opacity

  if (card) {
    paintCard(context, element, style, frames)
  } else if (element instanceof HTMLCanvasElement || element instanceof HTMLImageElement
    || element instanceof HTMLVideoElement || element instanceof HTMLIFrameElement) {
    const { width, height } = boxSize(style)
    // Use the measured bounds for translation and the CSS matrices for scale and skew.
    const { a, b, c, d } = transform
    const x = bounds.left - Math.min(0, a * width) - Math.min(0, c * height)
    const y = bounds.top - Math.min(0, b * width) - Math.min(0, d * height)
    context.transform(a, b, c, d, x, y)
    paintMedia(context, element, style, width, height)
  }
  context.restore()
}
