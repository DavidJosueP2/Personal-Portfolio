import {
  clamp, cubic, mix, paintRandom, paintSurface, pigment, stroke,
  type Brushstroke, type Color, type Petal, type Point, type Rim,
} from "@/lib/botanical-paint"

type Flower = "daisy" | "poppy" | "lavender"
export { bouquet as composeGardenBouquet, meadow as composeGardenMeadow }
type Random = () => number

const oil = {
  grass: [[15, 27, 18], [35, 54, 27], [72, 94, 40], [116, 134, 53], [193, 182, 96]],
  sage: [[20, 32, 29], [45, 67, 51], [73, 105, 65], [107, 133, 84], [179, 184, 130]],
  straw: [[33, 42, 24], [66, 76, 38], [112, 126, 57], [159, 159, 75], [221, 195, 123]],
  ivory: [[84, 79, 68], [148, 145, 123], [203, 194, 158], [236, 224, 188], [255, 246, 215]],
  gold: [[70, 40, 22], [132, 76, 28], [193, 119, 35], [225, 163, 57], [255, 215, 106]],
  scarlet: [[43, 14, 25], [112, 20, 37], [188, 40, 39], [231, 86, 53], [255, 170, 114]],
  lilac: [[39, 28, 62], [70, 48, 99], [117, 81, 152], [160, 115, 182], [216, 174, 214]],
} satisfies Record<string, readonly Color[]>

const poppyPetals: Petal[] = [
  { base: [0, 7], rim: [[-35, -5], [-64, -35], [-39, -49], [-4, -24]], bend: [-8, -5], tone: 0.64, fold: 0.34 },
  { base: [2, 7], rim: [[-22, -24], [-10, -48], [21, -46], [32, -19]], bend: [3, -9], tone: 0.55, fold: 0.59 },
  { base: [1, 8], rim: [[5, -10], [32, -38], [57, -38], [45, 4]], bend: [9, -1], tone: 0.78, fold: 0.54 },
  { base: [0, 13], rim: [[-46, -7], [-36, -21], [-16, 15], [17, 2]], bend: [-9, 9], tone: 0.68, fold: 0.25 },
  { base: [1, 15], rim: [[-18, 10], [2, 16], [32, 1], [45, -6]], bend: [4, 7], tone: 0.55, fold: 0.76 },
]

// A tapered brush follows the bend of the plant and leaves an uneven deposit of color.
function tapered(rim: Rim, width: number, palette: readonly Color[], tone: number, alpha = 1): Brushstroke {
  const [base, heel, shoulder, tip] = rim
  const length = Math.max(0.01, Math.hypot(tip[0] - base[0], tip[1] - base[1]))
  const nx = (base[1] - tip[1]) / length * width
  const ny = (tip[0] - base[0]) / length * width
  const path = new Path2D()
  path.moveTo(base[0] - nx * 0.19, base[1] - ny * 0.19)
  path.bezierCurveTo(heel[0] - nx, heel[1] - ny, shoulder[0] - nx * 0.52, shoulder[1] - ny * 0.52, ...tip)
  path.bezierCurveTo(shoulder[0] + nx * 0.41, shoulder[1] + ny * 0.41, heel[0] + nx * 0.68, heel[1] + ny * 0.68, ...base)
  path.closePath()
  const dark = pigment(palette, tone - 0.31, alpha)
  const light = pigment(palette, tone + 0.12, alpha)
  const edge = pigment(palette, tone, alpha)
  return (context) => {
    const paint = context.createLinearGradient(...base, ...tip)
    paint.addColorStop(0, dark)
    paint.addColorStop(0.70, light)
    paint.addColorStop(1, edge)
    context.fillStyle = paint
    context.fill(path)
  }
}

function fleck(strokes: Brushstroke[], x: number, y: number, size: number, color: string, lean = 0.6) {
  strokes.push(stroke([[x, y], [x + size * lean, y - size * 0.37]], size, color))
}

function leaf(strokes: Brushstroke[], from: Point, length: number, side: number, shade: number) {
  const [x, y] = from
  const bend: Rim = [from, [x + side * length * 0.49, y - length * 0.11], [x + side * length * 0.88, y - length * 0.55], [x + side * length, y - length * 0.72]]
  strokes.push(tapered(bend, length * 0.24, oil.sage, shade))
  const vein = Array.from({ length: 6 }, (_, i) => cubic(bend, i * 0.17))
  strokes.push(stroke(vein, Math.max(0.34, length * 0.029), pigment(oil.sage, shade + 0.18, 0.65)))
  for (let i = 1; i < 4; i++) {
    const [vx, vy] = vein[i]
    strokes.push(stroke([[vx, vy], [vx + side * length * 0.13, vy - length * (i % 2 === 0 ? -0.064 : 0.11)]],
      0.42, pigment(oil.sage, shade + 0.23, 0.61)))
  }
}

