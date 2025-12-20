export type CanvasViewport = {
  width: number
  height: number
  dpr: number
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export function resizeCanvasToViewport(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const dpr = Math.max(1, window.devicePixelRatio || 1)
  const width = window.innerWidth
  const height = window.innerHeight

  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  return { width, height, dpr } satisfies CanvasViewport
}

export function setCanvasOpacity(ctx: CanvasRenderingContext2D, alpha: number) {
  ctx.globalAlpha = alpha
}

