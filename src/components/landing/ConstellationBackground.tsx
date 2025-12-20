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

type NebulaFieldBlob = {
  x: number
  y: number
  r: number
  a: number
  hue: "cool" | "warm"
  ox: number
  oy: number
  phase: number
  freq: number
  pulse: number
  vx: number
  vy: number
  life: number // 0..1
  lifeDir: 1 | -1
}

function makeNebulaField(count: number): NebulaFieldBlob[] {
  return Array.from({ length: count }, () => ({
    // keep blobs more centered to avoid side columns
    x: rand(-900, 900),
    y: rand(-700, 700),
    ox: rand(-260, 260),
    oy: rand(-220, 220),
    r: rand(220, 640),
    a: rand(0.03, 0.085),
    hue: Math.random() > 0.22 ? "cool" : "warm",
    phase: rand(0, Math.PI * 2),
    freq: rand(0.12, 0.28),
    pulse: rand(0.06, 0.18),
    vx: rand(-0.35, 0.35),
    vy: rand(-0.3, 0.3),
    life: rand(0.35, 1),
    lifeDir: 1,
  }))
}

function respawnNebulaBlob(b: NebulaFieldBlob) {
  // keep respawns centered too
  b.x = rand(-1100, 1100)
  b.y = rand(-900, 900)
  b.ox = rand(-260, 260)
  b.oy = rand(-220, 220)
  b.r = rand(220, 720)
  b.a = rand(0.028, 0.09)
  b.hue = Math.random() > 0.22 ? "cool" : "warm"
  b.phase = rand(0, Math.PI * 2)
  b.freq = rand(0.11, 0.3)
  b.pulse = rand(0.06, 0.2)
  b.vx = rand(-0.4, 0.4)
  b.vy = rand(-0.35, 0.35)
  b.life = 0
  b.lifeDir = 1
}

type RGB = { r: number; g: number; b: number }

