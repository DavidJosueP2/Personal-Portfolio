import {
  AdditiveBlending, BackSide, Color, CubicBezierCurve3, Group, Mesh, PerspectiveCamera, PlaneGeometry, Quaternion, Scene,
  ShaderMaterial, SphereGeometry, SRGBColorSpace, TextureLoader, Vector3, WebGLRenderer,
} from "three"
import type { Texture } from "three"
import { yieldToIdle } from "@/lib/idle-work"
import { createBotanicalWorld, loadWorldTextures, WORLD_SCALE } from "./botanical-world"
import { createWorldWords } from "./world-words"

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const earthFragment = /* glsl */ `
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform sampler2D uSurface;
  uniform vec3 uSun;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec3 detail = texture2D(uSurface, vUv).rgb;
    vec3 normal = normalize(vNormal);
    // Height derivatives give the terrain real lighting without tessellating a height map.
    vec3 dp1 = dFdx(vPosition);
    vec3 dp2 = dFdy(vPosition);
    vec3 r1 = cross(dp2, normal);
    vec3 r2 = cross(normal, dp1);
    float determinant = dot(dp1, r1);
    vec3 gradient = sign(determinant) * (dFdx(detail.r) * r1 + dFdy(detail.r) * r2);
    normal = normalize(abs(determinant) * normal - gradient * 0.0015);

    vec3 view = normalize(cameraPosition - vPosition);
    float sunlight = dot(normal, uSun);
    float dayStrength = smoothstep(-0.19, 0.31, sunlight);
    vec3 albedo = texture2D(uDay, vUv).rgb;
    float cloudShadow = texture2D(uSurface, vUv + vec2(0.0025, -0.0015)).b;
    vec3 day = albedo * (0.13 + max(sunlight, 0.0) * 1.42);
    day *= 1.0 - smoothstep(0.2, 0.95, cloudShadow) * 0.25;
    vec3 night = texture2D(uNight, vUv).rgb * 1.45 + albedo * 0.012;
    vec3 surface = mix(night, day, dayStrength);

    float ocean = 1.0 - smoothstep(0.08, 0.5, detail.g);
    float reflection = pow(max(dot(reflect(-uSun, normal), view), 0.0), 75.0);
    surface += vec3(0.72, 0.86, 1.0) * reflection * ocean * dayStrength * 0.62;

    float fresnel = pow(1.0 - max(dot(normalize(vNormal), view), 0.0), 3.0);
    vec3 atmosphere = mix(vec3(0.6, 0.12, 0.035), vec3(0.075, 0.36, 0.95), smoothstep(-0.25, 0.65, sunlight));
    surface = mix(surface, atmosphere, fresnel * smoothstep(-0.4, 0.85, sunlight) * 0.82);
    gl_FragColor = vec4(surface, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const cloudFragment = /* glsl */ `
  uniform sampler2D uSurface;
  uniform vec3 uSun;
  uniform float uVisibility;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    float clouds = smoothstep(0.22, 0.92, texture2D(uSurface, vUv).b);
    float sunlight = dot(normalize(vNormal), uSun);
    vec3 light = mix(vec3(0.016, 0.028, 0.06), vec3(1.16, 1.2, 1.26), smoothstep(-0.2, 0.65, sunlight));
    gl_FragColor = vec4(light, clouds * 0.94 * uVisibility);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const atmosphereFragment = /* glsl */ `
  uniform vec3 uSun;
  uniform float uVisibility;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vPosition);
    float rim = pow(1.0 - abs(dot(normal, view)), 4.5);
    float sunlight = dot(normal, uSun);
    vec3 light = mix(vec3(0.72, 0.15, 0.035), vec3(0.09, 0.38, 1.0), smoothstep(-0.2, 0.65, sunlight));
    float alpha = rim * smoothstep(-0.42, 0.8, sunlight) * 0.7;
    gl_FragColor = vec4(light, alpha * uVisibility);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const entryFogFragment = /* glsl */ `
  uniform sampler2D uClouds;
  uniform float uPass;
  uniform float uAspect;
  uniform vec3 uSkyFog;
  uniform vec3 uGroundFog;
  varying vec2 vUv;
  void main() {
    // Strata expand at different rates as the camera physically descends.
    vec2 view = vec2((vUv.x - 0.5) * uAspect * 0.5, vUv.y - 0.5);
    vec2 drift = vec2(uPass * 0.07, -uPass * 0.12);
    float nearCloud = texture2D(uClouds, view * mix(0.38, 0.07, uPass) + vec2(0.43, 0.49) + drift).b;
    float farCloud = texture2D(uClouds, view * vec2(-0.34, 0.29) + vec2(0.67, 0.46) - drift * 0.48).b;
    float middleCloud = texture2D(uClouds, view * mix(0.24, 0.12, uPass) + vec2(0.58, 0.54) + drift * 0.7).b;
    float mist = smoothstep(0.04, 0.79, nearCloud * 0.48 + farCloud * 0.35 + middleCloud * 0.4);
    float cover = smoothstep(0.0, 0.35, uPass) * (1.0 - smoothstep(0.64, 1.0, uPass));
    float deepCloud = smoothstep(0.29, 0.4, uPass) * (1.0 - smoothstep(0.59, 0.72, uPass));
    float alpha = max(deepCloud, cover * (0.22 + mist * 0.78));
    vec3 sky = mix(uSkyFog, uGroundFog, smoothstep(0.48, 0.97, uPass));
    sky *= 0.66 + mist * 0.43 + pow(max(0.0, 1.0 - length(view - vec2(-0.3, 0.2))), 4.0) * 0.18;
    gl_FragColor = vec4(sky, alpha);
    #include <colorspace_fragment>
  }