function daisy(strokes: Brushstroke[], [x, y]: Point, scale: number, random: Random) {
  const count = 15
  const rotation = random() * Math.PI
  for (let i = 0; i < count; i++) {
    const theta = rotation + i / count * Math.PI * 2
    const r = mix(22, 33, random()) * scale
    const dx = Math.cos(theta) * r
    const dy = Math.sin(theta) * r * 0.73
    const rim: Rim = [[x + dx * 0.2, y + dy * 0.2], [x + dx * 0.54 + 3 * scale, y + dy * 0.48],
      [x + dx * 0.92 + 3 * scale, y + dy], [x + dx, y + dy]]
    const shade = 0.66 + random() * 0.18 - Math.sin(theta) * 0.08
    strokes.push(tapered(rim, mix(3.8, 6.2, random()) * scale, oil.ivory, shade))
    strokes.push(stroke([cubic(rim, 0.43), cubic(rim, 0.66), cubic(rim, 0.87)],
      0.75 * scale, pigment(oil.ivory, shade + 0.29, 0.76)))
  }
  strokes.push(stroke([[x - 1.5 * scale, y + scale], [x + 1.2 * scale, y]], 13 * scale, pigment(oil.gold, 0.27)))
  for (let i = 0; i < 37; i++) {
    const theta = i * 2.39996
    const r = Math.sqrt(random()) * 6.5 * scale
    fleck(strokes, x + Math.cos(theta) * r, y + Math.sin(theta) * r * 0.81,
      mix(0.8, 2.5, random()) * scale, pigment(oil.gold, mix(0.21, 0.99, random())))
  }
}

function poppy(strokes: Brushstroke[], [x, y]: Point, scale: number, random: Random) {
  const at = ([px, py]: Point): Point => [x + px * scale, y + py * scale]
  poppyPetals.forEach(({ base, rim: [a, b, c, d], bend, tone, fold }, index) => {
    if (index === 3) {
      strokes.push(stroke([at([-6, -4]), at([3, -6]), at([10, -3])], 13 * scale, pigment(oil.scarlet, 0)))
      for (let i = 0; i < 26; i++) {
        const px = mix(-12, 14, random())
        const py = mix(-10, -0.5, random())
        fleck(strokes, x + px * scale, y + py * scale, mix(0.75, 2.6, random()) * scale,
          pigment(i % 3 === 0 ? oil.gold : oil.scarlet, mix(0.18, 0.65, random())))
      }
    }
    paintSurface(strokes, {
      base: at(base), rim: [at(a), at(b), at(c), at(d)],
      bend: [bend[0] * scale, bend[1] * scale], tone, fold,
    }, oil.scarlet, random, false, scale)
  })
}

function lavender(strokes: Brushstroke[], [x, y]: Point, scale: number, drift: number, random: Random) {
  for (let step = 0; step < 10; step++) {
    const t = step / 9
    const height = t * 51 * scale
    const bx = x + drift * height * 0.24
    const spread = Math.sin(Math.PI * t * 0.89) * 10 * scale
    for (let i = 0; i < 7; i++) {
      const side = mix(-1, 1, random())
      const pigmentTone = 0.25 + t * 0.29 + random() * 0.40
      fleck(strokes, bx + side * spread, y - height + random() * 5 * scale,
        mix(1.9, 4.6, random()) * scale * mix(1, 0.66, t), pigment(oil.lilac, pigmentTone), side)
    }
  }
}

function plant(
  strokes: Brushstroke[], root: Point, height: number, scale: number,
  drift: number, kind: Flower, random: Random,
) {
  const [x, y] = root
  const stalk: Rim = [
    root, [x - drift * height * 0.22, y - height * 0.25],
    [x + drift * height * 0.29, y - height * 0.78], [x + drift * height * 0.23, y - height],
  ]
  for (let i = 0; i < 15; i++) {
    const segment = [cubic(stalk, i / 15), cubic(stalk, (i + 0.5) / 15), cubic(stalk, (i + 1) / 15)]
    strokes.push(stroke(segment, (2.7 - i * 0.076) * scale, pigment(oil.grass, 0.33 + random() * 0.12)))
    strokes.push(stroke(segment.map(([px, py]) => [px - 0.55 * scale, py]), 0.69 * scale, pigment(oil.sage, 0.73, 0.88)))
  }
  for (let i = 0; i < 5; i++) {
    leaf(strokes, cubic(stalk, 0.22 + i * 0.115), mix(15, 36, random()) * scale,
      i % 2 === 0 ? -1 : 1, mix(0.46, 0.66, random()))
  }
  if (kind === "daisy") daisy(strokes, stalk[3], scale, random)
  else if (kind === "poppy") poppy(strokes, stalk[3], scale, random)
  else lavender(strokes, stalk[3], scale, drift, random)
}

