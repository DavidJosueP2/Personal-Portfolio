import { clamp, lerp } from "@/lib/canvas"

export const FIELD_SAMPLES = 384

export const curtains = [
  {
    color: [41, 153, 230], baseline: 0.34, center: 0.59, spread: 0.48, rise: 0.11,
    height: 0.43, bend: 0.09, speed: 0.12, phase: 2.2, optics: [0.43, 0.09, 0.16, 0.17],
  },
  {
    color: [22, 234, 151], baseline: 0.47, center: 0.29, spread: 0.41, rise: 0.17,
    height: 0.49, bend: 0.17, speed: -0.21, phase: 6.4, optics: [0.42, 0.65, 0.55, 0.11],
  },
  {
    color: [17, 245, 215], baseline: 0.48, center: 0.77, spread: 0.43, rise: 0.17,
    height: 0.43, bend: 0.19, speed: 0.24, phase: 13.3, optics: [0.39, 0.71, 0.60, 0.105],
  },
  {
    color: [169, 248, 92], baseline: 0.57, center: 0.43, spread: 0.32, rise: 0.13,
    height: 0.26, bend: 0.13, speed: -0.26, phase: 21.8, optics: [0.14, 0.70, 0.41, 0.094],
  },
  {
    color: [24, 181, 236], baseline: 0.68, center: 0.64, spread: 0.54, rise: 0.074,
    height: 0.26, bend: 0.095, speed: 0.16, phase: 45.6, optics: [0.22, 0.26, 0.20, 0.14],
  },
] as const

function hash(x: number, y: number) {
  const cell = Math.imul(x, 1619) ^ Math.imul(y, 31337)
  const mixed = Math.imul(cell ^ (cell >>> 16), 0x45d9f3b)
  return ((mixed ^ (mixed >>> 16)) >>> 0) / 0xffffffff
}

function noise(x: number, y: number) {
  const column = Math.floor(x)
  const row = Math.floor(y)
  const u = x - column
  const v = y - row
  const xFade = u * u * (3 - 2 * u)
  const yFade = v * v * (3 - 2 * v)

  return lerp(
    lerp(hash(column, row), hash(column + 1, row), xFade),
    lerp(hash(column, row + 1), hash(column + 1, row + 1), xFade),
    yFade,
  )
}

function fractal(x: number, y: number) {
  return 0.58 * noise(x, y)
    + 0.29 * noise(x * 2.03 + 11.7, y * 2.14 - 8.3)
    + 0.13 * noise(x * 4.29 - 7.2, y * 4.16 + 13.1)
}

export function updateAuroraField(field: Float32Array, seconds: number) {
  curtains.forEach((curtain, layer) => {
    const age = seconds * curtain.speed
    const seed = curtain.phase
    const drift = (noise(seed * 1.2, age * 0.46) - 0.5) * 0.49
    const center = curtain.center + drift
    const spread = curtain.spread * (0.77 + noise(seed - 9.3, age * 0.79) * 0.50)
    const vertical = (noise(seed + 7.1, age * 0.57) - 0.5) * 0.10
    const stretch = 0.74 + noise(seed - 3.8, age * 0.62) * 0.55

    for (let sample = 0; sample < FIELD_SAMPLES; sample++) {
      const x = sample / (FIELD_SAMPLES - 1)
      const bank = Math.exp(-(((x - center) / spread) ** 2))
      const flowX = x - drift * 0.74 + (noise(x * 4 + seed, age * 0.71) - 0.5) * 0.17
      const folds = fractal(flowX * 6.2 + seed, age * 0.62 - seed) - 0.5
      const curl = noise(flowX * 13.1 - seed, age * 0.82 + seed * 2) - 0.5
      const edge = curtain.baseline + vertical - bank * curtain.rise + (folds * 1.45 + curl * 0.55) * curtain.bend
      const depth = curtain.height * (stretch + (noise(flowX * 7.6 + seed, age * 0.91) - 0.5) * 0.50)
      const filaments = fractal(flowX * 10.8 - seed, age * 0.74 + seed * 0.7)
      const light = (0.27 + 0.73 * bank) * (0.31 + 0.93 * filaments)
      const shear = (noise(flowX * 5.2 + seed, age * 0.84 + 6.3) - 0.5) * 0.30

      // One texel describes the edge, depth, emission and inclination at each column.
      const offset = (layer * FIELD_SAMPLES + sample) * 4
      field[offset] = edge
      field[offset + 1] = depth
      field[offset + 2] = light
      field[offset + 3] = shear
    }
  })
}

export function auroraColors(accent: { r: number; g: number; b: number }) {
  const cool = clamp((accent.g - accent.r) / Math.max(1, accent.b * 0.3), 0, 1)
  const influence = lerp(0.66, 0.16, cool)
  const channels = [accent.r, accent.g, accent.b]
  return new Float32Array(curtains.flatMap(({ color }) => color.map((value, channel) => (
    lerp(value, channels[channel], influence) / 255
  ))))
}
