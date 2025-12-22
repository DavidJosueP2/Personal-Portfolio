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
  hueShift: number
  twinkleCurve: number
}

// --- Nebula sprites (small, layered, GSAP animated) -------------------------

// Fewer, larger, rounder blobs ("universe clouds")
const NEBULA_COUNT = 8 // 5..8 recommended
const MAX_OPACITY = 0.3
const MIN_OPACITY = 0.25
const MOVE_RANGE: [number, number] = [260, 820] // px (min..max)
const BLUR_RANGE: [number, number] = [38, 98] // px (min..max)

type NebulaLayer = 0 | 1 | 2

type NebulaSprite = {
  id: number
  layer: NebulaLayer

  // animated values (GSAP mutates these)
  x: number
  y: number
  opacity: number
  driftX: number
  driftY: number
  scale: number
  rot: number

  // elliptical + organic shaping
  stretchX: number
  stretchY: number

  // static-ish parameters (re-generated on respawn)
  blurPx: number
  radius: number // base draw radius (before scale)
  moveRange: number
  moveDuration: number
  fadeDuration: number
  tintMix: number

  alive: boolean
  tl?: gsap.core.Timeline
  driftTween?: gsap.core.Tween
  breatheTween?: gsap.core.Tween
  respawnCall?: gsap.core.Tween
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

function vignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.globalCompositeOperation = "source-over"
  ctx.globalAlpha = 1
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.12, w / 2, h / 2, h * 0.8)
  vg.addColorStop(0, "rgba(0,0,0,0)")
  vg.addColorStop(1, "rgba(0,0,0,0.82)")
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)
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
  const fadeDuration = rand(16, 44)

  // Position: controlled spawn (zone-based) to avoid central clustering.
  const pad = 40
  const x = clamp(spawn?.x ?? rand(pad, Math.max(pad + 1, vp.width - pad)), pad, Math.max(pad + 1, vp.width - pad))
  const y = clamp(spawn?.y ?? rand(pad, Math.max(pad + 1, vp.height - pad)), pad, Math.max(pad + 1, vp.height - pad))

  // accent dominates, keep a little white
  const tintMix = rand(0.9, 1)

  // Avoid very oval ratios: keep scaleX/scaleY close (round blob)
  const sx = rand(0.85, 1.18) * (n.layer === 0 ? 1.04 : 1)
  const sy = rand(0.85, 1.18) * (n.layer === 0 ? 1.04 : 1)

  n.radius = baseRadius
  n.blurPx = blurPx
  n.moveRange = moveRange
  n.moveDuration = moveDuration
  n.fadeDuration = fadeDuration
  n.tintMix = tintMix

  n.stretchX = sx
  n.stretchY = sy
  n.rot = rand(0, Math.PI * 2)

  n.x = x
  n.y = y
  n.driftX = 0
  n.driftY = 0
  n.scale = rand(0.82, 1.12)
  n.opacity = opMin
  n.alive = true

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
  n.respawnCall?.kill()

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
    sprites: HTMLCanvasElement[],
    nebulas: NebulaSprite[],
    tint: RGB,
    parallaxOffset: { x: number; y: number }
) {
  ctx.save()
  ctx.globalCompositeOperation = "screen"

  const layers: NebulaLayer[] = [0, 1, 2]
  for (const layer of layers) {
    const lf = layerFactors(layer)
    for (const n of nebulas) {
      if (n.layer !== layer) continue
      if (n.opacity <= 0.0005) continue

      const x = n.x + parallaxOffset.x * lf.parallax
      const y = n.y + parallaxOffset.y * lf.parallax

      const rBase = n.radius * n.scale
      const rx = rBase * n.stretchX
      const ry = rBase * n.stretchY

      const pad = 260
      if (x + rx < -pad || x - rx > vp.width + pad || y + ry < -pad || y - ry > vp.height + pad) continue

      // accent dominates
      const mix = n.tintMix
      const rr = Math.round(255 * (1 - mix) + tint.r * mix)
      const gg = Math.round(255 * (1 - mix) + tint.g * mix)
      const bb = Math.round(255 * (1 - mix) + tint.b * mix)

      ctx.filter = `blur(${Math.round(n.blurPx)}px)`
      ctx.globalAlpha = clamp(n.opacity, 0, 1)

      const sprite = sprites[layer]

      // draw as rotated ellipse by transforming context (cheap: transform + drawImage)
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(n.rot)
      ctx.scale(rx / rBase, ry / rBase)

      const size = rBase * 2
      ctx.globalCompositeOperation = "screen"
      ctx.fillStyle = `rgba(${rr},${gg},${bb},1)`
      ctx.drawImage(sprite, -rBase, -rBase, size, size)

      if (layer === 2) {
        ctx.globalAlpha = clamp(n.opacity * 0.45, 0, 1)
        ctx.filter = `blur(${Math.round(n.blurPx * 0.7)}px)`
        ctx.drawImage(sprite, -rBase * 0.92, -rBase * 0.92, size * 0.92, size * 0.92)
      }

      ctx.restore()
    }
  }

  ctx.filter = "none"
  ctx.globalAlpha = 1
  ctx.restore()
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
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Force visible stacking context even if Tailwind class isn't generated.
    canvas.style.position = "absolute"
    canvas.style.inset = "0"

    // Hint the browser: we only animate transform-ish values and opacity.
    canvas.style.willChange = "transform, opacity"

    let raf = 0
    let vp = resizeCanvasToViewport(canvas, ctx)

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
      // slightly more stars, but keep them crisp
      stars: 760,
      // core radii (the dot), glow is computed separately
      starRadiusMin: 0.5,
      starRadiusMax: 1.35,
      // glow tuning
      glowMin: 1.1,
      glowMax: 2.6,
      auraStrength: 0.42,
      // Nebula underlay
      enableNebula: true,
      // keep a clean frame (no stars/noise hugging the viewport edges)
      edgeMargin: 28,
    }

    // Accent-aware tint cache (keeps the nebula/stars synced with the selected accent)
    let accentTint: RGB = getAccentTint(document.documentElement.dataset.accent)
    const updateAccentTint = () => {
      accentTint = getAccentTint(document.documentElement.dataset.accent)
    }

    // Ensure initial tint picks up any late-applied CSS variables.
    updateAccentTint()

    const accentObserver: MutationObserver | null =
        globalThis.MutationObserver === undefined
            ? null
            : new MutationObserver(() => updateAccentTint())

    accentObserver?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-accent", "style", "class"],
    })

    const stars: Star[] = []
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
      s.hueShift = rand(-10, 10)
      // a bit tighter curves to avoid long "always on" states
      s.twinkleCurve = rand(1.35, 2.6)
    }

    for (let i = 0; i < style.stars; i++) {
      const s = {
        x: 0,
        y: 0,
        z: 0,
        r: 1,
        baseAlpha: 0.2,
        maxAlpha: 0.85,
        twinkleSpeed: 1,
        twinklePhase: 0,
        hueShift: 0,
        twinkleCurve: 2.2,
      } satisfies Star
      resetStar(s, true)
      stars.push(s)
    }

    // Nebula sprites (few, large blobs)
    const spriteCanvases = [
      makeNebulaSpriteCanvas(256),
      makeNebulaSpriteCanvas(256),
      makeNebulaSpriteCanvas(256),
    ]

    const nebulas: NebulaSprite[] = Array.from({ length: NEBULA_COUNT }, (_, i) => {
      const layer = layerForIndex(i)
      return {
        id: i,
        layer,
        x: 0,
        y: 0,
        opacity: MIN_OPACITY,
        driftX: 0,
        driftY: 0,
        scale: 1,
        rot: 0,
        stretchX: 1,
        stretchY: 1,
        blurPx: 60,
        radius: 280,
        moveRange: 420,
        moveDuration: 34,
        fadeDuration: 26,
        tintMix: 0.92,
        alive: true,
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
        startNebulaAnimation(n, vp, () => ({ opMax, opMin }), target, getCohortPull)
      }
    }

    const onResize = () => {
      vp = resizeCanvasToViewport(canvas, ctx)

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
      scroll.lastY = y
      scroll.lastInputTs = performance.now()
      // More sensitive: small scroll produces noticeable forward/back travel
      scroll.targetVelocity = clamp(dy * 0.12, -14, 14)
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

    let t0 = performance.now()

    const drawStar = (s: Star, time: number, zSpeed: number, forward: number, tint: RGB) => {
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

      // Slight tint (mostly white)
      const mix = 0.06 + (1 - s.z) * 0.12
      const sr = Math.round(255 * (1 - mix) + tint.r * mix)
      const sg = Math.round(255 * (1 - mix) + tint.g * mix)
      const sb = Math.round(255 * (1 - mix) + tint.b * mix)

      // --- Visual redesign: small sharp core + large diffuse aura --------------
      // NOTE: We do NOT change motion/twinkle logic; only how the star is painted.

      // Keep the core tiny and crisp.
      const coreR = clamp(
          s.r * (0.42 + (1 - s.z) * 0.72) * (0.85 + intensity * 0.25),
          0.35,
          1.45
      )

      // Big, smoky aura that extends well beyond the core.
      const auraR = clamp(coreR * (7.5 + (1 - s.z) * 7.5), coreR * 5.5, coreR * 18)
      const hazeR = clamp(auraR * 1.35, auraR * 1.15, auraR * 1.65)
      const sparkleR = clamp(coreR * 2.8, coreR * 2.2, coreR * 4.2)

      // Very wide, soft haze (smoke-like)
      ctx.save()
      ctx.globalCompositeOperation = "lighter"

      const haze = ctx.createRadialGradient(sx, sy, 0, sx, sy, hazeR)
      haze.addColorStop(0, `rgba(${sr},${sg},${sb},${alpha * (style.auraStrength * 0.22)})`)
      haze.addColorStop(0.12, `rgba(${sr},${sg},${sb},${alpha * (style.auraStrength * 0.12)})`)
      haze.addColorStop(0.38, `rgba(${sr},${sg},${sb},${alpha * (style.auraStrength * 0.06)})`)
      haze.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = haze
      ctx.beginPath()
      ctx.arc(sx, sy, hazeR, 0, Math.PI * 2)
      ctx.fill()

      // Tighter aura (still very soft)
      const aura = ctx.createRadialGradient(sx, sy, 0, sx, sy, auraR)
      aura.addColorStop(0, `rgba(${sr},${sg},${sb},${alpha * (style.auraStrength * 0.55)})`)
      aura.addColorStop(0.18, `rgba(${sr},${sg},${sb},${alpha * (style.auraStrength * 0.18)})`)
      aura.addColorStop(0.55, `rgba(${sr},${sg},${sb},${alpha * (style.auraStrength * 0.06)})`)
      aura.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = aura
      ctx.beginPath()
      ctx.arc(sx, sy, auraR, 0, Math.PI * 2)
      ctx.fill()

      // Soft bloom right around the core (gives "sparkle" without hard edges)
      const sparkle = ctx.createRadialGradient(sx, sy, 0, sx, sy, sparkleR)
      sparkle.addColorStop(0, `rgba(255,255,255,${alpha * 0.36})`)
      sparkle.addColorStop(0.32, `rgba(255,255,255,${alpha * 0.08})`)
      sparkle.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = sparkle
      ctx.beginPath()
      ctx.arc(sx, sy, sparkleR, 0, Math.PI * 2)
      ctx.fill()

      // Crisp core
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = `rgba(${sr},${sg},${sb},${alpha})`
      ctx.beginPath()
      ctx.arc(sx, sy, coreR, 0, Math.PI * 2)
      ctx.fill()

      // Tiny highlight offset (makes it read less like a flat circle)
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.6})`
      ctx.beginPath()
      ctx.arc(sx - coreR * 0.18, sy - coreR * 0.22, Math.max(0.25, coreR * 0.28), 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()

      // Keep existing streak behavior
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

        ctx.strokeStyle = `rgba(${sr},${sg},${sb},${alpha * 0.28})`
        ctx.lineWidth = Math.max(0.5, coreR * 0.55)
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(ex, ey)
        ctx.stroke()
      }
    }

    const drawFrame = (time: number, dt: number) => {
      const tint = accentTint

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

      ctx.clearRect(0, 0, vp.width, vp.height)
      ctx.fillStyle = "rgb(0,0,0)"
      ctx.fillRect(0, 0, vp.width, vp.height)

      const bg = ctx.createRadialGradient(
          vp.width / 2,
          vp.height / 2,
          0,
          vp.width / 2,
          vp.height / 2,
          Math.max(vp.width, vp.height) * 0.7
      )
      bg.addColorStop(0, "rgba(10,10,16,1)")
      bg.addColorStop(1, "rgba(0,0,0,1)")
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, vp.width, vp.height)

      // Nebula sprites (many small blobs)
      if (style.enableNebula) {
        const par = scroll.zTravel * 0.65
        const parallaxOffset = {
          x: ambient.driftX * 0.95 - par * 0.04,
          y: ambient.driftY * 0.95 - par * 0.035,
        }
        drawNebulaSprites(ctx, vp, spriteCanvases, nebulas, tint, parallaxOffset)
        vignette(ctx, vp.width, vp.height)
      }

      for (const s of stars) {
        drawStar(s, time, zSpeed, forward, tint)
      }

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

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - t0) / 1000)
      t0 = t
      drawFrame(t, dt)
      raf = globalThis.requestAnimationFrame(loop)
    }

    onScroll()
    raf = globalThis.requestAnimationFrame(loop)

    return () => {
      globalThis.removeEventListener("resize", onResize)
      globalThis.removeEventListener("scroll", onScroll)
      globalThis.cancelAnimationFrame(raf)
      accentObserver?.disconnect()
      retargetTl.kill()
      for (const n of nebulas) {
        n.alive = false
        n.tl?.kill()
        n.driftTween?.kill()
        n.breatheTween?.kill()
        n.respawnCall?.kill()
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
