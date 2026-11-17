type Point = readonly [number, number]
type Color = readonly [number, number, number]
type Brushstroke = (context: CanvasRenderingContext2D) => void
type Rim = readonly [Point, Point, Point, Point]
type Petal = {
  base: Point
  rim: Rim
  bend: Point
  tone: number
  fold: number
}

export const roseWidth = 160
export const roseHeight = 176
export const roseRoot = [116, 166] as const

const palettes = {
  carmine: [[48, 7, 23], [119, 22, 46], [191, 48, 77], [231, 105, 124], [255, 208, 180]],
  blush: [[61, 13, 31], [132, 34, 57], [201, 79, 105], [237, 136, 151], [255, 221, 194]],
  leaf: [[17, 26, 19], [41, 56, 34], [78, 91, 49], [129, 134, 73], [187, 179, 112]],
} satisfies Record<string, readonly Color[]>

// Back petals, inner folds, then the overlapping petals that form the cup.
const open: Petal[] = [
  { base: [76, 77], rim: [[30, 46], [23, 6], [61, 3], [79, 26]], bend: [-9, -5], tone: 0.64, fold: 0.32 },
  { base: [79, 77], rim: [[51, 31], [65, -2], [117, 7], [111, 41]], bend: [5, -8], tone: 0.68, fold: 0.66 },
  { base: [80, 74], rim: [[92, 29], [121, 12], [143, 42], [127, 62]], bend: [11, -6], tone: 0.52, fold: 0.83 },
  { base: [80, 66], rim: [[49, 42], [51, 24], [84, 14], [99, 36]], bend: [-5, -5], tone: 0.31, fold: 0.48 },
  { base: [76, 65], rim: [[58, 49], [45, 27], [83, 29], [95, 48]], bend: [-3, -6], tone: 0.52, fold: 0.22 },
  { base: [78, 66], rim: [[68, 49], [83, 26], [102, 40], [96, 55]], bend: [2, -5], tone: 0.36, fold: 0.66 },
  { base: [81, 69], rim: [[58, 45], [58, 28], [72, 41], [86, 48]], bend: [-3, 5], tone: 0.70, fold: 0.38 },
  { base: [76, 83], rim: [[24, 53], [16, 35], [34, 39], [69, 61]], bend: [-11, 5], tone: 0.57, fold: 0.21 },
  { base: [84, 80], rim: [[76, 57], [98, 58], [105, 29], [131, 46]], bend: [9, 7], tone: 0.66, fold: 0.76 },
  { base: [78, 93], rim: [[28, 60], [33, 45], [69, 82], [108, 58]], bend: [-7, 10], tone: 0.66, fold: 0.22 },
  { base: [76, 94], rim: [[54, 77], [88, 79], [122, 73], [134, 53]], bend: [10, 11], tone: 0.48, fold: 0.64 },
  { base: [78, 96], rim: [[43, 71], [56, 76], [77, 98], [108, 78]], bend: [-4, 8], tone: 0.48, fold: 0.46 },
]

const cup: Petal[] = [
  { base: [76, 91], rim: [[37, 48], [34, 17], [60, 13], [82, 26]], bend: [-8, -5], tone: 0.60, fold: 0.23 },
  { base: [80, 90], rim: [[66, 30], [67, 8], [108, 13], [108, 40]], bend: [7, -7], tone: 0.72, fold: 0.72 },
  { base: [77, 84], rim: [[56, 44], [56, 27], [82, 23], [96, 38]], bend: [-3, -6], tone: 0.40, fold: 0.52 },
  { base: [82, 88], rim: [[80, 43], [96, 36], [105, 24], [122, 31]], bend: [13, -4], tone: 0.59, fold: 0.73 },
  { base: [74, 95], rim: [[40, 55], [32, 35], [36, 33], [48, 42]], bend: [-12, 1], tone: 0.42, fold: 0.26 },
  { base: [76, 96], rim: [[42, 43], [53, 32], [65, 62], [102, 45]], bend: [-10, -2], tone: 0.72, fold: 0.32 },
  { base: [76, 96], rim: [[56, 78], [77, 86], [103, 49], [119, 44]], bend: [13, 7], tone: 0.52, fold: 0.64 },
]

const bud: Petal[] = [
  { base: [77, 94], rim: [[60, 60], [58, 36], [72, 32], [87, 46]], bend: [-7, -3], tone: 0.59, fold: 0.38 },
  { base: [78, 94], rim: [[69, 50], [70, 33], [93, 40], [94, 60]], bend: [8, -4], tone: 0.62, fold: 0.62 },
  { base: [77, 93], rim: [[65, 52], [72, 55], [83, 51], [95, 48]], bend: [10, 1], tone: 0.44, fold: 0.67 },
  { base: [76, 95], rim: [[58, 57], [64, 48], [69, 65], [85, 62]], bend: [-8, 0], tone: 0.68, fold: 0.34 },
  { base: [76, 96], rim: [[71, 87], [74, 75], [89, 78], [98, 60]], bend: [7, 3], tone: 0.41, fold: 0.7 },
]

const leaves: Petal[] = [
  { base: [105, 150], rim: [[110, 145], [112, 134], [137, 109], [145, 108]], bend: [6, 10], tone: 0.47, fold: 0.4 },
  { base: [99, 142], rim: [[92, 140], [76, 129], [59, 139], [50, 150]], bend: [-6, 13], tone: 0.54, fold: 0.56 },
  { base: [90, 128], rim: [[83, 127], [61, 128], [49, 108], [32, 110]], bend: [-9, 11], tone: 0.40, fold: 0.63 },
  { base: [86, 119], rim: [[92, 111], [110, 89], [123, 100], [130, 90]], bend: [6, 10], tone: 0.57, fold: 0.39 },
]

