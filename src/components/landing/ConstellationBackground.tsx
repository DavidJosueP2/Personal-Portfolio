import * as React from "react"
import { clamp, lerp, rand, resizeCanvasToViewport } from "@/lib/canvas"
import { createWebGLAurora } from "./aurora/aurora-webgl"
import { heroFlight, planetDeparture, planetDepartureTiming } from "@/lib/hero-flight"

type Star = {
  x: number
  y: number
  z: number // 0..1, depth (0=near, 1=far)
  r: number
  baseAlpha: number
  maxAlpha: number
  twinkleSpeed: number
  twinklePhase: number
  twinkleCurve: number
}

const MAX_BACKGROUND_DPR = 1.25
const FRAME_INTERVAL_MS = 1000 / 60
const IDLE_FRAME_INTERVAL_MS = 1000 / 30
const MAX_STARS = 500
const STAR_TILE_SIZE = 96
const STAR_DEPTH_STEPS = 8
const STAR_SPRITE_CORE = 2

type RGB = { r: number; g: number; b: number }

function parseCssRgbTriplet(input: string): RGB | null {
  // Accepts formats like: "52 211 153" or "52, 211, 153"
  const cleaned = input.trim().replaceAll(/\s+/g, " ")
  if (!cleaned) return null
  const parts = cleaned.includes(",") ? cleaned.split(",") : cleaned.split(" ")
  if (parts.length < 3) return null
  const r = Number(parts[0])
  const g = Number(parts[1])
  const b = Number(parts[2])
  if (![r, g, b].every((n) => Number.isFinite(n))) return null
  return {
    r: clamp(Math.round(r), 0, 255),
    g: clamp(Math.round(g), 0, 255),
    b: clamp(Math.round(b), 0, 255),
  }
}

function readAccentRgbFromCss(): RGB | null {
  if (globalThis.window === undefined) return null
  const raw = globalThis
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--accent-rgb")
  return parseCssRgbTriplet(raw)
}

function getAccentTint(accent: string | undefined): RGB {
  // Prefer the actual runtime token (keeps perfect match with the selected accent)
  const fromCss = readAccentRgbFromCss()
  if (fromCss) return fromCss

  // Fallback (keeps previous behavior if CSS variable isn't available)
  switch (accent) {
    case "lime":
      return { r: 190, g: 255, b: 60 }
    case "red":
      return { r: 255, g: 80, b: 110 }
    case "cyan":
      return { r: 34, g: 211, b: 238 }
    case "violet":
      return { r: 167, g: 139, b: 250 }
    case "amber":
      return { r: 251, g: 191, b: 36 }
    case "emerald":
      return { r: 52, g: 211, b: 153 }
    default:
      return { r: 52, g: 211, b: 153 }
  }
}

function makeVignette(ctx: CanvasRenderingContext2D, w: number, h: number, light: boolean) {
  const edgeColor = light ? "255,255,255" : "3,9,22"
  const vg = ctx.createRadialGradient(w / 2, h * 0.42, h * 0.15, w / 2, h * 0.42, Math.max(w * 0.68, h * 0.88))
  vg.addColorStop(0, `rgba(${edgeColor},0)`)
  vg.addColorStop(1, `rgba(${edgeColor},${light ? 0.58 : 0.48})`)
  return vg
}

