import { gsap } from "gsap"
import {
  CanvasTexture, DirectionalLight, HemisphereLight, MathUtils, Mesh, MeshStandardMaterial,
  OrthographicCamera, Scene, SphereGeometry, SRGBColorSpace, WebGLRenderer,
} from "three"

function makeSurface() {
  const width = 768
  const height = 384
  const colorCanvas = document.createElement("canvas")
  const bumpCanvas = document.createElement("canvas")
  colorCanvas.width = bumpCanvas.width = width
  colorCanvas.height = bumpCanvas.height = height
  const colorContext = colorCanvas.getContext("2d")!
  const bumpContext = bumpCanvas.getContext("2d")!
  const color = colorContext.createImageData(width, height)
  const bump = bumpContext.createImageData(width, height)
  const longitudes = Array.from({ length: width }, (_, column) => {
    const angle = ((column + 0.5) / width) * 2 * Math.PI
    return [Math.cos(angle), Math.sin(angle)]
  })
  let seed = 1823

  // Paint the recessed channels in spherical coordinates so they meet across the UV seam.
  for (let row = 0; row < height; row++) {
    const latitude = ((row + 0.5) / height) * Math.PI
    const y = Math.cos(latitude)
    const ring = Math.sin(latitude)
    const beadY = (row % 5 + 0.5) / 5 - 0.5
    for (let column = 0; column < width; column++) {
      const [cosine, sine] = longitudes[column]
      const channel = Math.min(Math.abs(y), Math.abs(sine * ring), Math.abs(Math.abs(cosine * ring) - 0.69 * ring * ring))
      const leather = MathUtils.smoothstep(channel, 0.014, 0.024)
      const beadX = ((column + Math.floor(row / 5) % 2 * 3) % 6 + 0.5) / 6 - 0.5
      const pebble = 1 - MathUtils.smoothstep(beadX * beadX + beadY * beadY, 0.025, 0.23)
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      const grain = (seed >>> 28) - 7
      const offset = (row * width + column) * 4
      color.data[offset] = MathUtils.lerp(40, 218 + pebble * 17 + grain, leather)
      color.data[offset + 1] = MathUtils.lerp(23, 83 + pebble * 11 + grain, leather)
      color.data[offset + 2] = MathUtils.lerp(19, 28 + pebble * 5 + grain, leather)
      color.data[offset + 3] = 255
      const depth = MathUtils.lerp(28, 144 + pebble * 64 + grain, leather)
      bump.data[offset] = bump.data[offset + 1] = bump.data[offset + 2] = depth
      bump.data[offset + 3] = 255
    }
  }

  colorContext.putImageData(color, 0, 0)
  bumpContext.putImageData(bump, 0, 0)
  const map = new CanvasTexture(colorCanvas)
  map.colorSpace = SRGBColorSpace
  return { map, bumpMap: new CanvasTexture(bumpCanvas) }
}