function bouquet(width: number, height: number, seed: number, name: Flower) {
  const random = paintRandom(seed)
  const strokes: Brushstroke[] = []
  const scale = Math.min(width / 188, height / 216)
  const lower = height * 0.94
  const specimens: [Flower, number, number, number, number][] = name === "lavender"
    ? [["lavender", 0.45, 0.63, 0.82, -0.6], ["lavender", 0.52, 0.67, 0.86, 0.16],
       ["lavender", 0.56, 0.51, 0.65, 0.62], ["lavender", 0.55, 0.44, 0.52, -0.4], ["daisy", 0.55, 0.31, 0.52, 0.63]]
    : name === "poppy"
      ? [["lavender", 0.57, 0.49, 0.72, 0.48], ["poppy", 0.49, 0.74, 0.98, -0.48], ["poppy", 0.51, 0.53, 0.72, 0.53],
         ["daisy", 0.46, 0.37, 0.49, -0.7]]
      : [["lavender", 0.50, 0.58, 0.73, 0.55], ["daisy", 0.46, 0.75, 0.98, -0.35],
         ["daisy", 0.49, 0.57, 0.74, 0.72], ["daisy", 0.44, 0.42, 0.68, -0.76], ["poppy", 0.55, 0.34, 0.46, 0.70]]
  for (const [kind, x, stem, size, drift] of specimens) {
    plant(strokes, [x * width, lower - 5 * scale * random()], height * stem, scale * size, drift, kind, random)
  }
  return strokes
}

function paintEdgeFlowers(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, width: number, height: number, seed: number, kind: Flower) {
  const random = paintRandom(seed)
  const climbing = canvas.hasAttribute("data-service-climb")
  const scale = Math.min(width, height) / 185
  const companion = kind === "daisy" ? "poppy" : "daisy"
  const branches = [
    { flower: "lavender", length: 0.8, size: 0.7, angle: -17 },
    { flower: kind, length: 0.87, size: 0.9, angle: 2 },
    { flower: kind, length: 0.62, size: 0.7, angle: 24 },
    { flower: companion, length: 0.49, size: 0.53, angle: climbing ? -24 : -6 },
  ] as const

  context.save()
  if (canvas.dataset.serviceEdge === "right") {
    context.translate(width, 0)
    context.scale(-1, 1)
  }
  // Begin beyond the canvas edge so each stem continues into the margin.
  context.translate(-width * 0.055, height * (climbing ? 0.84 : 0.09))
  for (const branch of branches) {
    const marks: Brushstroke[] = []
    plant(marks, [0, 0], width * branch.length, scale * branch.size, random() * 0.6 - 0.3, branch.flower, random)
    context.save()
    context.rotate((climbing ? 62 - branch.angle : 115 + branch.angle) * Math.PI / 180)
    for (const mark of marks) mark(context)
    context.restore()
  }
  context.restore()
}

