export type Point = readonly [number, number]
export type Color = readonly [number, number, number]
export type Brushstroke = (context: CanvasRenderingContext2D) => void
export type Rim = readonly [Point, Point, Point, Point]
export type Petal = {
  base: Point
  rim: Rim
  bend: Point
  tone: number
  fold: number
}

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
export const mix = (from: number, to: number, amount: number) => from + (to - from) * amount
const between = (from: Point, to: Point, amount: number): Point =>
  [mix(from[0], to[0], amount), mix(from[1], to[1], amount)]

export function cubic([start, first, second, end]: Rim, t: number): Point {
  const a = between(start, first, t)
  const b = between(first, second, t)
  const c = between(second, end, t)
  return between(between(a, b, t), between(b, c, t), t)
}

export function pigment(palette: readonly Color[], shade: number, alpha = 1) {
  const position = clamp(shade) * (palette.length - 1)
  const low = Math.min(Math.floor(position), palette.length - 2)
  const color = palette[low].map((value, channel) => Math.round(mix(value, palette[low + 1][channel], position - low)))
  return `rgb(${color.join(" ")} / ${alpha})`
}

export function stroke(points: Point[], width: number, color: string): Brushstroke {
  const path = new Path2D()
  path.moveTo(...points[0])
  for (const point of points.slice(1)) path.lineTo(...point)
  return (context) => {
    context.strokeStyle = color
    context.lineWidth = width
    context.stroke(path)
  }
}

export function paintSurface(
  strokes: Brushstroke[], petal: Petal, palette: readonly Color[], random: () => number, foliage = false, brushScale = 1,
) {
  const scallops = foliage ? 14 : 5
  const surface = (u: number, v: number): Point => {
    const [x, y] = cubic(petal.rim, u)
    const curl = Math.sin(Math.PI * v)
    const fan = Math.sin(v * Math.PI * 0.5)
    const edge = Math.sin(Math.PI * u) * (Math.sin(u * Math.PI * scallops * 2) * (foliage ? 1.3 : 0.65) + Math.sin(u * 41) * 0.34)
    return [
      mix(petal.base[0], x, fan) + petal.bend[0] * curl,
      mix(petal.base[1], y, v) + petal.bend[1] * curl + edge * brushScale * v ** 4,
    ]
  }
  const tone = (u: number) => {
    const ridge = Math.exp(-((u - petal.fold) ** 2) / 0.031)
    const crease = Math.exp(-((u - petal.fold - 0.2) ** 2) / 0.011)
    return petal.tone + ridge * 0.24 - crease * 0.13 + Math.sin(u * 19) * 0.034
  }

  // Wide, overlapping strokes lay down the color of each form.
  const passes = foliage ? 13 : 19
  for (let pass = 0; pass < passes; pass++) {
    const u = (pass + 0.5) / passes
    const low = clamp(u - 0.86 / passes)
    const high = clamp(u + 0.86 / passes)
    const shape = new Path2D()
    shape.moveTo(...petal.base)
    for (let step = 1; step <= 12; step++) shape.lineTo(...surface(low, step / 12))
    shape.lineTo(...surface(u, 1))
    for (let step = 12; step >= 1; step--) shape.lineTo(...surface(high, step / 12))
    shape.closePath()
    const edge = surface(u, 1)
    const shade = tone(u) + (random() - 0.5) * 0.05
    const colors = [
      pigment(palette, shade - 0.39),
      pigment(palette, shade - 0.20),
      pigment(palette, shade - 0.045),
      pigment(palette, shade - 0.14),
      pigment(palette, shade + (foliage ? 0.03 : 0.19)),
    ]
    strokes.push((context) => {
      const fill = context.createLinearGradient(...petal.base, ...edge)
      for (const [i, stop] of [0, 0.32, 0.69, 0.91, 1].entries()) fill.addColorStop(stop, colors[i])
      context.fillStyle = fill
      context.fill(shape)
    })
  }

  // Broken bristle marks follow the fold so the texture turns with the surface.
  const marks = foliage ? 30 : 66
  for (let mark = 0; mark < marks; mark++) {
    const u = mix(0.025, 0.975, random())
    const start = mix(0.23, 0.95, random())
    const end = Math.min(0.989, start + mix(0.045, 0.21, random()))
    const shade = tone(u) + (random() < 0.53 ? 0.16 : -0.22) - (1 - start) * 0.27
    strokes.push(stroke(
      [surface(u, start), surface(u, mix(start, end, 0.5)), surface(u, end)],
      mix(0.22, 0.85, random()) * brushScale, pigment(palette, shade, mix(0.18, 0.59, random())),
    ))
  }

  if (foliage) {
    const midrib = [surface(0.48, 0.15), surface(0.52, 0.49), surface(0.54, 0.94)]
    strokes.push(stroke(midrib, 0.55, pigment(palette, petal.tone + 0.27, 0.61)))
    for (const v of [0.43, 0.58, 0.72, 0.84]) {
      for (const u of [0.22, 0.82]) {
        strokes.push(stroke([surface(0.52, v), surface(u, v + 0.12)], 0.38, pigment(palette, 0.71, 0.48)))
      }
    }
  } else {
    // A few dabs along the rolled lip catch the light like thicker oil paint.
    for (let u = 0.04; u < 0.94; u += mix(0.02, 0.09, random())) {
      const end = Math.min(0.97, u + mix(0.025, 0.11, random()))
      strokes.push(stroke(
        [surface(u, 0.968), surface((u + end) / 2, 0.989), surface(end, 0.977)],
        mix(0.38, 1.2, random()) * brushScale, pigment(palette, tone(u) + 0.22, mix(0.36, 0.85, random())),
      ))
    }
  }
}

export function paintRandom(seed: number) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
