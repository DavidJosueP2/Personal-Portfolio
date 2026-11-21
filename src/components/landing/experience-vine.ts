import { clamp, mix, paintRandom, pigment, stroke, type Brushstroke, type Color, type Point } from "@/lib/botanical-paint"

const ivy: readonly Color[] = [[21, 36, 30], [43, 67, 44], [80, 108, 61], [126, 147, 83], [189, 186, 105]]
const olive: readonly Color[] = [[34, 38, 25], [65, 75, 37], [106, 117, 58], [153, 150, 75], [220, 192, 111]]
const stem: readonly Color[] = [[39, 43, 26], [59, 70, 38], [95, 110, 55], [144, 149, 78], [196, 178, 109]]

type Dab = { y: number; paint: Brushstroke }

function ivyLeaf(root: Point, tip: Point, width: number, tone: number, turned: boolean, random: () => number) {
  const palette = turned ? olive : ivy
  const dx = tip[0] - root[0]
  const dy = tip[1] - root[1]
  const distance = Math.hypot(dx, dy)
  const nx = -dy / distance * width
  const ny = dx / distance * width
  const at = (side: number, t: number): Point => [
    root[0] + dx * t + nx * side,
    root[1] + dy * t + ny * side,
  ]
  const leaf = new Path2D()
  leaf.moveTo(...root)
  leaf.bezierCurveTo(...at(-0.76, 0.01), ...at(-0.91, 0.29), ...at(-0.88, 0.53))
  leaf.bezierCurveTo(...at(-0.50, 0.42), ...at(-0.65, 0.67), ...at(-0.48, 0.76))
  leaf.quadraticCurveTo(...at(-0.22, 0.81), ...tip)
  leaf.quadraticCurveTo(...at(0.27, 0.85), ...at(0.5, 0.72))
  leaf.bezierCurveTo(...at(0.46, 0.57), ...at(0.67, 0.53), ...at(0.83, 0.57))
  leaf.bezierCurveTo(...at(0.88, 0.38), ...at(0.63, 0.06), ...root)
  leaf.closePath()

  const ground: Brushstroke = (context) => {
    const glaze = context.createLinearGradient(...at(-0.8, 0.55), ...at(0.83, 0.56))
    glaze.addColorStop(0, pigment(palette, tone + 0.13))
    glaze.addColorStop(0.31, pigment(palette, tone))
    glaze.addColorStop(0.53, pigment(palette, tone - 0.19))
    glaze.addColorStop(1, pigment(palette, tone - 0.30))
    context.fillStyle = glaze
    context.fill(leaf)
  }

  const bristles: Brushstroke[] = []
  for (let i = 0; i < 30; i++) {
    const side = mix(-0.79, 0.79, random())
    const start = mix(0.11, 0.82, random())
    const color = pigment(palette, tone + (i % 3 === 0 ? -0.24 : 0.23), mix(0.2, 0.65, random()))
    bristles.push(stroke([at(side, start), at(side * 0.54, start + 0.11), at(side * 0.42, start + 0.17)],
      Math.max(0.25, width * mix(0.028, 0.09, random())), color))
  }
  bristles.push(stroke([root, at(-0.05, 0.44), at(0.025, 0.83)], Math.max(0.45, width * 0.085), pigment(palette, tone + 0.27, 0.79)))
  for (const side of [-1, 1]) {
    for (const ridge of [0.23, 0.44]) {
      bristles.push(stroke([at(0, ridge), at(side * 0.41, ridge + 0.14), at(side * 0.56, ridge + 0.28)],
        Math.max(0.32, width * 0.045), pigment(palette, tone + 0.25, 0.61)))
    }
  }
  const detail: Brushstroke = (context) => {
    context.save()
    context.clip(leaf)
    for (const mark of bristles) mark(context)
    context.restore()
  }
  return { ground, detail }
}