function meadow(width: number, height: number) {
  const random = paintRandom(107)
  const strokes: Brushstroke[] = []
  const at = (x: number) => Math.sin(x / width * 13.7 + 0.4) * 0.048 + Math.cos(x / width * 25) * 0.021
  const unit = Math.min(1, height / 305)
  const ground = new Path2D()
  ground.moveTo(0, height)
  for (let x = 0; x <= width + 9; x += 8) {
    ground.lineTo(x, height * (0.70 + at(x)) + random() * 12 * unit)
  }
  ground.lineTo(width + 9, height)
  ground.closePath()
  strokes.push((context) => {
    const field = context.createLinearGradient(0, height * 0.60, 0, height)
    field.addColorStop(0, "#304323")
    field.addColorStop(0.32, "#354823")
    field.addColorStop(0.68, "#273c24")
    field.addColorStop(1, "#132619")
    context.fillStyle = field
    context.fill(ground)
  })

  // Broad slashes of underpaint give the meadow a lit ridge and a cooler foreground.
  for (let i = 0; i < width * 0.85; i++) {
    const x = random() * width
    const y = height * mix(0.72 + at(x), 1.02, random())
    const length = (11 + random() * 46) * unit
    const color = pigment(i % 4 === 0 ? oil.straw : oil.sage, mix(0.18, 0.74, random()), mix(0.17, 0.66, random()))
    strokes.push(stroke([[x, y], [x + length * 0.49, y - length * 0.11], [x + length, y - length * 0.22]],
      mix(0.8, 7, random()) * unit, color))
  }

  for (let layer = 0; layer < 4; layer++) {
    const density = [0.44, 0.74, 0.69, 0.45][layer]
    const count = Math.ceil(width * density)
    for (let i = 0; i < count; i++) {
      const x = random() * (width + 36) - 18
      const clump = (Math.sin(x * 0.079) + Math.sin(x * 0.024 + 2)) * 0.5
      const root = height * (mix(0.73, 1.04, (layer + random()) / 4) + at(x) * (1 - layer / 4))
      const length = height * (mix(0.09, 0.40, random() ** 1.7) + clump * 0.047 + (3 - layer) * 0.019)
      const drift = length * mix(-0.54, 0.72, random())
      const point: Rim = [[x, root], [x + drift * 0.20 - 7 * unit, root - length * 0.52],
        [x + drift * 0.68, root - length * 0.92], [x + drift, root - length]]
      const palette = i % 7 === 0 ? oil.straw : i % 3 === 0 ? oil.sage : oil.grass
      const shade = clamp(mix(0.37, 0.88, random()) + clump * 0.13 - layer * 0.045)
      const breadth = mix(0.9, 7.1, random() ** 1.65) * unit
      strokes.push(tapered(point, breadth, palette, shade, layer === 0 ? 0.79 : 0.97))
      if (i % 6 === 0) {
        strokes.push(stroke([cubic(point, 0.21), cubic(point, 0.49), cubic(point, 0.78)],
          mix(0.4, 1.02, random()) * unit, pigment(palette, shade + 0.22, 0.74)))
      }
      if (breadth > 3.8 * unit && layer > 0) {
        const start = 0.32 + i % 5 * 0.06
        const brushRidge = [start, start + 0.11, start + 0.19].map((t): Point => {
          const [px, py] = cubic(point, t)
          return [px - breadth * (1 - t) * 0.58, py]
        })
        strokes.push(stroke(brushRidge, breadth * 0.21, pigment(palette, shade + 0.23, 0.52)))
      }
    }
  }

  const patches: [number, Flower, number][] = [
    [0.04, "daisy", 0.68], [0.10, "lavender", 0.60], [0.17, "poppy", 0.74],
    [0.26, "daisy", 0.60], [0.33, "lavender", 0.60], [0.44, "daisy", 0.65],
    [0.52, "poppy", 0.64], [0.62, "lavender", 0.60], [0.71, "poppy", 0.78],
    [0.78, "daisy", 0.56], [0.87, "lavender", 0.77], [0.94, "poppy", 0.57],
  ]
  for (const [position, kind, size] of patches) {
    const fit = unit * (width < 650 ? 0.7 : 1)
    const rootY = height * mix(0.83, 0.97, random())
    plant(strokes, [position * width, rootY], height * mix(0.30, 0.58, random()), size * fit, mix(-0.58, 0.55, random()), kind, random)
  }
  return strokes
}

export function connectServiceGarden(section: HTMLElement) {
  const paintings = new Map(Array.from(section.querySelectorAll<HTMLCanvasElement>("[data-service-paint]"), (canvas, index) => {
    const context = canvas.getContext("2d")
    const name = canvas.dataset.servicePaint as Flower | "meadow"
    // The edge flowers are ready from the first layout. Prepare the larger meadow nearby.
    let ready = name !== "meadow"
    let lastSize = ""

    const render = () => {
      if (!context || !ready) return
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (width < 1 || height < 1) return

      const ratio = Math.min(1.75, window.devicePixelRatio || 1)
      const size = `${width}:${height}:${ratio}`
      if (size === lastSize) return
      lastSize = size
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.lineCap = "round"
      context.lineJoin = "round"
      if (name === "meadow") {
        for (const mark of meadow(width, height)) mark(context)
      } else {
        paintEdgeFlowers(context, canvas, width, height, 61 + index * 13, name)
      }
    }
    return [canvas, { name, render, prepare: () => { ready = true; render() } }] as const
  }))
  const visibility = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue
      paintings.get(target as HTMLCanvasElement)?.prepare()
      visibility.unobserve(target)
    }
  }, { rootMargin: "75% 0px" })
  const size = new ResizeObserver((entries) => {
    for (const { target } of entries) paintings.get(target as HTMLCanvasElement)?.render()
  })
  for (const [canvas, painting] of paintings) {
    size.observe(canvas)
    if (painting.name === "meadow") visibility.observe(canvas)
  }

  return () => {
    visibility.disconnect()
    size.disconnect()
  }
}
