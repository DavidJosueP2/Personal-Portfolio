import * as React from "react"
import { gsap } from "gsap"
import { prefersReducedMotion } from "@/lib/motion"
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

// --- Nebula sprites (small, layered, GSAP animated) -------------------------

// Fewer, larger, rounder blobs ("universe clouds")
const NEBULA_COUNT = 8 // 5..8 recommended
const NEBULA_SPRITE_SIZE = 256
const MAX_OPACITY = 0.3
const MIN_OPACITY = 0.25
const MOVE_RANGE: [number, number] = [260, 820] // px (min..max)
const BLUR_RANGE: [number, number] = [38, 98] // px (min..max)
const MAX_BACKGROUND_DPR = 1.25
const FRAME_INTERVAL_MS = 1000 / 60
const MAX_STARS = 760
const STAR_TILE_SIZE = 96
const STAR_DEPTH_STEPS = 8
const STAR_SPRITE_CORE = 2

type NebulaLayer = 0 | 1 | 2

type NebulaSprite = {
  id: number
  layer: NebulaLayer

  // animated values (GSAP mutates these)
  x: number
  y: number
  opacity: number
  scale: number
  rot: number

  // elliptical + organic shaping
  stretchX: number
  stretchY: number

  // Parameters chosen at spawn.
  blurPx: number
  radius: number // base draw radius (before scale)
  moveRange: number
  moveDuration: number
  sprite?: HTMLCanvasElement
  innerSprite?: HTMLCanvasElement
  tl?: gsap.core.Timeline
  driftTween?: gsap.core.Tween
  breatheTween?: gsap.core.Tween
}

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

function makeVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.12, w / 2, h / 2, h * 0.8)
  vg.addColorStop(0, "rgba(0,0,0,0)")
  vg.addColorStop(1, "rgba(0,0,0,0.82)")
  return vg
}

function makeBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
  bg.addColorStop(0, "#0a0a10")
  bg.addColorStop(1, "#000")
  return bg
}

function drawStarAtlas(ctx: CanvasRenderingContext2D, tint: RGB) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const coreR = STAR_SPRITE_CORE
  return Array.from({ length: STAR_DEPTH_STEPS }, (_, index) => {
    const near = index / (STAR_DEPTH_STEPS - 1)
    const mix = 0.06 + near * 0.12
    const r = Math.round(lerp(255, tint.r, mix))
    const g = Math.round(lerp(255, tint.g, mix))
    const b = Math.round(lerp(255, tint.b, mix))
    const color = `${r},${g},${b}`
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

    ctx.globalCompositeOperation = "lighter"
    const auraStrength = 0.42
    glow(hazeR, color, [[0, auraStrength * 0.22], [0.12, auraStrength * 0.12], [0.38, auraStrength * 0.06]])
    glow(auraR, color, [[0, auraStrength * 0.55], [0.18, auraStrength * 0.18], [0.55, auraStrength * 0.06]])
    glow(coreR * 2.8, "255,255,255", [[0, 0.36], [0.32, 0.08]])

    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = `rgb(${color})`
    ctx.beginPath()
    ctx.arc(x, y, coreR, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "rgba(255,255,255,0.6)"
    ctx.beginPath()
    ctx.arc(x - coreR * 0.18, y - coreR * 0.22, coreR * 0.28, 0, Math.PI * 2)
    ctx.fill()

    const halfSize = Math.ceil(hazeR) + 1
    return { x: x - halfSize, y: y - halfSize, size: halfSize * 2, stroke: `rgb(${color})` }
  })
}

