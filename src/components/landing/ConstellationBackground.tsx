import * as React from "react"
import { clamp, lerp, rand, resizeCanvasToViewport } from "@/lib/canvas"

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

function makeBackdrop(ctx: CanvasRenderingContext2D, h: number, light: boolean) {
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, light ? "#f7fbff" : "#0b2033")
  bg.addColorStop(0.48, light ? "#f9fbfd" : "#0a182a")
  bg.addColorStop(1, light ? "#fff" : "#050b19")
  return bg
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
const PROFILE_RADIUS = 160
const auroraCurtains = [
  { baseline: 0.44, rise: 0.24, bend: 0.10, center: 0.56, width: 0.30, height: 0.50, phase: 1.4, strength: 0.30, focus: 0.24 },
  { baseline: 0.68, rise: 0.06, bend: 0.03, center: 0.66, width: 0.22, height: 0.24, phase: 2.8, strength: 0.42, focus: 0.62 },
  { baseline: 0.55, rise: 0.25, bend: 0.25, center: 0.45, width: 0.24, height: 0.47, phase: 0.2, strength: 1, focus: 1 },
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

function makeAuroraPalette(accent: RGB, light: boolean) {
  const cool = clamp((accent.g - accent.r) / 148, 0, 1)
  const blend = (from: RGB, to: RGB, amount: number): RGB => ({
    r: lerp(from.r, to.r, amount),
    g: lerp(from.g, to.g, amount),
    b: lerp(from.b, to.b, amount),
  })
  const halo = blend(accent, { r: 34, g: 172, b: 240 }, cool * 0.72)
  const core = blend(accent, { r: 26, g: 255, b: 163 }, cool * 0.64)
  const shade = { r: 8, g: 39, b: 86 }
  return light ? { halo: blend(halo, shade, 0.23), core: blend(core, shade, 0.13) } : { halo, core }
}

function drawAurora(
  ctx: CanvasRenderingContext2D,
  raster: ImageData,
  palette: ReturnType<typeof makeAuroraPalette>,
  seconds: number,
  light: boolean,
  portrait: boolean,
) {
  const { width, height, data } = raster
  const { core, halo } = palette
  const bands = auroraCurtains.map(() => ({ edge: 0, sampling: 0, glow: 0, rim: 0 }))
  const phase = seconds * 0.19
  const intensity = light ? 0.42 : 1

  for (let column = 0; column < width; column++) {
    const u = column / (width - 1)
    const x = portrait ? 0.09 + u * 0.82 : u
    const fade = 0.60 + 0.40 * Math.sin(Math.PI * u) ** 0.6

    for (let index = 0; index < bands.length; index++) {
      const curtain = auroraCurtains[index]
      const band = bands[index]
      const wave = phase * (1 + index * 0.16) + curtain.phase
      const middle = curtain.center + Math.sin(wave * 0.64) * 0.034
      const right = 1.06 + Math.sin(wave * 0.7 + 0.7) * 0.073
      const curl = gaussian((x - middle) / curtain.width) * curtain.rise
        + gaussian((x - right) / 0.23) * curtain.bend
      const folds = Math.sin(x * 13.5 + wave) * 0.032
        + Math.sin(x * 31 - wave * 0.63) * 0.017
        + Math.sin(x * 48 + wave * 0.4) * 0.008
      const pockets = 0.44 + 0.46 * (0.5 + 0.5 * Math.sin(x * 22 - wave)) ** 3
        + 0.33 * (0.5 + 0.5 * Math.cos(x * 37 + wave)) ** 4
      const heightScale = (curtain.height + 0.045 * Math.sin(x * 9.0 + wave)) * height

      band.edge = (curtain.baseline - curl + folds) * height
      band.sampling = PROFILE_RADIUS / heightScale
      band.glow = curtain.strength * (0.66 + 0.34 * pockets) * fade
      band.rim = curtain.strength * curtain.focus * pockets * fade
    }

    for (let row = 0, pixel = column * 4; row < height; row++, pixel += width * 4) {
      let glow = 0
      let rim = 0
      for (const band of bands) {
        const sample = Math.round(PROFILE_RADIUS + (row - band.edge) * band.sampling)
        if (sample < 0 || sample > PROFILE_RADIUS * 2) continue
        glow += haloProfile[sample] * band.glow
        rim += coreProfile[sample] * band.rim
      }

      const glowEnergy = glow * 0.33
      const rimEnergy = rim * 0.70
      const energy = glowEnergy + rimEnergy
      const mix = energy > 0 ? rimEnergy / energy : 0
      data[pixel] = lerp(halo.r, core.r, mix)
      data[pixel + 1] = lerp(halo.g, core.g, mix)
      data[pixel + 2] = lerp(halo.b, core.b, mix)
      data[pixel + 3] = (1 - Math.exp(-energy * 1.44)) * intensity * 255
    }
  }

  ctx.putImageData(raster, 0, 0)
}

/**
 * Fullscreen background: stars + aurora curtains + scroll-driven warp.
 * Uses Canvas2D for perf.
 */
export function ConstellationBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    const starAtlas = document.createElement("canvas")
    starAtlas.width = STAR_TILE_SIZE * STAR_DEPTH_STEPS
    starAtlas.height = STAR_TILE_SIZE
    const atlasCtx = starAtlas.getContext("2d")
    if (!atlasCtx) return

    const auroraCanvas = document.createElement("canvas")
    auroraCanvas.width = 320
    auroraCanvas.height = 180
    const auroraCtx = auroraCanvas.getContext("2d")
    if (!auroraCtx) return
    const auroraRaster = auroraCtx.createImageData(auroraCanvas.width, auroraCanvas.height)

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)")
    let reducedMotion = motionPreference.matches
    let raf = 0
    const vp = resizeCanvasToViewport(canvas, ctx, MAX_BACKGROUND_DPR)
    const root = document.documentElement
    let light = root.dataset.theme === "light"
    let backdrop = makeBackdrop(ctx, vp.height, light)
    let vignette = makeVignette(ctx, vp.width, vp.height, light)
    const initialTint = getAccentTint(root.dataset.accent)
    let auroraPalette = makeAuroraPalette(initialTint, light)
    let auroraTime = 0
    let lastAuroraPaint = 0
    let auroraDirty = true

    const paintAurora = (dt: number) => {
      auroraTime += dt
      if (auroraDirty || auroraTime - lastAuroraPaint >= AURORA_FRAME_INTERVAL - 0.001) {
        drawAurora(auroraCtx, auroraRaster, auroraPalette, auroraTime, light, vp.width < vp.height)
        lastAuroraPaint = auroraTime
        auroraDirty = false
      }
      ctx.drawImage(auroraCanvas, 0, 0, vp.width, vp.height)
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

    let starSprites = drawStarAtlas(atlasCtx, initialTint, light)

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
      backdrop = makeBackdrop(ctx, vp.height, light)
      vignette = makeVignette(ctx, vp.width, vp.height, light)
      auroraDirty = true
      starCount = visibleStarCount()

      // Re-spread stars to fit new viewport
      for (const s of stars) resetStar(s, true)

      if (reducedMotion) drawFrame(0, 0)
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
    }

    globalThis.addEventListener("resize", onResize)
    let lastFrame = 0
    let nextFrame = 0

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
      const alpha = clamp((alphaStar + alphaFloor) * depth, 0, 1)

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

    const drawFrame = (time: number, dt: number) => {
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

      const zSpeed = (scroll.velocity * 0.0032 + 0.00034) * (dt * 60)
      const forward = clamp(Math.abs(scroll.velocity) / 14, 0, 1)

      ctx.fillStyle = backdrop
      ctx.fillRect(0, 0, vp.width, vp.height)

      paintAurora(dt)
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
      if (time + 0.5 < nextFrame) return

      const dt = lastFrame ? Math.min(0.05, (time - lastFrame) / 1000) : 0
      lastFrame = time
      // Keep the average cadence on high-refresh screens and discard missed frames.
      const deadline = nextFrame + FRAME_INTERVAL_MS
      nextFrame = deadline > time ? deadline : time + FRAME_INTERVAL_MS
      drawFrame(time, dt)
    }

    const appearanceObserver = new MutationObserver((changes) => {
      const nextLight = root.dataset.theme === "light"
      if (nextLight !== light) {
        light = nextLight
        backdrop = makeBackdrop(ctx, vp.height, light)
        vignette = makeVignette(ctx, vp.width, vp.height, light)
      } else if (!changes.some(({ attributeName }) => attributeName === "data-accent")) {
        return
      }

      const tint = getAccentTint(root.dataset.accent)
      starSprites = drawStarAtlas(atlasCtx, tint, light)
      auroraPalette = makeAuroraPalette(tint, light)
      auroraDirty = true
      drawFrame(reducedMotion ? 0 : performance.now(), 0)
    })
    appearanceObserver.observe(root, { attributes: true, attributeFilter: ["data-theme", "data-accent"] })

    const updateAnimation = () => {
      globalThis.cancelAnimationFrame(raf)
      globalThis.removeEventListener("scroll", onScroll)
      if (document.hidden) return

      reducedMotion = motionPreference.matches
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

    updateAnimation()
    motionPreference.addEventListener("change", updateAnimation)
    document.addEventListener("visibilitychange", updateAnimation)

    return () => {
      globalThis.removeEventListener("resize", onResize)
      globalThis.removeEventListener("scroll", onScroll)
      globalThis.cancelAnimationFrame(raf)
      appearanceObserver.disconnect()
      motionPreference.removeEventListener("change", updateAnimation)
      document.removeEventListener("visibilitychange", updateAnimation)
    }
  }, [])

  return (
      <div
          className="pointer-events-none fixed inset-0"
          style={{ zIndex: 0, isolation: "isolate" }}
          aria-hidden
      >
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>
  )
}