function createModel(canvas: HTMLCanvasElement) {
  // The cursor reads the canvas alpha after a frame has rendered.
  const context = canvas.getContext("webgl2", { alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: "low-power" })
  if (!context) return

  const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true, preserveDrawingBuffer: true })
  renderer.setClearColor(0, 0)
  const scene = new Scene()
  const camera = new OrthographicCamera(-1.065, 1.065, 1.065, -1.065, 0.1, 10)
  camera.position.z = 4

  const { map, bumpMap } = makeSurface()
  const geometry = new SphereGeometry(1, 52, 36)
  const material = new MeshStandardMaterial({ map, bumpMap, bumpScale: 0.035, roughness: 0.57 })
  const ball = new Mesh(geometry, material)
  const main = new DirectionalLight(0xffedd6, 2.6)
  main.position.set(-2.5, 4, 4)
  const rim = new DirectionalLight(0xff9b68, 1.45)
  rim.position.set(3, 1, -3)
  scene.add(ball, main, rim, new HemisphereLight(0xfff1df, 0x53312b, 1.32))

  let size = 0
  let resolution = 0
  return {
    draw(spin: number) {
      const nextSize = canvas.clientWidth
      if (!nextSize || context.isContextLost()) return false
      const nextResolution = Math.min(2, window.devicePixelRatio || 1)
      if (size !== nextSize || resolution !== nextResolution) {
        size = nextSize
        resolution = nextResolution
        renderer.setPixelRatio(resolution)
        renderer.setSize(size, size, false)
      }
      ball.rotation.set(-0.34 + Math.sin(spin) * 0.22, 0.83 + spin, 0.3 + spin * 0.32)
      renderer.render(scene, camera)
      return true
    },
    dispose() {
      geometry.dispose()
      material.dispose()
      map.dispose()
      bumpMap.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}

export function connectBasketball(button: HTMLButtonElement, canvas: HTMLCanvasElement) {
  const model = createModel(canvas)
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
  const pose = { lift: 0, squash: 0, spin: 0 }
  let motion: gsap.core.Timeline | undefined
  let visible = false
  let introduced = false

  const draw = () => {
    const painted = model?.draw(pose.spin) ?? false
    button.toggleAttribute("data-basketball-ready", painted)
    button.style.setProperty("--basketball-lift", `${pose.lift * 100}%`)
    button.style.setProperty("--basketball-squash", String(pose.squash))
    button.style.setProperty("--basketball-shadow-scale", String(1 + pose.lift * 0.9))
    button.style.setProperty("--basketball-shadow-opacity", String(1 - pose.lift * 1.6))
    button.style.setProperty("--basketball-turn", `${pose.spin * 36}deg`)
  }

  const settle = () => {
    motion?.kill()
    motion = undefined
    pose.lift = 0
    pose.squash = 0
    if (visible && !document.hidden) draw()
  }

  const bounce = (height: number, spin: number) => {
    if (document.hidden) return
    if (preference.matches) {
      pose.spin += spin * 0.23
      draw()
      return
    }

    motion?.kill()
    motion = gsap.timeline({ onUpdate: draw })
      .to(pose, { lift: height, squash: 0, duration: 0.24, ease: "power2.out" }, 0)
      .to(pose, { lift: 0, duration: 0.22, ease: "power2.in" }, 0.24)
      .to(pose, { squash: height * 0.3, duration: 0.055, ease: "power1.out" }, 0.44)
      .to(pose, { lift: height * 0.22, squash: 0, duration: 0.105, ease: "power2.out" }, 0.495)
      .to(pose, { lift: 0, duration: 0.12, ease: "power2.in" }, 0.6)
      .to(pose, { spin: pose.spin + spin, duration: 0.72, ease: "power2.out" }, 0)
  }

  const onClick = () => {
    const bounds = button.getBoundingClientRect()
    if (bounds.width && bounds.bottom > 0 && bounds.top < window.innerHeight) bounce(0.31, 2.45)
  }
  const onPointerEnter = (event: PointerEvent) => {
    if (visible && event.pointerType === "mouse" && !preference.matches && !motion?.isActive()) bounce(0.13, 0.72)
  }
  const onResize = () => { if (visible && !document.hidden) draw() }
  const onCanvasLost = (event: Event) => {
    event.preventDefault()
    button.removeAttribute("data-basketball-ready")
  }
  const resize = new ResizeObserver(onResize)
  resize.observe(canvas)
  button.addEventListener("click", onClick)
  button.addEventListener("pointerenter", onPointerEnter)
  canvas.addEventListener("webglcontextlost", onCanvasLost)
  canvas.addEventListener("webglcontextrestored", onResize)
  preference.addEventListener("change", settle)
  document.addEventListener("visibilitychange", settle)

  return {
    setVisible(next: boolean) {
      visible = next
      if (!visible) { settle(); return }
      onResize()
      if (!introduced && !preference.matches) bounce(0.16, 0.9)
      introduced = true
    },
    dispose() {
      settle()
      resize.disconnect()
      button.removeEventListener("click", onClick)
      button.removeEventListener("pointerenter", onPointerEnter)
      canvas.removeEventListener("webglcontextlost", onCanvasLost)
      canvas.removeEventListener("webglcontextrestored", onResize)
      preference.removeEventListener("change", settle)
      document.removeEventListener("visibilitychange", settle)
      model?.dispose()
      button.removeAttribute("data-basketball-ready")
    },
  }
}