function makeNebulaSpriteCanvas(size: number) {
  const c = document.createElement("canvas")
  c.width = size
  c.height = size
  const cctx = c.getContext("2d")
  if (!cctx) return c

  // Irregular soft alpha mask: multiple offset lobes + mild erosion.
  const cx = size / 2
  const cy = size / 2

  cctx.clearRect(0, 0, size, size)
  cctx.globalCompositeOperation = "source-over"

  // base soft disk
  const base = cctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.52)
  base.addColorStop(0, "rgba(255,255,255,0.9)")
  base.addColorStop(0.28, "rgba(255,255,255,0.42)")
  base.addColorStop(0.65, "rgba(255,255,255,0.14)")
  base.addColorStop(1, "rgba(255,255,255,0)")
  cctx.fillStyle = base
  cctx.beginPath()
  cctx.arc(cx, cy, size * 0.52, 0, Math.PI * 2)
  cctx.fill()

  // overlay lobes (break roundness)
  cctx.globalCompositeOperation = "lighter"
  for (let i = 0; i < 6; i++) {
    const ox = rand(-size * 0.22, size * 0.22)
    const oy = rand(-size * 0.18, size * 0.18)
    const rr = rand(size * 0.22, size * 0.46)
    const g = cctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, rr)
    g.addColorStop(0, "rgba(255,255,255,0.35)")
    g.addColorStop(0.45, "rgba(255,255,255,0.12)")
    g.addColorStop(1, "rgba(255,255,255,0)")
    cctx.fillStyle = g
    cctx.beginPath()
    cctx.arc(cx + ox, cy + oy, rr, 0, Math.PI * 2)
    cctx.fill()
  }

  // edge erosion: random transparent dots near perimeter
  cctx.globalCompositeOperation = "destination-out"
  cctx.globalAlpha = 0.22
  for (let i = 0; i < 140; i++) {
    const a = rand(0.2, 1)
    cctx.fillStyle = `rgba(0,0,0,${a})`
    const ang = rand(0, Math.PI * 2)
    const rad = rand(size * 0.22, size * 0.52)
    const x = cx + Math.cos(ang) * rad
    const y = cy + Math.sin(ang) * rad
    cctx.beginPath()
    cctx.arc(x, y, rand(0.6, 1.8), 0, Math.PI * 2)
    cctx.fill()
  }
  cctx.globalAlpha = 1
  cctx.globalCompositeOperation = "source-over"

  // Micro speckles
  cctx.globalAlpha = 0.05
  for (let i = 0; i < 80; i++) {
    const x = rand(0, size)
    const y = rand(0, size)
    const a = rand(0.2, 1)
    cctx.fillStyle = `rgba(255,255,255,${a})`
    cctx.fillRect(x, y, 1, 1)
  }
  cctx.globalAlpha = 1

  return c
}

function blurNebulaSprite(source: HTMLCanvasElement, blur: number) {
  // Leave room for the blur so the sprite can be scaled without clipping its edges.
  const padding = Math.ceil(blur * 3)
  const sprite = document.createElement("canvas")
  sprite.width = sprite.height = source.width + padding * 2
  const ctx = sprite.getContext("2d")
  if (!ctx) return source
  ctx.filter = `blur(${blur}px)`
  ctx.drawImage(source, padding, padding)
  return sprite
}

function layerForIndex(i: number): NebulaLayer {
  // Weighted layers: more background blobs than foreground.
  const t = i / Math.max(1, NEBULA_COUNT - 1)
  if (t < 0.55) return 0
  if (t < 0.85) return 1
  return 2
}

function layerFactors(layer: NebulaLayer) {
  switch (layer) {
    case 0:
      return { parallax: 0.25, opacityMaxMul: 0.85, blurMul: 1.15, scaleMul: 1.05 }
    case 1:
      return { parallax: 0.45, opacityMaxMul: 1, blurMul: 0.95, scaleMul: 1 }
    case 2:
      return { parallax: 0.7, opacityMaxMul: 1.05, blurMul: 0.8, scaleMul: 0.92 }
  }
}