const calyx: Petal[] = [
  { base: [77, 100], rim: [[45, 78], [57, 87], [64, 88], [69, 90]], bend: [-4, 1], tone: 0.41, fold: 0.48 },
  { base: [78, 101], rim: [[79, 92], [90, 93], [98, 90], [104, 81]], bend: [5, 2], tone: 0.51, fold: 0.58 },
  { base: [77, 100], rim: [[64, 87], [68, 88], [75, 93], [79, 89]], bend: [0, 2], tone: 0.47, fold: 0.32 },
]

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount
const between = (from: Point, to: Point, amount: number): Point =>
  [mix(from[0], to[0], amount), mix(from[1], to[1], amount)]

function cubic([start, first, second, end]: Rim, t: number): Point {
  const a = between(start, first, t)
  const b = between(first, second, t)
  const c = between(second, end, t)
  return between(between(a, b, t), between(b, c, t), t)
}

function pigment(palette: readonly Color[], shade: number, alpha = 1) {
  const position = clamp(shade) * (palette.length - 1)
  const low = Math.min(Math.floor(position), palette.length - 2)
  const color = palette[low].map((value, channel) => Math.round(mix(value, palette[low + 1][channel], position - low)))
  return `rgb(${color.join(" ")} / ${alpha})`
}

function stroke(points: Point[], width: number, color: string): Brushstroke {
  const path = new Path2D()
  path.moveTo(...points[0])
  for (const point of points.slice(1)) path.lineTo(...point)
  return (context) => {
    context.strokeStyle = color
    context.lineWidth = width
    context.stroke(path)
  }
}

function paintSurface(
  strokes: Brushstroke[], petal: Petal, palette: readonly Color[], random: () => number, foliage = false,
) {
  const scallops = foliage ? 14 : 5
  const surface = (u: number, v: number): Point => {
    const [x, y] = cubic(petal.rim, u)
    const curl = Math.sin(Math.PI * v)
    const fan = Math.sin(v * Math.PI * 0.5)
    const edge = Math.sin(Math.PI * u) * (Math.sin(u * Math.PI * scallops * 2) * (foliage ? 1.3 : 0.65) + Math.sin(u * 41) * 0.34)
    return [
      mix(petal.base[0], x, fan) + petal.bend[0] * curl,
      mix(petal.base[1], y, v) + petal.bend[1] * curl + edge * v ** 4,
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
      mix(0.22, 0.85, random()), pigment(palette, shade, mix(0.18, 0.59, random())),
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
        mix(0.38, 1.2, random()), pigment(palette, tone(u) + 0.22, mix(0.36, 0.85, random())),
      ))
    }
  }
}

export type RoseKind = "open" | "cup" | "bud"

function makeRose(kind: RoseKind, seed: number) {
  let state = seed
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
  const stems: Brushstroke[] = []
  const foliage: Brushstroke[] = []
  const petals: Brushstroke[] = []
  const tip: Point = kind === "open" ? [78, 73] : [76, 88]
  const stem: Rim = [roseRoot, [111, 151], [83, 132], tip]
  const green = palettes.leaf

  for (let index = 0; index < 28; index++) {
    const start = index / 28
    const end = (index + 1) / 28
    const points = [cubic(stem, start), cubic(stem, (start + end) / 2), cubic(stem, end)]
    stems.push(stroke(points, mix(3.3, 2.1, start), pigment(green, 0.18 + random() * 0.12)))
    stems.push(stroke(points.map(([x, y]) => [x - 0.55, y]), 0.73, pigment(green, 0.62 + random() * 0.20)))
  }
  for (const leaf of leaves.slice(0, kind === "bud" ? 3 : 4)) paintSurface(foliage, leaf, green, random, true)
  for (const sepal of calyx) paintSurface(foliage, sepal, green, random, true)
  const flower = { open, cup, bud }[kind]
  const palette = kind === "cup" ? palettes.blush : palettes.carmine
  for (const petal of flower) paintSurface(petals, petal, palette, random)

  return [
    { strokes: stems, start: 0, end: 0.2 },
    { strokes: foliage, start: 0.2, end: 0.45 },
    { strokes: petals, start: 0.45, end: 1 },
  ]
}

export function createRosePainter(canvas: HTMLCanvasElement, kind: RoseKind, seed: number) {
  const context = canvas.getContext("2d")
  let layers: ReturnType<typeof makeRose> | undefined
  const painted = [0, 0, 0]
  let lastProgress = 0
  let bitmapWidth = 0

  const clear = () => {
    context?.clearRect(0, 0, roseWidth, roseHeight)
    painted.fill(0)
    lastProgress = 0
  }

  return {
    fit(width: number) {
      const pixels = Math.round(width * Math.min(window.devicePixelRatio || 1, 2))
      if (!context || bitmapWidth === pixels) return
      bitmapWidth = pixels
      canvas.width = pixels
      canvas.height = Math.round(pixels * roseHeight / roseWidth)
      const bitmapScale = pixels / roseWidth
      context.setTransform(bitmapScale, 0, 0, bitmapScale, 0, 0)
      context.lineCap = "round"
      context.lineJoin = "round"
      clear()
    },
    paint(progress: number) {
      if (!context || progress === lastProgress) return
      if (progress < lastProgress) clear()
      if (progress === 0) return
      layers ??= makeRose(kind, seed)

      for (const [index, { strokes, start, end }] of layers.entries()) {
        const count = Math.floor(clamp((progress - start) / (end - start)) * strokes.length)
        for (let i = painted[index]; i < count; i++) strokes[i](context)
        painted[index] = count
      }
      lastProgress = progress
    },
  }
}