`

function between(progress: number, start: number, end: number) {
  const value = Math.max(0, Math.min(1, (progress - start) / (end - start)))
  return value * value * (3 - 2 * value)
}

export async function createEarthScene(
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
  openingRevealed: Promise<void>,
  acquireContext: () => WebGL2RenderingContext | null,
) {
  if (signal.aborted) return null
  let graphics: WebGLRenderer | undefined
  const mobile = window.innerWidth < 768
  const resources: { dispose(): void }[] = []
  let disposed = false
  const retain = <T extends { dispose(): void }>(resource: T): T => {
    if (disposed) resource.dispose()
    else resources.push(resource)
    return resource
  }
  const dispose = () => {
    if (disposed) return
    disposed = true
    resources.forEach((resource) => resource.dispose())
    graphics?.dispose()
  }

  try {
    const loader = new TextureLoader()
    const resolution = mobile ? 1024 : 2048
    const load = (name: string, color = false) => new Promise<Texture>((resolve, reject) => {
      const texture: Texture = retain(loader.load(`/assets/earth/${name}_${resolution}.webp`, () => resolve(texture), undefined, reject))
      if (color) texture.colorSpace = SRGBColorSpace
    })
    const [day, night, surface, flora] = await Promise.all([
      load("earth_day", true),
      load("earth_night", true),
      load("earth_bump_roughness_clouds"),
      loadWorldTextures(retain),
      openingRevealed,
    ])
    if (signal.aborted) { dispose(); return null }
    const context = acquireContext()
    if (!context) { dispose(); return null }
    const renderer = graphics = new WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: "high-performance" })
    renderer.setClearColor(0x000000, 0)
    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    for (const texture of [day, night, surface]) texture.anisotropy = anisotropy
    const world = createBotanicalWorld(flora, retain)

    const scene = new Scene()
    const camera = new PerspectiveCamera(38, 1, 0.001, 150)
    const globe = new Group()
    globe.rotation.z = 0.12
    scene.add(globe)
    const landingNormal = new Vector3(0.275, 0.025, 1).normalize()
    const landingPoint = landingNormal.clone().multiplyScalar(1.0005)
    world.root.position.copy(landingPoint)
    world.root.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), landingNormal))
    world.root.scale.setScalar(WORLD_SCALE)
    scene.add(world.root)
    const fromLocal = (local: Vector3, destination: Vector3) => destination.copy(local)
      .multiplyScalar(WORLD_SCALE).applyQuaternion(world.root.quaternion).add(landingPoint)
    const words = createWorldWords(canvas.closest<HTMLElement>("[data-hero-stage]")!, camera, fromLocal)
    world.update(0, 0)
    const entryPosition = fromLocal(world.cameraPosition, new Vector3())
    const entryTarget = fromLocal(world.cameraTarget, new Vector3())
    const descentPath = new CubicBezierCurve3(new Vector3(), new Vector3(), new Vector3(), entryPosition)
    const geometry = retain(new SphereGeometry(1, mobile ? 64 : 96, mobile ? 48 : 64))
    const sun = { value: new Vector3(-1.4, 0.9, 1.7).normalize() }
    const material = (fragmentShader: string, uniforms: Record<string, { value: unknown }>, transparent = false) => retain(new ShaderMaterial({
      vertexShader, fragmentShader, uniforms: { uSun: sun, ...uniforms }, transparent,
      depthWrite: !transparent,
    }))
    globe.add(new Mesh(geometry, material(earthFragment, {
      uDay: { value: day }, uNight: { value: night }, uSurface: { value: surface },
    })))
    const cloudVisibility = { value: 1 }
    const airVisibility = { value: 1 }
    const clouds = new Mesh(geometry, material(cloudFragment, { uSurface: { value: surface }, uVisibility: cloudVisibility }, true))
    clouds.scale.setScalar(1.004)
    clouds.renderOrder = 1
    globe.add(clouds)
    const atmosphereMaterial = material(atmosphereFragment, { uVisibility: airVisibility }, true)
    atmosphereMaterial.side = BackSide
    atmosphereMaterial.blending = AdditiveBlending
    const atmosphere = new Mesh(geometry, atmosphereMaterial)
    atmosphere.scale.setScalar(1.035)
    atmosphere.renderOrder = 2
    globe.add(atmosphere)

    const fogMaterial = retain(new ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
      `,
      fragmentShader: entryFogFragment,
      uniforms: {
        uClouds: { value: surface }, uPass: { value: 0 }, uAspect: { value: 1 },
        uSkyFog: { value: new Color("#8ca9ad") }, uGroundFog: { value: new Color("#142b2b") },
      },
      transparent: true, depthTest: false, depthWrite: false,
    }))
    const entryFog = new Mesh(retain(new PlaneGeometry(2, 2)), fogMaterial)
    entryFog.frustumCulled = false
    entryFog.renderOrder = 100
    scene.add(entryFog)

    let orbitDistance = 4
    const target = new Vector3()
    const up = new Vector3(0, 1, 0)
    let lastProgress = 0
    let lastElapsed = 0
    let lastDeparting = false
    let hasFrame = false
    const resize = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (!width || !height) return
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 768 ? 1.25 : 1.5, Math.sqrt(1_850_000 / (width * height))))
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      world.resize(camera.aspect)
      words.resize()
      fogMaterial.uniforms.uAspect.value = camera.aspect
      camera.updateProjectionMatrix()
      // The whole globe fits the narrower dimension on phones and wide monitors alike.
      const frame = 0.70 * Math.min(1, camera.aspect) * Math.tan(38 * Math.PI / 360)
      orbitDistance = Math.sqrt(1 + 1 / (frame * frame))
      descentPath.v0.set(0, 0.11, orbitDistance)
      descentPath.v1.set(0.04, 0.08, orbitDistance * 0.72)
      descentPath.v2.copy(landingNormal).multiplyScalar(1.23)
      descentPath.v2.y -= 0.09
    }
    resize()
    world.root.visible = true
    await renderer.compileAsync(scene, camera)
    if (signal.aborted) { dispose(); return null }
    const textures = [day, night, surface, ...world.textures]
    for (let index = 0; index < textures.length; index += 3) {
      await yieldToIdle()
      if (signal.aborted) { dispose(); return null }
      for (const texture of textures.slice(index, index + 3)) renderer.initTexture(texture)
    }
    world.root.visible = false

    const draw = (progress: number, elapsed: number, departing = false) => {
      if (disposed) return
      hasFrame = true
      lastProgress = progress
      lastElapsed = elapsed
      lastDeparting = departing
      const arrival = between(progress, 0.245, 0.385)
      const approach = between(progress, 0.39, 0.58)
      const groundProgress = Math.max(0, Math.min(1, (progress - 0.58) / 0.4))
      const lens = between(progress, 0.5, 0.65)
      const fov = 38 + lens * (camera.aspect < 1 ? 14 : 10)
      const near = 0.001 * (1 - lens) + 0.00001 * lens
      if (Math.abs(camera.fov - fov) > 0.001 || Math.abs(camera.near - near) > 0.000001) {
        camera.fov = fov
        camera.near = near
        camera.updateProjectionMatrix()
      }

      world.root.visible = progress > 0.55
      if (world.root.visible) world.update(groundProgress, elapsed)
      if (progress < 0.39) {
        camera.position.set(0, 0.11, orbitDistance * (5.2 - arrival * 4.2))
        target.set(0, 0, 0)
      } else if (progress < 0.58) {
        descentPath.getPoint(approach, camera.position)
        target.copy(entryTarget).multiplyScalar(approach)
      } else {
        fromLocal(world.cameraPosition, camera.position)
        fromLocal(world.cameraTarget, target)
      }
      camera.up.copy(up).lerp(landingNormal, between(progress, 0.49, 0.61)).normalize()
      camera.lookAt(target)
      globe.rotation.y = -0.26 + between(progress, 0.27, 0.46) * 0.15
      clouds.rotation.y = elapsed * 0.006
      cloudVisibility.value = 1 - between(progress, 0.47, 0.58)
      airVisibility.value = 1 - between(progress, 0.48, 0.59)
      globe.visible = progress < 0.635
      entryFog.visible = progress > 0.46 && progress < 0.67
      fogMaterial.uniforms.uPass.value = Math.max(0, Math.min(1, (progress - 0.46) / 0.21))
      renderer.render(scene, camera)
      words.update(progress, elapsed, !departing)
    }

    return {
      resize() { resize(); if (hasFrame) draw(lastProgress, lastElapsed, lastDeparting) },
      dispose,
      draw,
      drawDeparture(progress: number, elapsed: number) {
        draw(0.385 - between(progress, 0.015, 0.81) * 0.14, elapsed, true)
      },
    }
  } catch (error) {
    dispose()
    if (!signal.aborted) throw error
    return null
  }
}
