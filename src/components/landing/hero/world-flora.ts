import { cubic, paintRandom, paintSurface, pigment, stroke } from "@/lib/botanical-paint"
import type { Brushstroke, Color, Point, Rim } from "@/lib/botanical-paint"

export const worldSpecies = ["tulip", "ivory-tulip", "iris", "lily", "bluebell", "cosmos", "echinacea", "allium", "dahlia", "fern"] as const
export type WorldSpecies = typeof worldSpecies[number]

const foliage: Color[] = [[13, 35, 31], [38, 74, 53], [87, 123, 68], [155, 171, 98]]
const red: Color[] = [[65, 13, 35], [145, 30, 53], [225, 77, 86], [255, 179, 152]]
const ivory: Color[] = [[73, 74, 55], [158, 159, 114], [232, 223, 176], [255, 249, 220]]
const violet: Color[] = [[28, 25, 65], [76, 48, 130], [146, 114, 206], [224, 207, 244]]
const blue: Color[] = [[17, 39, 70], [46, 82, 145], [116, 154, 209], [205, 222, 242]]
const pink: Color[] = [[72, 20, 62], [152, 55, 116], [230, 132, 174], [255, 212, 217]]
const gold: Color[] = [[58, 30, 18], [135, 75, 24], [221, 157, 49], [255, 226, 133]]
const coral: Color[] = [[76, 23, 37], [171, 61, 62], [240, 129, 105], [255, 219, 175]]