function randomizeNebulaParams(n: NebulaSprite, vp: { width: number; height: number }, spawn?: { x: number; y: number }) {
  const layerFx = layerFactors(n.layer)

  // Big, soft blobs. Size also adapts a bit to viewport.
  const minSide = Math.max(360, Math.min(vp.width, vp.height))
  const baseRadius = rand(minSide * 0.22, minSide * 0.46) * layerFx.scaleMul
  const blurPx = rand(BLUR_RANGE[0], BLUR_RANGE[1]) * layerFx.blurMul

  const opMax = clamp(MAX_OPACITY * layerFx.opacityMaxMul, 0, 1)
  const opMin = MIN_OPACITY

  const moveRange = rand(MOVE_RANGE[0], MOVE_RANGE[1])

  // slower, smoother animation
  const moveDuration = rand(22, 54)

  // Position: controlled spawn (zone-based) to avoid central clustering.
  const pad = 40
  const x = clamp(spawn?.x ?? rand(pad, Math.max(pad + 1, vp.width - pad)), pad, Math.max(pad + 1, vp.width - pad))
  const y = clamp(spawn?.y ?? rand(pad, Math.max(pad + 1, vp.height - pad)), pad, Math.max(pad + 1, vp.height - pad))

  // Avoid very oval ratios: keep scaleX/scaleY close (round blob)
  const sx = rand(0.85, 1.18) * (n.layer === 0 ? 1.04 : 1)
  const sy = rand(0.85, 1.18) * (n.layer === 0 ? 1.04 : 1)

  n.radius = baseRadius
  n.blurPx = blurPx
  n.moveRange = moveRange
  n.moveDuration = moveDuration

  n.stretchX = sx
  n.stretchY = sy
  n.rot = rand(0, Math.PI * 2)

  n.x = x
  n.y = y
  n.scale = rand(0.82, 1.12)
  n.opacity = opMin

  return { opMax, opMin }
}

function startNebulaAnimation(
    n: NebulaSprite,
    vp: { width: number; height: number },
    getMaxMin: () => { opMax: number; opMin: number },
    target: { x: number; y: number; strength: number },
    getCohortPull: (id: number) => number
) {
  n.tl?.kill()
  n.driftTween?.kill()
  n.breatheTween?.kill()

  const { opMax, opMin } = getMaxMin()

  // Opacity pulse (soft, never blankets the whole screen)
  const tl = gsap.timeline({ repeat: -1 })
  tl.set(n, { opacity: rand(opMin, opMin * 2) })
  tl.to(n, {
    opacity: rand(opMax * 0.6, opMax),
    duration: rand(6, 14),
    ease: "sine.inOut",
  })
  tl.to(n, {
    opacity: rand(opMin, opMin * 1.6),
    duration: rand(10, 22),
    ease: "sine.inOut",
  })
  n.tl = tl

  // Breathing (scale only)
  const baseScale = n.scale
  n.breatheTween = gsap.to(n, {
    scale: baseScale * rand(0.92, 1.12),
    duration: rand(14, 32),
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  })

  // Free 2D drift across the viewport using absolute x/y moves.
  // This guarantees blobs will naturally reach edges.
  const driftOnce = () => {
    const pull = getCohortPull(n.id) * target.strength

    const biasedX = n.x + (target.x - n.x) * pull
    const biasedY = n.y + (target.y - n.y) * pull

    const nextX = biasedX + rand(-n.moveRange, n.moveRange)
    const nextY = biasedY + rand(-n.moveRange, n.moveRange)

    // allow going beyond bounds a bit (edge presence), then wrap
    const pad = 240

    n.driftTween = gsap.to(n, {
      x: nextX,
      y: nextY,
      rot: n.rot + rand(-0.55, 0.55),
      duration: rand(n.moveDuration * 0.75, n.moveDuration * 1.25),
      ease: "sine.inOut",
      onComplete: () => {
        // wrap-around to keep continuous movement
        const w = vp.width
        const h = vp.height

        if (n.x < -pad) n.x += w + pad * 2
        else if (n.x > w + pad) n.x -= w + pad * 2

        if (n.y < -pad) n.y += h + pad * 2
        else if (n.y > h + pad) n.y -= h + pad * 2

        driftOnce()
      },
    })
  }

  driftOnce()
}