function getAccentTint(accent: string | undefined): RGB {
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
    default:
      return { r: 0, g: 255, b: 170 }
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

    let raf = 0
    let vp = resizeCanvasToViewport(canvas, ctx)

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
      // IMPORTANT: disable nebula to remove side patterns/columns
      enableNebula: false,
      // keep a clean frame (no stars/noise hugging the viewport edges)
      edgeMargin: 28,
    }

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

    const nebula = {
      // fewer blobs -> less chance of noticeable side patterns/columns
      blobs: makeNebulaField(12),
      driftX: rand(-700, 700),
      driftY: rand(-700, 700),
    }

    const onResize = () => {
      vp = resizeCanvasToViewport(canvas, ctx)
      // Re-spread stars to fit new viewport
      for (const s of stars) resetStar(s, true)
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

    // Subtle ambient drift via GSAP ticker-like feel (but use RAF); GSAP only for easing constants if desired.
    const ambient = { driftX: 0, driftY: 0 }
    const driftTl = gsap
      .timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } })
      .to(ambient, { driftX: 18, driftY: -12, duration: 6 })
      .to(ambient, { driftX: -14, driftY: 10, duration: 6 })

    let t0 = performance.now()

    const updateNebula = (baseX: number, baseY: number, attractX: number, attractY: number, idlePhase: number, dt: number) => {
      const step = Math.min(2.2, dt * 60)

      for (const b of nebula.blobs) {
        updateBlobLifecycle(b, step)
        updateBlobMotion(b, baseX, baseY, attractX, attractY, idlePhase, step)
      }

      maybeMergeSplit(nebula.blobs, step)
    }

    const renderNebula = (tint: RGB, baseX: number, baseY: number, idlePhase: number) => {
      ctx.save()
      ctx.globalCompositeOperation = "screen"

      for (const b of nebula.blobs) {
        const wob = Math.sin(idlePhase * b.freq + b.phase)
        const wob2 = Math.cos(idlePhase * (b.freq * 0.85) + b.phase)

        const x = baseX + b.x + b.ox * wob * 0.25
        const y = baseY + b.y + b.oy * wob2 * 0.25

        const life = clamp(b.life, 0, 1)
        const pr = b.r * (0.85 + wob * b.pulse) * (0.65 + life * 0.55)
        const a = b.a * (0.15 + life * 0.95)

        if (x + pr < -260 || x - pr > vp.width + 260 || y + pr < -260 || y - pr > vp.height + 260) continue

        const g = ctx.createRadialGradient(x, y, 0, x, y, pr)
        if (b.hue === "cool") {
          g.addColorStop(0, `rgba(${tint.r},${tint.g},${tint.b},${a})`)
          g.addColorStop(0.55, `rgba(${tint.r},${tint.g},${tint.b},${a * 0.22})`)
          g.addColorStop(1, "rgba(0,0,0,0)")
        } else {
          g.addColorStop(0, `rgba(255,180,120,${a * 0.62})`)
          g.addColorStop(0.6, `rgba(255,180,120,${a * 0.16})`)
          g.addColorStop(1, "rgba(0,0,0,0)")
        }

        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, pr, 0, Math.PI * 2)
        ctx.fill()
      }

      vignette(ctx, vp.width, vp.height)
      ctx.restore()
    }

    const drawNebula = (tint: RGB, dt: number, idlePhase: number) => {
      const cx = vp.width / 2
      const cy = vp.height / 2
      const anchorY = -vp.height * 0.48
      const par = scroll.zTravel * 0.65

      // Pull the nebula towards center; avoid big lateral offsets.
      const baseX = cx + ambient.driftX * 0.85 + nebula.driftX * 0.75 - par * 0.07
      const baseY = cy + anchorY + ambient.driftY * 0.85 + nebula.driftY * 0.75 - par * 0.06

      const attractX = baseX + Math.cos(idlePhase * 0.45) * 220 + Math.sin(idlePhase * 0.9) * 70
      const attractY = baseY + Math.sin(idlePhase * 0.42) * 170 + Math.cos(idlePhase * 0.8) * 60

      updateNebula(baseX, baseY, attractX, attractY, idlePhase, dt)
      renderNebula(tint, baseX, baseY, idlePhase)
    }

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

      // Twinkle: should reach fully off (0) and fully on (1), but smooth.
      // We shape a sine and then add per-star curve.
      const tw = (Math.sin(time * 0.001 * s.twinkleSpeed + s.twinklePhase) + 1) / 2 // 0..1
      const shaped = Math.pow(tw, s.twinkleCurve)

      // Let it go to almost 0 sometimes, but keep per-star max cap.
      // Also keep variety: some stars never get extremely bright.
      const intensity = clamp(shaped, 0, 1)

      // Per-star peak & floor
      const alphaStar = lerp(0, s.maxAlpha, intensity)
      const alphaFloor = s.baseAlpha * (1 - intensity) // gives some dim persistence on some stars
      // Close stars appear stronger overall
      const depth = 0.28 + (1 - s.z) * 0.72
      const alpha = clamp((alphaStar + alphaFloor) * depth, 0, 1)

      // Slight tint (mostly white)
      const mix = 0.06 + (1 - s.z) * 0.12
      const sr = Math.round(255 * (1 - mix) + tint.r * mix)
      const sg = Math.round(255 * (1 - mix) + tint.g * mix)
      const sb = Math.round(255 * (1 - mix) + tint.b * mix)

      // Core dot size: keep crisp
      const core = clamp(
        s.r * (0.55 + (1 - s.z) * 0.95) * (0.88 + intensity * 0.18),
        0.5,
        1.85
      )

      // Aura: small + subtle, but clearly present like the reference
      const innerGlow = clamp(core * (1.15 + (1 - s.z) * 0.55), core * 1.1, core * 2.2)
      const outerGlow = clamp(core * (1.9 + (1 - s.z) * 1.25), innerGlow * 1.25, core * 4.2)

      // soft aura behind the dot
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, outerGlow)
      g.addColorStop(0, `rgba(${sr},${sg},${sb},${alpha * style.auraStrength})`)
      g.addColorStop(0.18, `rgba(${sr},${sg},${sb},${alpha * (style.auraStrength * 0.22)})`)
      g.addColorStop(0.45, `rgba(${sr},${sg},${sb},${alpha * (style.auraStrength * 0.08)})`)
      g.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(sx, sy, outerGlow, 0, Math.PI * 2)
      ctx.fill()

      // tiny inner diffusion (keeps it from looking like only a flat dot)
      const ring = ctx.createRadialGradient(sx, sy, 0, sx, sy, innerGlow)
      ring.addColorStop(0, `rgba(255,255,255,${alpha * 0.16})`)
      ring.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = ring
      ctx.beginPath()
      ctx.arc(sx, sy, innerGlow, 0, Math.PI * 2)
      ctx.fill()

      // core point
      ctx.fillStyle = `rgba(${sr},${sg},${sb},${alpha})`
      ctx.beginPath()
      ctx.arc(sx, sy, core, 0, Math.PI * 2)
      ctx.fill()

      // Micro-highlight to make the core feel "hot" (subtle)
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.35})`
      ctx.beginPath()
      ctx.arc(sx - core * 0.15, sy - core * 0.18, core * 0.35, 0, Math.PI * 2)
      ctx.fill()

      // Warp streaks when moving fast: draw away from center
      // NOTE: Don't draw streaks on wrap frames, and keep the endpoint inside the viewport.
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
        ctx.lineWidth = Math.max(0.5, core * 0.55)
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(ex, ey)
        ctx.stroke()
      }
    }

    const drawStars = (time: number, dt: number) => {
      const tint = getAccentTint(document.documentElement.dataset.accent)

      // ease velocity
      scroll.velocity = lerp(scroll.velocity, scroll.targetVelocity, 0.11)

      // Auto-brake: if no scroll input recently, return target speed back to idle smoothly.
      // This prevents getting stuck in "interstellar travel" after a fast swipe.
      const idleTarget = 0
      const since = performance.now() - scroll.lastInputTs
      if (since > 140) {
        // decay faster after the first ~140ms of no input
        const brake = since > 900 ? 0.085 : 0.045
        scroll.targetVelocity = lerp(scroll.targetVelocity, idleTarget, brake)
        // deadzone snap to avoid micro drift
        if (Math.abs(scroll.targetVelocity) < 0.02) scroll.targetVelocity = 0
      }

      // More "interstellar" depth speed (idle + stronger response)
      const zSpeed = (scroll.velocity * 0.0032 + 0.00034) * (dt * 60)

      // integrate "travel" for nebula parallax
      scroll.zTravel += scroll.velocity * dt * 1.35

      // keep it infinite (prevents huge numbers affecting parallax)
      if (scroll.zTravel > 100000) scroll.zTravel -= 200000
      else if (scroll.zTravel < -100000) scroll.zTravel += 200000

      const forward = clamp(Math.abs(scroll.velocity) / 14, 0, 1)

      // Clear
      ctx.clearRect(0, 0, vp.width, vp.height)
      ctx.fillStyle = "rgb(0,0,0)"
      ctx.fillRect(0, 0, vp.width, vp.height)

      // Slight background gradient so it's not flat black
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

      // Nebula underlay (disabled because it created side patterns)
      if (style.enableNebula) {
        drawNebula(tint, dt, time * 0.001)
      }

      // Stars
      for (const s of stars) {
        drawStar(s, time, zSpeed, forward, tint)
      }

      // Subtle grain (reduced) - avoid drawing on the extreme edges
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
      drawStars(t, dt)
      raf = globalThis.requestAnimationFrame(loop)
    }

    // init
    onScroll()
    raf = globalThis.requestAnimationFrame(loop)

    return () => {
      globalThis.removeEventListener("resize", onResize)
      globalThis.removeEventListener("scroll", onScroll)
      globalThis.cancelAnimationFrame(raf)
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
      {/* overlay removed (it created a visible horizontal/center wash in the hero) */}
    </div>
  )
}

function updateBlobLifecycle(b: NebulaFieldBlob, step: number) {
  const lifeSpeed = 0.0035 + b.freq * 0.002
  b.life += b.lifeDir * lifeSpeed * step
  if (b.life >= 1) {
    b.life = 1
    if (Math.random() < 0.006) b.lifeDir = -1
  } else if (b.life <= 0) {
    respawnNebulaBlob(b)
  }
}

function updateBlobMotion(
  b: NebulaFieldBlob,
  baseX: number,
  baseY: number,
  attractX: number,
  attractY: number,
  idlePhase: number,
  step: number
) {
  const bx = baseX + b.x
  const by = baseY + b.y

  const dx = attractX - bx
  const dy = attractY - by
  const d = Math.max(1, Math.hypot(dx, dy))
  const ux = dx / d
  const uy = dy / d

  const repel = d < 240 ? (240 - d) / 240 : 0
  const attract = d > 260 ? Math.min(1, (d - 260) / 1000) : 0

  const wob = Math.sin(idlePhase * b.freq + b.phase)
  const wob2 = Math.cos(idlePhase * (b.freq * 0.88) + b.phase * 1.7)

  const sx = -uy
  const sy = ux
  const swirl = 0.012 * Math.sin(idlePhase * 0.25 + b.phase)

  b.vx += ux * (0.02 * attract) - ux * (0.032 * repel) + wob * 0.008 + sx * swirl
  b.vy += uy * (0.02 * attract) - uy * (0.032 * repel) + wob2 * 0.008 + sy * swirl

  b.vx *= 0.965
  b.vy *= 0.965

  b.x += b.vx * step
  b.y += b.vy * step

  if (b.x < -1600) b.x = 1600
  if (b.x > 1600) b.x = -1600
  if (b.y < -1300) b.y = 1300
  if (b.y > 1300) b.y = -1300
}

function maybeMergeSplit(blobs: NebulaFieldBlob[], step: number) {
  if (blobs.length < 8) return
  if (Math.random() >= 0.012 * step) return

  const i = Math.floor(rand(0, blobs.length))
  const j = Math.floor(rand(0, blobs.length))
  if (i === j) return

  const a = blobs[i]
  const b = blobs[j]
  const dx = a.x - b.x
  const dy = a.y - b.y
  const d = Math.hypot(dx, dy)
  if (d >= 420) return

  const t = 0.18
  a.x = lerp(a.x, b.x, t)
  a.y = lerp(a.y, b.y, t)
  a.r = clamp(a.r + b.r * 0.12, 180, 820)
  a.a = clamp(a.a + b.a * 0.08, 0.02, 0.12)
  a.lifeDir = 1
  a.life = clamp(a.life + 0.08, 0, 1)

  respawnNebulaBlob(b)
}