function drawStarAtlas(ctx: CanvasRenderingContext2D, tint: RGB, light: boolean) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const coreR = STAR_SPRITE_CORE
  const coreColor = light ? "12,12,14" : "255,255,255"
  return Array.from({ length: STAR_DEPTH_STEPS }, (_, index) => {
    const near = index / (STAR_DEPTH_STEPS - 1)
    const mix = 0.06 + near * 0.12
    const r = Math.round(lerp(255, tint.r, mix))
    const g = Math.round(lerp(255, tint.g, mix))
    const b = Math.round(lerp(255, tint.b, mix))
    const color = light ? coreColor : `${r},${g},${b}`
    const auraR = coreR * lerp(7.5, 15, near)
    const hazeR = auraR * 1.35
    const x = (index + 0.5) * STAR_TILE_SIZE
    const y = STAR_TILE_SIZE / 2

    const glow = (radius: number, rgb: string, stops: [number, number][]) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      for (const [offset, alpha] of stops) gradient.addColorStop(offset, `rgba(${rgb},${alpha})`)
      gradient.addColorStop(1, `rgba(${rgb},0)`)
      ctx.fillStyle = gradient
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    }

    ctx.globalCompositeOperation = light ? "source-over" : "lighter"
    const auraStrength = 0.28
    glow(hazeR, color, [[0, auraStrength * 0.22], [0.12, auraStrength * 0.12], [0.38, auraStrength * 0.06]])
    glow(auraR, color, [[0, auraStrength * 0.55], [0.18, auraStrength * 0.18], [0.55, auraStrength * 0.06]])
    glow(coreR * 2.8, coreColor, [[0, 0.36], [0.32, 0.08]])

    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = `rgb(${color})`
    ctx.beginPath()
    ctx.arc(x, y, coreR, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(${coreColor},0.6)`
    ctx.beginPath()
    ctx.arc(x - coreR * 0.18, y - coreR * 0.22, coreR * 0.28, 0, Math.PI * 2)
    ctx.fill()

    const halfSize = Math.ceil(hazeR) + 1
    return { x: x - halfSize, y: y - halfSize, size: halfSize * 2, stroke: `rgb(${color})` }
  })
}

const AURORA_FRAME_INTERVAL = 1 / 24
const GPU_AURORA_FRAME_INTERVAL = 1 / 30
const AURORA_WIDTH = 256
const AURORA_HEIGHT = 144
const PROFILE_RADIUS = 160
const auroraCurtains = [
  {
    color: { r: 35, g: 166, b: 248 }, baseline: 0.36, rise: 0.13, center: 0.59, width: 0.44,
    height: 0.44, amplitude: 0.04, speed: 0.14, phase: 0.8, glow: 0.32, rim: 0.08,
  },
  {
    color: { r: 21, g: 232, b: 138 }, baseline: 0.49, rise: 0.25, center: 0.31, width: 0.41,
    height: 0.41, amplitude: 0.065, speed: -0.22, phase: 0.15, glow: 0.43, rim: 0.53,
  },
  {
    color: { r: 23, g: 255, b: 222 }, baseline: 0.55, rise: 0.23, center: 0.78, width: 0.33,
    height: 0.34, amplitude: 0.073, speed: 0.26, phase: 2.2, glow: 0.34, rim: 0.66,
  },
  {
    color: { r: 187, g: 255, b: 86 }, baseline: 0.55, rise: 0.17, center: 0.38, width: 0.29,
    height: 0.21, amplitude: 0.047, speed: -0.29, phase: 4.1, glow: 0.13, rim: 0.49,
  },
  {
    color: { r: 30, g: 229, b: 255 }, baseline: 0.67, rise: 0.10, center: 0.67, width: 0.40,
    height: 0.25, amplitude: 0.037, speed: 0.18, phase: 1.45, glow: 0.16, rim: 0.22,
  },
]

function gaussian(distance: number) {
  return Math.exp(-(distance * distance))
}

const coreProfile = Float32Array.from({ length: PROFILE_RADIUS * 2 + 1 }, (_, index) => {
  const distance = index / PROFILE_RADIUS - 1
  return gaussian(distance / (distance < 0 ? 0.17 : 0.105))
})

const haloProfile = Float32Array.from({ length: PROFILE_RADIUS * 2 + 1 }, (_, index) => {
  const distance = index / PROFILE_RADIUS - 1
  const fade = 1 - clamp((Math.abs(distance) - 0.72) / 0.28, 0, 1)
  return gaussian((distance + 0.11) / (distance < 0 ? 0.56 : 0.24)) * fade * fade
})

const heroTextShade = Float32Array.from({ length: AURORA_HEIGHT }, (_, row) => (
  gaussian((row / (AURORA_HEIGHT - 1) - 0.56) / 0.105)
))

function makeAuroraPalette(accent: RGB, light: boolean) {
  const isCoolAccent = accent.g >= Math.max(accent.r, accent.b * 0.86)
  const influence = isCoolAccent ? 0.14 : 0.72
  const shade = light ? 0.81 : 1

  return auroraCurtains.map(({ color }): RGB => ({
    r: lerp(color.r, accent.r, influence) * shade,
    g: lerp(color.g, accent.g, influence) * shade,
    b: lerp(color.b, accent.b, influence) * shade,
  }))
}

function drawAurora(
  ctx: CanvasRenderingContext2D,
  raster: ImageData,
  columnLight: Float32Array,
  palette: RGB[],
  seconds: number,
  light: boolean,
  portrait: boolean,
) {
  const { width, height, data } = raster
  const intensity = light ? 0.40 : 1
  const bands = auroraCurtains.map((curtain, index) => {
    const age = seconds * curtain.speed
    const phase = age + curtain.phase
    const drift = Math.sin(age * 0.74 + curtain.phase) * 0.15 + Math.sin(age * 0.31) * 0.07

    return {
      curtain,
      tint: palette[index],
      phase,
      drift,
      center: curtain.center + drift,
      baseline: curtain.baseline + Math.sin(phase * 0.73) * 0.047,
      span: curtain.width * (0.88 + Math.sin(phase * 0.82) * 0.23),
      stretch: 0.86 + Math.sin(phase * 0.64 + 0.9) * 0.19 + Math.cos(age * 0.39) * 0.08,
    }
  })

  for (let column = 0; column < width; column++) {
    const u = column / (width - 1)
    const x = portrait ? 0.14 + u * 0.72 : u
    const fade = 0.56 + 0.44 * Math.sin(Math.PI * u) ** 0.6
    const textShade = gaussian((u - 0.5) / (portrait ? 0.36 : 0.19)) * (light ? 0.12 : 0.51)
    columnLight.fill(0)

    for (const { curtain, tint, phase, drift, center, baseline, span, stretch } of bands) {
      const foldX = x - drift + 0.065 * Math.sin(x * 7.5 - phase * 0.68)
      const crest = gaussian((x - center) / span)
      const folds = Math.sin(foldX * 8.7 + phase)
        + Math.sin(foldX * 20.1 - phase * 0.73) * 0.36
        + Math.sin(foldX * 36.8 + phase * 0.48) * 0.14
      const edge = (baseline - crest * curtain.rise + folds * curtain.amplitude) * height
      const thickness = Math.sin(foldX * 11.6 + phase) * 0.19 + Math.cos(foldX * 24.2 - phase * 0.58) * 0.10
      const reach = curtain.height * (stretch + thickness) * height
      const pockets = 0.42 + 0.46 * (0.5 + 0.5 * Math.sin(foldX * 25.2 + phase * 0.55)) ** 3
        + 0.27 * (0.5 + 0.5 * Math.cos(foldX * 39.6 - phase)) ** 4
      const coverage = fade * (0.27 + 0.73 * crest)
      const glow = curtain.glow * coverage * (0.62 + pockets * 0.38)
      const rim = curtain.rim * coverage * pockets

      // Accumulate overlapping light only inside each curtain's soft profile.
      const start = Math.max(0, Math.ceil(edge - reach))
      const end = Math.min(height - 1, Math.floor(edge + reach))
      const sampling = PROFILE_RADIUS / reach
      for (let row = start, offset = start * 4; row <= end; row++, offset += 4) {
        const sample = Math.round(PROFILE_RADIUS + (row - edge) * sampling)
        const energy = haloProfile[sample] * glow + coreProfile[sample] * rim
        columnLight[offset] += tint.r * energy
        columnLight[offset + 1] += tint.g * energy
        columnLight[offset + 2] += tint.b * energy
        columnLight[offset + 3] += energy
      }
    }

    for (let row = 0, offset = 0, pixel = column * 4; row < height; row++, offset += 4, pixel += width * 4) {
      const energy = columnLight[offset + 3]
      if (energy < 0.002) {
        data[pixel + 3] = 0
        continue
      }
      data[pixel] = columnLight[offset] / energy
      data[pixel + 1] = columnLight[offset + 1] / energy
      data[pixel + 2] = columnLight[offset + 2] / energy
      data[pixel + 3] = (1 - Math.exp(-energy * 1.44)) * (1 - heroTextShade[row] * textShade) * intensity * 255
    }
  }

  ctx.putImageData(raster, 0, 0)
}

/**
 * Fullscreen background: stars + aurora curtains + scroll-driven warp.
 * Uses WebGL for the aurora and Canvas2D for the stars.
 */
export function ConstellationBackground() {
  const backdropRef = React.useRef<HTMLDivElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const auroraRef = React.useRef<HTMLCanvasElement | null>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    const auroraLayer = auroraRef.current
    const backdrop = backdropRef.current
    if (!canvas || !auroraLayer || !backdrop) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const starAtlas = document.createElement("canvas")
    starAtlas.width = STAR_TILE_SIZE * STAR_DEPTH_STEPS
    starAtlas.height = STAR_TILE_SIZE
    const atlasCtx = starAtlas.getContext("2d")
    if (!atlasCtx) return

    const auroraCanvas = document.createElement("canvas")
    auroraCanvas.width = AURORA_WIDTH
    auroraCanvas.height = AURORA_HEIGHT
    const auroraCtx = auroraCanvas.getContext("2d")
    if (!auroraCtx) return
    const auroraRaster = auroraCtx.createImageData(auroraCanvas.width, auroraCanvas.height)
    const auroraColumnLight = new Float32Array(auroraCanvas.height * 4)

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)")
    let reducedMotion = motionPreference.matches
    let raf = 0
    const vp = resizeCanvasToViewport(canvas, ctx, MAX_BACKGROUND_DPR)
    const root = document.documentElement
    let light = root.dataset.theme === "light"
    let vignette = makeVignette(ctx, vp.width, vp.height, light)
    let tint = getAccentTint(root.dataset.accent)
    let auroraPalette = makeAuroraPalette(tint, light)
    let auroraTime = 0
    let lastAuroraPaint = 0
    let auroraDirty = true
    let renderer: ReturnType<typeof createWebGLAurora> = null
    let painting = false
    let auroraAttempted = false

    const paintAurora = (dt: number) => {
      auroraTime += dt
      const interval = renderer ? GPU_AURORA_FRAME_INTERVAL : AURORA_FRAME_INTERVAL
      if (auroraDirty || auroraTime - lastAuroraPaint >= interval - 0.001) {
        if (renderer) {
          renderer.draw(auroraTime)
          if (auroraLayer.hidden) auroraLayer.hidden = false
        } else {
          drawAurora(auroraCtx, auroraRaster, auroraColumnLight, auroraPalette, auroraTime, light, vp.width < vp.height)
        }
        lastAuroraPaint = auroraTime
        auroraDirty = false
      }
      if (!renderer) ctx.drawImage(auroraCanvas, 0, 0, vp.width, vp.height)
    }

    // Scroll -> "travel speed". We ease it to feel like a camera inertia.
    const scroll = {
      lastY: globalThis.scrollY,
      velocity: 0,
      targetVelocity: 0,
      lastInputTs: performance.now(),
    }

    const style = {
      // core radii (the dot), glow is computed separately
      starRadiusMin: 0.5,
      starRadiusMax: 1.35,
      // keep a clean frame (no stars/noise hugging the viewport edges)
      edgeMargin: 28,
    }

    let starSprites = drawStarAtlas(atlasCtx, tint, light)
    let lastSky = ""

    const setAppearance = (nextLight: boolean) => {
      light = nextLight
      vignette = makeVignette(ctx, vp.width, vp.height, light)
      starSprites = drawStarAtlas(atlasCtx, tint, light)
      auroraPalette = makeAuroraPalette(tint, light)
      renderer?.setAppearance(tint, light)
      auroraDirty = true
    }

    const stars: Star[] = []
    const visibleStarCount = () => Math.round(MAX_STARS * clamp(vp.width / 1000, 0.55, 1))
    let starCount = visibleStarCount()
    const resetStar = (s: Star, randomZ = true) => {
      const m = style.edgeMargin
      // store in centered coordinate space so we can project to screen.
      // Keep distribution slightly inside to avoid visible edge columns.
      s.x = rand(-(vp.width / 2 - m), vp.width / 2 - m)
      s.y = rand(-(vp.height / 2 - m), vp.height / 2 - m)
      s.z = randomZ ? rand(0, 1) : 1
      // small core radius; depth scales it
      s.r = rand(style.starRadiusMin, style.starRadiusMax)

      // Not all stars should reach the same peak brightness.
      s.baseAlpha = rand(0.02, 0.22)
      s.maxAlpha = rand(0.35, 1)

      s.twinkleSpeed = rand(0.55, 1.55)
      s.twinklePhase = rand(0, Math.PI * 2)
      // a bit tighter curves to avoid long "always on" states
      s.twinkleCurve = rand(1.35, 2.6)
    }

    for (let i = 0; i < MAX_STARS; i++) {
      const s = {
        x: 0,
        y: 0,
        z: 0,
        r: 1,
        baseAlpha: 0.2,
        maxAlpha: 0.85,
        twinkleSpeed: 1,
        twinklePhase: 0,
        twinkleCurve: 2.2,
      } satisfies Star
      resetStar(s, true)
      stars.push(s)
    }

    const onResize = () => {
      Object.assign(vp, resizeCanvasToViewport(canvas, ctx, MAX_BACKGROUND_DPR))
      renderer?.resize(vp.width, vp.height)
      vignette = makeVignette(ctx, vp.width, vp.height, light)
      auroraDirty = true
      starCount = visibleStarCount()

      // Re-spread stars to fit new viewport
      for (const s of stars) resetStar(s, true)

      if (painting && reducedMotion) drawFrame(0, 0)
    }

    // Track scroll velocity
    const onScroll = () => {
      const y = globalThis.scrollY
      const dy = y - scroll.lastY
      if (!dy) return
      const now = performance.now()
      const elapsed = clamp(now - scroll.lastInputTs, 4, FRAME_INTERVAL_MS)
      scroll.lastY = y
      scroll.lastInputTs = now
      scroll.targetVelocity = clamp(dy * 0.12 * (FRAME_INTERVAL_MS / elapsed), -14, 14)
      nextFrame = Math.min(nextFrame, now)
    }

    globalThis.addEventListener("resize", onResize)
    let lastFrame = 0
    let nextFrame = 0
    let starVisibility = 1

    const drawStar = (s: Star, time: number, zSpeed: number, forward: number) => {
      // Move in depth (Z). zSpeed > 0 means moving "forward" into space.
      s.z -= zSpeed

      // loop depth (keep continuous depth instead of hard respawn)
      if (s.z < 0) s.z += 1
      else if (s.z > 1) s.z -= 1

      // Perspective projection towards the center
      const cx = vp.width / 2
      const cy = vp.height / 2

      // bigger when near: scale grows as z approaches 0
      const scale = 0.14 + (1 - s.z) * 1.35
      let sx = cx + s.x * scale
      let sy = cy + s.y * scale

      // Instead of wrap-around (which can create visible edge bands),
      // softly respawn stars that go out of bounds.
      const m = style.edgeMargin
      let wrapped = false
      if (sx < -m || sx > vp.width + m || sy < -m || sy > vp.height + m) {
        resetStar(s, false)
        wrapped = true
        // Recompute screen position after respawn for this frame.
        sx = cx + s.x * scale
        sy = cy + s.y * scale
      }

      // Twinkle
      const tw = (Math.sin(time * 0.001 * s.twinkleSpeed + s.twinklePhase) + 1) / 2 // 0..1
      const shaped = Math.pow(tw, s.twinkleCurve)
      const intensity = clamp(shaped, 0, 1)

      const alphaStar = lerp(0, s.maxAlpha, intensity)
      const alphaFloor = s.baseAlpha * (1 - intensity)
      const depth = 0.28 + (1 - s.z) * 0.72
      const alpha = clamp((alphaStar + alphaFloor) * depth, 0, 1) * starVisibility

      // Keep the core tiny and crisp.
      const coreR = clamp(
          s.r * (0.42 + (1 - s.z) * 0.72) * (0.85 + intensity * 0.25),
          0.35,
          1.45
      )

      const sprite = starSprites[Math.round((1 - s.z) * (STAR_DEPTH_STEPS - 1))]
      const size = sprite.size * coreR / STAR_SPRITE_CORE
      ctx.globalAlpha = alpha
      ctx.drawImage(
        starAtlas, sprite.x, sprite.y, sprite.size, sprite.size,
        sx - size / 2, sy - size / 2, size, size
      )

      if (!wrapped && forward > 0.18 && Math.random() < forward * 0.18) {
        const dx = sx - cx
        const dy = sy - cy
        const mag = Math.max(1, Math.hypot(dx, dy))
        const ux = dx / mag
        const uy = dy / mag
        const len = (18 + forward * 90) * (0.35 + (1 - s.z) * 0.9)

        const margin = 2
        const ex = clamp(sx + ux * len, -margin, vp.width + margin)
        const ey = clamp(sy + uy * len, -margin, vp.height + margin)

        ctx.globalAlpha = alpha * 0.28
        ctx.strokeStyle = sprite.stroke
        ctx.lineWidth = Math.max(0.5, coreR * 0.55)
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(ex, ey)
        ctx.stroke()
      }
    }

    const { auroraStart, contactStart } = planetDepartureTiming
    const leavingEarth = () => planetDeparture.active && planetDeparture.progress < contactStart
    const drawFrame = (time: number, dt: number) => {
      const progress = planetDeparture.progress
      const returnToAurora = clamp((progress - auroraStart) / (contactStart - auroraStart), 0, 1)
      const journey = heroFlight.active ? heroFlight.progress : 0
      starVisibility = 1 - clamp((journey - 0.43) / 0.16, 0, 1)
      const inSpace = leavingEarth() || journey > 0.12
      const nextLight = root.dataset.theme === "light" && !inSpace
      if (nextLight !== light) setAppearance(nextLight)
      const sky = inSpace ? "#030814" : ""
      if (lastSky !== sky) {
        backdrop.style.background = sky
        lastSky = sky
      }
      const auroraVisibility = planetDeparture.active
        ? Math.max(1 - clamp(progress / 0.13, 0, 1), returnToAurora)
        : 1 - clamp((journey - 0.04) / 0.26, 0, 1)
      auroraLayer.style.opacity = String(auroraVisibility)

      // ease velocity
      scroll.velocity = lerp(scroll.velocity, scroll.targetVelocity, 0.11)

      // Auto-brake
      const idleTarget = 0
      const since = performance.now() - scroll.lastInputTs
      if (since > 140) {
        const brake = since > 900 ? 0.085 : 0.045
        scroll.targetVelocity = lerp(scroll.targetVelocity, idleTarget, brake)
        if (Math.abs(scroll.targetVelocity) < 0.02) scroll.targetVelocity = 0
      }

      const flightSpeed = inSpace ? 1.65 : 1
      const direction = leavingEarth() ? -1 : 1
      const zSpeed = (scroll.velocity * 0.0032 * flightSpeed * direction + 0.00034) * (dt * 60)
      const forward = clamp(Math.abs(scroll.velocity) * flightSpeed / 14, 0, 1)

      ctx.clearRect(0, 0, vp.width, vp.height)
      ctx.globalAlpha = auroraVisibility
      if (auroraVisibility > 0) paintAurora(dt)
      ctx.globalAlpha = 1
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, vp.width, vp.height)

      for (let i = 0; i < starCount; i++) {
        drawStar(stars[i], time, zSpeed, forward)
      }
      ctx.globalAlpha = 1

      // Subtle grain
      ctx.save()
      ctx.globalAlpha = 0.035
      ctx.fillStyle = light ? "#111" : "#fff"
      const gm = style.edgeMargin
      for (let i = 0; i < 45; i++) {
        ctx.fillRect(rand(gm, vp.width - gm), rand(gm, vp.height - gm), 1, 1)
      }
      ctx.restore()
    }

    const loop = (time: number) => {
      raf = globalThis.requestAnimationFrame(loop)
      // The 3D garden has its own sky, so it fully covers this backdrop.
      if (heroFlight.active && heroFlight.progress > 0.67 && !planetDeparture.active) return
      if (time + 0.5 < nextFrame) return

      const dt = lastFrame ? Math.min(0.05, (time - lastFrame) / 1000) : 0
      lastFrame = time
      // Keep the average cadence on high-refresh screens and discard missed frames.
      const moving = Math.abs(scroll.velocity) > 0.05 || Math.abs(scroll.targetVelocity) > 0.05
      const interval = moving ? FRAME_INTERVAL_MS : IDLE_FRAME_INTERVAL_MS
      const deadline = nextFrame + interval
      nextFrame = deadline > time ? deadline : time + interval
      drawFrame(time, dt)
    }

    const appearanceObserver = new MutationObserver((changes) => {
      const nextLight = root.dataset.theme === "light" && !leavingEarth() && !(heroFlight.active && heroFlight.progress > 0.12)
      if (nextLight !== light) {
        setAppearance(nextLight)
      } else if (!changes.some(({ attributeName }) => attributeName === "data-accent")) {
        return
      }

      tint = getAccentTint(root.dataset.accent)
      setAppearance(light)
      if (painting) drawFrame(reducedMotion ? 0 : performance.now(), 0)
    })
    appearanceObserver.observe(root, { attributes: true, attributeFilter: ["data-theme", "data-accent"] })

    const onContextLost = (event: Event) => {
      event.preventDefault()
      renderer = null
      auroraLayer.hidden = true
      auroraDirty = true
      if (painting && reducedMotion) drawFrame(0, 0)
    }
    const prepareAurora = () => {
      auroraAttempted = true
      renderer = createWebGLAurora(auroraLayer)
      renderer?.resize(vp.width, vp.height)
      renderer?.setAppearance(tint, light)
      auroraDirty = true
      if (painting && reducedMotion) drawFrame(0, 0)
    }
    auroraLayer.addEventListener("webglcontextlost", onContextLost)
    auroraLayer.addEventListener("webglcontextrestored", prepareAurora)

    const intro = document.querySelector<HTMLElement>("[data-hero-intro]")
    const windows = new Set<Element>()
    const updateAnimation = () => {
      const nextPainting = !document.hidden && windows.size > 0
        && (!intro || intro.hidden || intro.hasAttribute("data-intro-revealing"))
      const nextReduced = motionPreference.matches
      if (painting === nextPainting && (!painting || reducedMotion === nextReduced)) return
      painting = nextPainting
      globalThis.cancelAnimationFrame(raf)
      globalThis.removeEventListener("scroll", onScroll)
      if (!painting) return

      reducedMotion = nextReduced
      // Choose the renderer before the first paint, while the intro still covers the sky.
      if (!auroraAttempted) prepareAurora()
      scroll.lastY = globalThis.scrollY
      scroll.lastInputTs = performance.now()
      scroll.velocity = 0
      scroll.targetVelocity = 0
      lastFrame = 0
      nextFrame = 0
      drawFrame(reducedMotion ? 0 : scroll.lastInputTs, 0)
      if (!reducedMotion) {
        globalThis.addEventListener("scroll", onScroll, { passive: true })
        raf = globalThis.requestAnimationFrame(loop)
      }
    }

    const visibility = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        if (isIntersecting) windows.add(target)
        else windows.delete(target)
      }
      updateAnimation()
    })
    document.querySelectorAll("[data-hero-stage], #contact, footer").forEach((element) => visibility.observe(element))
    const introObserver = new MutationObserver(updateAnimation)
    if (intro) introObserver.observe(intro, { attributes: true, attributeFilter: ["hidden", "data-intro-revealing"] })
    motionPreference.addEventListener("change", updateAnimation)
    document.addEventListener("visibilitychange", updateAnimation)

    return () => {
      globalThis.removeEventListener("resize", onResize)
      globalThis.removeEventListener("scroll", onScroll)
      globalThis.cancelAnimationFrame(raf)
      visibility.disconnect()
      introObserver.disconnect()
      appearanceObserver.disconnect()
      motionPreference.removeEventListener("change", updateAnimation)
      document.removeEventListener("visibilitychange", updateAnimation)
      auroraLayer.removeEventListener("webglcontextlost", onContextLost)
      auroraLayer.removeEventListener("webglcontextrestored", prepareAurora)
      renderer?.dispose()
    }
  }, [])

  return (
      <div
          ref={backdropRef}
          className="pointer-events-none fixed inset-0 bg-[linear-gradient(#f7fbff,#f9fbfd_48%,#fff)] dark:bg-[linear-gradient(#0b2033,#0a182a_48%,#050b19)]"
          style={{ zIndex: 0, isolation: "isolate" }}
          aria-hidden
      >
        <canvas ref={auroraRef} data-aurora-layer hidden className="absolute inset-0 h-full w-full" />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
  )
}