function drawNebulaSprites(
    ctx: CanvasRenderingContext2D,
    vp: { width: number; height: number },
    nebulas: NebulaSprite[],
    parallaxOffset: { x: number; y: number }
) {
  // The sprites are white, so source-over yields the same blend on the opaque backdrop.
  for (const n of nebulas) {
    if (!n.sprite || n.opacity <= 0.0005) continue
    const { parallax } = layerFactors(n.layer)
    const x = n.x + parallaxOffset.x * parallax
    const y = n.y + parallaxOffset.y * parallax
    const scale = n.radius * n.scale / (NEBULA_SPRITE_SIZE / 2)
    const size = n.sprite.width * scale
    const reach = size * 0.5 * Math.max(n.stretchX, n.stretchY)
    if (x + reach < 0 || x - reach > vp.width || y + reach < 0 || y - reach > vp.height) continue

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(n.rot)
    ctx.scale(n.stretchX, n.stretchY)

    ctx.globalAlpha = clamp(n.opacity, 0, 1)
    ctx.drawImage(n.sprite, -size / 2, -size / 2, size, size)

    if (n.innerSprite) {
      const innerSize = n.innerSprite.width * scale * 0.92
      ctx.globalAlpha = clamp(n.opacity * 0.45, 0, 1)
      ctx.drawImage(n.innerSprite, -innerSize / 2, -innerSize / 2, innerSize, innerSize)
    }

    ctx.restore()
  }
}

/**
 * Fullscreen background: stars + soft nebula + scroll-driven warp.
 * Uses Canvas2D for perf.
 */