function composeVine(width: number, height: number, seed: number) {
  const random = paintRandom(seed)
  const dabs: Dab[] = []
  const unit = clamp(width / 90, 0.62, 1.5)
  const stemEnd = height + 2
  const phase = random() * Math.PI
  const point = (y: number): Point => {
    const t = clamp(y / height)
    const arch = Math.sin(t * Math.PI)
    return [width * (0.02 + arch * (0.51 + 0.22 * Math.sin(t * 7 + phase))), y]
  }

  for (let y = 0; y < stemEnd; y += 4.5) {
    const end = Math.min(stemEnd, y + 4.6)
    const path = [point(y), point((y + end) / 2), point(end)]
    const weight = (4.2 + Math.sin(y * 0.05) * 0.42) * unit * mix(1, 0.68, y / height)
    dabs.push({ y, paint: stroke(path, weight, pigment(stem, 0.46 + random() * 0.11)) })
    dabs.push({
      y,
      paint: stroke(path.map(([x, y]) => [x - weight * 0.21, y]),
        Math.max(0.42, weight * 0.24), pigment(stem, 0.74 + random() * 0.23, 0.85)),
    })
  }

  for (let y = 37 * unit, index = 0; y < stemEnd - 14 * unit; y += Math.max(29, mix(43, 74, random()) * unit), index++) {
    const base = point(y)
    const side = index % 3 === 1 ? -1 : 1
    const reach = mix(0.25, 0.39, random()) * width
    const joint: Point = [clamp(base[0] + side * reach * 0.41, 3, width - 3), y + mix(2, 12, random()) * unit]
    const tip: Point = [clamp(base[0] + side * reach, 3, width - 3), y - mix(19, 35, random()) * unit]
    const bend: Point = [mix(base[0], joint[0], 0.44), y + 6 * unit]
    dabs.push({ y, paint: stroke([base, bend, joint], 1.7 * unit, pigment(stem, 0.68)) })
    const leaf = ivyLeaf(joint, tip, reach * 0.63, mix(0.45, 0.79, random()), index % 5 === 1, random)
    dabs.push({ y: y + 3 * unit, paint: leaf.ground }, { y: y + 10 * unit, paint: leaf.detail })

    if (index % 4 === 2) {
      const curl: Point[] = Array.from({ length: 24 }, (_, step) => {
        const t = step / 23
        const angle = t * Math.PI * 2.12
        return [
          clamp(base[0] - side * (1 - Math.cos(angle) * (1 - t)) * 18 * unit, 2, width - 2),
          y + Math.sin(angle) * (1 - t) * 16 * unit + t * 25 * unit,
        ]
      })
      dabs.push({ y: y + 5 * unit, paint: stroke(curl, Math.max(0.6, 1.15 * unit), pigment(stem, 0.81)) })
    }
  }
  return dabs.sort((a, b) => a.y - b.y).map(({ paint }) => paint)
}

export function connectExperienceVines(root: HTMLElement) {
  const vines = new Map(Array.from(root.querySelectorAll<HTMLCanvasElement>("[data-experience-vine]"), (canvas, index) => {
    let size = ""
    const paint = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (width < 1 || height < 1) return
      const ratio = Math.min(window.devicePixelRatio || 1, 1.65)
      const nextSize = `${width}:${height}:${ratio}`
      if (nextSize === size) return
      const context = canvas.getContext("2d")
      if (!context) return
      size = nextSize
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.lineCap = "round"
      context.lineJoin = "round"
      if (canvas.dataset.experienceVine === "right") {
        context.translate(width, 0)
        context.scale(-1, 1)
      }
      for (const mark of composeVine(width, height, 484 + 23 * index)) mark(context)
    }
    return [canvas, paint] as const
  }))

  const visibility = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      const canvas = target as HTMLCanvasElement
      if (isIntersecting) vines.get(canvas)?.()
      canvas.toggleAttribute("data-vine-visible", isIntersecting)
    }
  }, { rootMargin: "35% 0px" })
  const size = new ResizeObserver((entries) => {
    for (const { target } of entries) {
      const canvas = target as HTMLCanvasElement
      if (canvas.hasAttribute("data-vine-visible")) vines.get(canvas)?.()
    }
  })
  for (const canvas of vines.keys()) {
    visibility.observe(canvas)
    size.observe(canvas)
  }
  return () => {
    visibility.disconnect()
    size.disconnect()
    for (const canvas of vines.keys()) canvas.removeAttribute("data-vine-visible")
  }
}