// Every species is composed from curved pigment surfaces and broken bristle marks.
// The roots share one registration point, so the paintings remain planted in 3D.
export function paintWorldPlant(canvas: HTMLCanvasElement, species: WorldSpecies, seed: number) {
  canvas.width = 384
  canvas.height = 576
  const context = canvas.getContext("2d")!
  context.scale(canvas.width / 160, canvas.height / 240)
  context.lineCap = "round"
  context.lineJoin = "round"
  const marks: Brushstroke[] = []
  const random = paintRandom(seed)
  const root: Point = [80, 230]

  const stem = (from: Point, to: Point, width = 1.5, lean = 0) => {
    const path: Rim = [from, [from[0] + lean, from[1] - (from[1] - to[1]) * 0.35], [to[0] - lean, to[1] + 25], to]
    const points = Array.from({ length: 22 }, (_, i) => cubic(path, i / 21))
    marks.push(stroke(points, width + 0.8, pigment(foliage, 0.19)))
    marks.push(stroke(points.map(([x, y]) => [x - 0.35, y]), width * 0.58, pigment(foliage, 0.66, 0.85)))
    return path
  }
  const leaf = (base: Point, tip: Point, width: number, tone = 0.6, curl = 0) => {
    const dx = tip[0] - base[0]
    const dy = tip[1] - base[1]
    const length = Math.hypot(dx, dy)
    const nx = -dy / length
    const ny = dx / length
    paintSurface(marks, {
      base,
      rim: [
        [tip[0] - dx * 0.25 - nx * width * 0.44, tip[1] - dy * 0.25 - ny * width * 0.44],
        [tip[0] - nx * width * 0.5, tip[1] - ny * width * 0.5],
        [tip[0] + nx * width * 0.5, tip[1] + ny * width * 0.5],
        [tip[0] - dx * 0.25 + nx * width * 0.44, tip[1] - dy * 0.25 + ny * width * 0.44],
      ],
      bend: [curl, 0], tone, fold: 0.42,
    }, foliage, random, true, 0.7)
    // The pointed midrib continues past the shoulders of the leaf.
    marks.push(stroke([base, [base[0] + dx * 0.68 + curl, base[1] + dy * 0.68], tip], 0.6, pigment(foliage, tone + 0.1, 0.75)))
  }
  const petal = (base: Point, angle: number, length: number, width: number, palette: Color[], tone: number, curl = 0) => {
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    const nx = -dy
    const ny = dx
    const point = (distance: number, across: number): Point => [base[0] + dx * distance + nx * across, base[1] + dy * distance + ny * across]
    paintSurface(marks, {
      base,
      rim: [point(length * 0.7, -width * 0.5), point(length * 1.13, -width * 0.56), point(length * 1.13, width * 0.56), point(length * 0.7, width * 0.5)],
      bend: [nx * curl, ny * curl], tone, fold: 0.43 + random() * 0.15,
    }, palette, random, false, 0.7)
  }
  const center = (x: number, y: number, rx: number, ry: number, palette = gold, count = 65) => {
    // Small impasto dabs catch the light individually, rather than a flat disc.
    for (let i = 0; i < count; i++) {
      const a = i * 2.399963
      const radius = Math.sqrt((i + 0.5) / count)
      const px = x + Math.cos(a) * radius * rx
      const py = y + Math.sin(a) * radius * ry
      marks.push(stroke([[px, py + 0.8], [px - 0.25, py - 0.5]], 0.7 + random() * 1.1, pigment(palette, 0.2 + random() * 0.64)))
    }
  }
  const branchLeaves = (path: Rim, narrow = false) => {
    for (const [i, t] of [0.2, 0.39, 0.57].entries()) {
      const base = cubic(path, t)
      const side = i % 2 ? 1 : -1
      leaf(base, [base[0] + side * (narrow ? 18 : 28), base[1] - 20 - random() * 12], narrow ? 4 : 10, 0.43 + i * 0.09, side * 3)
    }
  }

  if (species === "tulip" || species === "ivory-tulip") {
    const palette = species === "tulip" ? red : ivory
    const heads = [[57, 62, 0.85], [99, 34, 1], [111, 99, 0.67]]
    for (const [x, y, scale] of heads) stem(root, [x, y + 25 * scale], 1.5, (x - 80) * 0.15)
    leaf([78, 220], [36, 102], 17, 0.64, -16)
    leaf([81, 226], [119, 111], 15, 0.56, 11)
    leaf([80, 228], [67, 143], 13, 0.71, -12)
    for (const [x, y, scale] of heads) {
      const cup = (offset: number, width: number, high: number, tone: number) => paintSurface(marks, {
        base: [x, y + 31 * scale],
        rim: [[x + (offset - width) * scale, y + 8 * scale], [x + (offset - width * 0.9) * scale, y - high * scale], [x + (offset + width * 0.9) * scale, y - high * scale], [x + (offset + width) * scale, y + 7 * scale]],
        bend: [offset * scale * 0.4, 5 * scale], tone, fold: 0.45,
      }, palette, random, false, scale)
      cup(0, 15, 14, 0.55)
      cup(-12, 12, 5, 0.68)
      cup(13, 12, 3, 0.46)
      cup(-3, 15, -3, 0.74)
    }
  } else if (species === "iris") {
    for (const [x, y, size] of [[83, 49, 1], [46, 100, 0.72]]) {
      stem(root, [x, y + 8], 1.5)
      for (let i = 0; i < 3; i++) petal([x, y], -Math.PI / 2 + (i - 1) * 0.61, (31 + i * 2) * size, 26 * size, violet, 0.58 + i * 0.05, 4)
      for (let i = 0; i < 3; i++) {
        const a = 0.4 + i * 1.12
        petal([x, y + 3], a, 32 * size, 23 * size, violet, 0.49 + i * 0.12, -5)
        petal([x, y + 3], a, 17 * size, 3 * size, gold, 0.78)
      }
      center(x, y, 3 * size, 3 * size, gold, 12)
    }
    for (let i = 0; i < 5; i++) leaf(root, [38 + i * 19, 92 + Math.abs(i - 2) * 15], 6 + i % 2 * 2, 0.48 + i * 0.035, (i - 2) * 4)
  } else if (species === "lily") {
    const path = stem(root, [77, 58], 2, 9)
    branchLeaves(path)
    stem([79, 125], [117, 103], 1, 8)
    for (const [x, y, size] of [[77, 55, 1], [117, 98, 0.6]]) {
      for (let i = 0; i < 6; i++) petal([x, y], i * Math.PI / 3 - 0.4, (i % 2 ? 32 : 37) * size, 16 * size, ivory, 0.62 + i % 3 * 0.08, (i % 2 ? -5 : 5) * size)
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3
        const end: Point = [x + Math.cos(a) * 14 * size, y + Math.sin(a) * 12 * size]
        marks.push(stroke([[x, y], end], 0.6, pigment(ivory, 0.8)))
        center(end[0], end[1], 1.8 * size, 0.9 * size, gold, 5)
      }
      center(x, y, 3 * size, 2 * size, gold, 13)
    }
  } else if (species === "bluebell") {
    for (const [x, top, side] of [[72, 39, -1], [91, 70, 1], [103, 113, 1]]) {
      const path = stem(root, [x, top], 1.2, side * 7)
      branchLeaves(path, true)
      for (let i = 0; i < 6; i++) {
        const y = top + 9 + i * 15
        const bx = x + side * (13 + Math.sin(i) * 3)
        stem([x, y + 8], [bx, y + 7], 0.5, side * 6)
        paintSurface(marks, {
          base: [bx, y + 4],
          rim: [[bx - 8, y + 21], [bx - 9, y + 28], [bx + 10, y + 28], [bx + 8, y + 20]],
          bend: [side * 3, 0], tone: 0.65, fold: 0.5,
        }, blue, random, false, 0.45)
        for (let lip = 0; lip < 3; lip++) petal([bx - 5 + lip * 5, y + 22], Math.PI / 2 + (lip - 1) * 0.3, 4, 4, blue, 0.85)
      }
    }
    leaf(root, [47, 136], 10, 0.56, -8)
    leaf(root, [113, 159], 9, 0.6, 7)
  } else if (species === "cosmos" || species === "echinacea") {
    for (const [x, y, size] of [[77, 53, 1], [113, 113, 0.69], [41, 132, 0.58]]) {
      const path = stem(root, [x, y], 1.2, 9)
      branchLeaves(path, species === "cosmos")
      if (species === "cosmos") {
        for (let i = 0; i < 8; i++) petal([x, y], i * Math.PI / 4 + 0.12, 27 * size, 22 * size, pink, 0.58 + i % 3 * 0.08, 3)
        center(x, y, 6 * size, 5 * size)
      } else {
        for (let i = 0; i < 15; i++) {
          const a = i * Math.PI * 2 / 15
          petal([x + Math.cos(a) * 5 * size, y + Math.sin(a) * 3 * size], a, 24 * size, 7 * size, pink, 0.47 + i % 4 * 0.08, Math.sin(a) > 0 ? 6 : -3)
        }
        center(x, y - 4 * size, 9 * size, 11 * size, gold, 125)
      }
    }
  } else if (species === "allium") {
    for (const [x, y, size] of [[80, 48, 1], [115, 119, 0.6]]) {
      stem(root, [x, y + 6], 1.6, -5)
      for (let i = 0; i < 93; i++) {
        const radius = Math.sqrt((i + 0.4) / 93) * 25 * size
        const angle = i * 2.399963
        const fx = x + Math.cos(angle) * radius
        const fy = y + Math.sin(angle) * radius * 0.92
        marks.push(stroke([[x, y + 7], [fx, fy]], 0.27 * size, pigment(violet, 0.52, 0.48)))
        for (let p = 0; p < 5; p++) {
          const a = p * Math.PI * 2 / 5
          marks.push(stroke([[fx, fy], [fx + Math.cos(a) * 2.7 * size, fy + Math.sin(a) * 2.7 * size]], size * 1.3, pigment(violet, 0.55 + random() * 0.4)))
        }
        marks.push(stroke([[fx, fy], [fx + 0.4, fy - 0.3]], 0.65 * size, pigment(ivory, 0.9)))
      }
    }
    leaf(root, [36, 141], 13, 0.59, -13)
    leaf(root, [116, 169], 12, 0.5, 11)
  } else if (species === "dahlia") {
    const path = stem(root, [79, 69], 2.2, -9)
    branchLeaves(path)
    for (let ring = 0; ring < 5; ring++) {
      const count = 18 - ring * 2
      const radius = 25 - ring * 4.2
      for (let i = 0; i < count; i++) {
        const a = i * Math.PI * 2 / count + ring * 0.39
        const base: Point = [79 + Math.cos(a) * radius * 0.43, 69 + Math.sin(a) * radius * 0.38]
        petal(base, a, radius, 9 - ring * 1.1, coral, 0.5 + ring * 0.085 + i % 2 * 0.05, 2)
      }
    }
    center(79, 69, 3, 3, gold, 18)
    leaf([78, 180], [36, 147], 21, 0.6, -4)
    leaf([79, 160], [124, 124], 18, 0.55, 3)
  } else {
    // Seven arching fronds, with alternating pinnules, each painted separately.
    for (let frond = 0; frond < 7; frond++) {
      const end: Point = [19 + frond * 20, 46 + Math.abs(frond - 3) * 29]
      const path = stem(root, end, 0.9, (frond - 3) * 7)
      for (let i = 1; i <= 13; i++) {
        const t = i / 15
        const base = cubic(path, t)
        const next = cubic(path, Math.min(1, t + 0.02))
        const angle = Math.atan2(next[1] - base[1], next[0] - base[0])
        const length = Math.sin(t * Math.PI) * (14 + Math.sin(frond) * 3) + 2
        for (const side of [-1, 1]) {
          const a = angle + side * 0.95
          leaf(base, [base[0] + Math.cos(a) * length, base[1] + Math.sin(a) * length], Math.max(1.4, length * 0.22), 0.42 + t * 0.3, side)
        }
      }
    }
  }
  for (const mark of marks) mark(context)
}