export function ConstellationBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  React.useEffect(() => {
    if (prefersReducedMotion()) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    const starAtlas = document.createElement("canvas")
    starAtlas.width = STAR_TILE_SIZE * STAR_DEPTH_STEPS
    starAtlas.height = STAR_TILE_SIZE
    const atlasCtx = starAtlas.getContext("2d")
    if (!atlasCtx) return

    let raf = 0
    const vp = resizeCanvasToViewport(canvas, ctx, MAX_BACKGROUND_DPR)
    let backdrop = makeBackdrop(ctx, vp.width, vp.height)
    let vignette = makeVignette(ctx, vp.width, vp.height)

    // Shared "attractor" point to create occasional soft overlap/connection
    const target = {
      x: vp.width * 0.5,
      y: vp.height * 0.5,
      strength: 0.18, // small bias; avoids central clustering
    }

    let cohort: number[] = []
    const chooseCohort = () => {
      // choose 2..3 nebulas to be pulled for a while
      const count = Math.random() < 0.55 ? 2 : 3
      const ids = Array.from({ length: NEBULA_COUNT }, (_, i) => i)
      // shuffle (small N)
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[ids[i], ids[j]] = [ids[j], ids[i]]
      }
      cohort = ids.slice(0, count)

      // move target somewhere not always centered
      const pad = 80
      target.x = rand(pad, Math.max(pad + 1, vp.width - pad))
      target.y = rand(pad, Math.max(pad + 1, vp.height - pad))

      // pulse attraction strength
      target.strength = rand(0.12, 0.26)
    }

    const getCohortPull = (id: number) => (cohort.includes(id) ? 1 : 0.12)

    chooseCohort()
    const retargetTl = gsap.timeline({ repeat: -1 })
    retargetTl.call(chooseCohort)
    retargetTl.to({}, { duration: rand(10, 18) })

    // Scroll -> "travel speed". We ease it to feel like a camera inertia.
    const scroll = {
      lastY: globalThis.scrollY,
      velocity: 0,
      targetVelocity: 0,
      zTravel: 0,
      lastInputTs: performance.now(),
    }

    const style = {
      // core radii (the dot), glow is computed separately
      starRadiusMin: 0.5,
      starRadiusMax: 1.35,
      // keep a clean frame (no stars/noise hugging the viewport edges)
      edgeMargin: 28,
    }

    // Rebuild the star textures only when the accent color changes.
    let accentTint = getAccentTint(document.documentElement.dataset.accent)
    let starSprites = drawStarAtlas(atlasCtx, accentTint)
    const updateAccentTint = () => {
      const next = getAccentTint(document.documentElement.dataset.accent)
      if (next.r === accentTint.r && next.g === accentTint.g && next.b === accentTint.b) return
      accentTint = next
      starSprites = drawStarAtlas(atlasCtx, accentTint)
    }

    const accentObserver: MutationObserver | null =
        globalThis.MutationObserver === undefined
            ? null
            : new MutationObserver(() => updateAccentTint())

    accentObserver?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-accent", "style", "class"],
    })

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

    // Nebula sprites (few, large blobs)
    const spriteCanvases = [
      makeNebulaSpriteCanvas(NEBULA_SPRITE_SIZE),
      makeNebulaSpriteCanvas(NEBULA_SPRITE_SIZE),
      makeNebulaSpriteCanvas(NEBULA_SPRITE_SIZE),
    ]

    const nebulas: NebulaSprite[] = Array.from({ length: NEBULA_COUNT }, (_, i) => {
      const layer = layerForIndex(i)
      return {
        id: i,
        layer,
        x: 0,
        y: 0,
        opacity: MIN_OPACITY,
        scale: 1,
        rot: 0,
        stretchX: 1,
        stretchY: 1,
        blurPx: 60,
        radius: 280,
        moveRange: 420,
        moveDuration: 34,
      }
    })

    const initNebulas = () => {
      // Zone-based initial distribution (edge-heavy):
      // - >=1 top (0..25%)
      // - >=1 bottom (75..100%)
      // - >=1 side (left 0..20% OR right 80..100%)
      // - max 2 in center box (40..60% x/y)
      const pad = 60
      const w = vp.width
      const h = vp.height

      const inCenter = (x: number, y: number) => {
        const nx = x / Math.max(1, w)
        const ny = y / Math.max(1, h)
        return nx >= 0.4 && nx <= 0.6 && ny >= 0.4 && ny <= 0.6
      }

      const zonePoint = (xMinN: number, xMaxN: number, yMinN: number, yMaxN: number) => {
        const x = rand(w * xMinN, w * xMaxN)
        const y = rand(h * yMinN, h * yMaxN)
        return {
          x: clamp(x, pad, Math.max(pad + 1, w - pad)),
          y: clamp(y, pad, Math.max(pad + 1, h - pad)),
        }
      }

      const zoneSpawns: Array<{ x: number; y: number }> = [
        zonePoint(0.02, 0.2, 0.02, 0.25), // top-left
        zonePoint(0.8, 0.98, 0.02, 0.25), // top-right
        zonePoint(0.02, 0.2, 0.75, 0.98), // bottom-left
        zonePoint(0.8, 0.98, 0.75, 0.98), // bottom-right (forces edge presence)
      ]

      // ensure at least one strong side presence (left/right bands)
      zoneSpawns.push(
          Math.random() < 0.5
              ? zonePoint(0.8, 0.98, 0.25, 0.7)
              : zonePoint(0.02, 0.2, 0.25, 0.7)
      )

      // fill remaining with EDGE-biased picks; keep center limited to max 2
      let centerCount = 0
      const pickRandomSpawn = () => {
        const pick = Math.random()
        if (pick < 0.3) return zonePoint(0.02, 0.22, 0.02, 0.98) // left edge band
        if (pick < 0.6) return zonePoint(0.78, 0.98, 0.02, 0.98) // right edge band
        if (pick < 0.78) return zonePoint(0.2, 0.8, 0.02, 0.22) // top band
        if (pick < 0.93) return zonePoint(0.2, 0.8, 0.78, 0.98) // bottom band
        return zonePoint(0.38, 0.62, 0.38, 0.62) // near-center
      }

      while (zoneSpawns.length < nebulas.length) {
        const p = pickRandomSpawn()
        const isC = inCenter(p.x, p.y)
        if (isC && centerCount >= 2) continue
        if (isC) centerCount++
        zoneSpawns.push(p)
      }

      // Shuffle spawns so the layering doesn't always map to the same zone
      for (let i = zoneSpawns.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[zoneSpawns[i], zoneSpawns[j]] = [zoneSpawns[j], zoneSpawns[i]]
      }

      for (let i = 0; i < nebulas.length; i++) {
        const n = nebulas[i]
        const spawn = zoneSpawns[i]
        const { opMax, opMin } = randomizeNebulaParams(n, vp, spawn)
        const source = spriteCanvases[n.layer]
        const blur = n.blurPx * source.width / (n.radius * 2)
        n.sprite = blurNebulaSprite(source, blur)
        if (n.layer === 2) n.innerSprite = blurNebulaSprite(source, blur * 0.7 / 0.92)
        startNebulaAnimation(n, vp, () => ({ opMax, opMin }), target, getCohortPull)
      }
    }

    const onResize = () => {
      Object.assign(vp, resizeCanvasToViewport(canvas, ctx, MAX_BACKGROUND_DPR))
      backdrop = makeBackdrop(ctx, vp.width, vp.height)
      vignette = makeVignette(ctx, vp.width, vp.height)
      starCount = visibleStarCount()

      // keep target in bounds
      const pad = 80
      target.x = clamp(target.x, pad, Math.max(pad + 1, vp.width - pad))
      target.y = clamp(target.y, pad, Math.max(pad + 1, vp.height - pad))

      // Re-spread stars to fit new viewport
      for (const s of stars) resetStar(s, true)

      // keep nebulas inside the viewport after resize
      const nPad = 60
      for (const n of nebulas) {
        n.x = clamp(n.x, nPad, Math.max(nPad + 1, vp.width - nPad))
        n.y = clamp(n.y, nPad, Math.max(nPad + 1, vp.height - nPad))
      }
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
    globalThis.addEventListener("scroll", onScroll, { passive: true })

    // Subtle ambient drift
    const ambient = { driftX: 0, driftY: 0 }
    const driftTl = gsap
        .timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } })
        .to(ambient, { driftX: 18, driftY: -12, duration: 6 })
        .to(ambient, { driftX: -14, driftY: 10, duration: 6 })

    // init nebulas after we have vp
    initNebulas()

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
      scroll.zTravel += scroll.velocity * dt * 1.35
      if (scroll.zTravel > 100000) scroll.zTravel -= 200000
      else if (scroll.zTravel < -100000) scroll.zTravel += 200000

      const forward = clamp(Math.abs(scroll.velocity) / 14, 0, 1)

      ctx.fillStyle = backdrop
      ctx.fillRect(0, 0, vp.width, vp.height)

      const par = scroll.zTravel * 0.65
      drawNebulaSprites(ctx, vp, nebulas, {
        x: ambient.driftX * 0.95 - par * 0.04,
        y: ambient.driftY * 0.95 - par * 0.035,
      })
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, vp.width, vp.height)

      for (let i = 0; i < starCount; i++) {
        drawStar(stars[i], time, zSpeed, forward)
      }
      ctx.globalAlpha = 1

      // Subtle grain
      ctx.save()
      ctx.globalAlpha = 0.035
      ctx.fillStyle = "#fff"
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

    raf = globalThis.requestAnimationFrame(loop)

    return () => {
      globalThis.removeEventListener("resize", onResize)
      globalThis.removeEventListener("scroll", onScroll)
      globalThis.cancelAnimationFrame(raf)
      accentObserver?.disconnect()
      retargetTl.kill()
      for (const n of nebulas) {
        n.tl?.kill()
        n.driftTween?.kill()
        n.breatheTween?.kill()
      }
      gsap.killTweensOf(nebulas)
      driftTl.kill()
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
