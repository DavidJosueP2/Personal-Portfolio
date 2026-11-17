import { clamp, cubic, mix, paintRandom, paintSurface, pigment, stroke, type Brushstroke, type Color, type Petal, type Point, type Rim } from "@/lib/botanical-paint"

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

export type RoseKind = "open" | "cup" | "bud"

function makeRose(kind: RoseKind, seed: number) {
  const random = paintRandom(seed)
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
