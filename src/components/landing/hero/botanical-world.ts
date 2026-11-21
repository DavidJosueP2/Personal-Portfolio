import {
  CanvasTexture, CatmullRomCurve3, Color, DoubleSide, Group,
  InstancedBufferAttribute, InstancedBufferGeometry, Mesh, PlaneGeometry,
  RepeatWrapping, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector3,
} from "three"
import type { Texture } from "three"
import { paintRandom } from "@/lib/botanical-paint"
import { worldSpecies } from "./world-flora"
import { createWorldSky } from "./world-sky"
import { groundAt, pathAt, terrainShader } from "./world-terrain"
import { createGroundcover } from "./world-groundcover"
import { createPlanting } from "./world-planting"
import { createWorldLanterns, lanternGroundShader, lanternLightAt, lanternPositions } from "./world-lanterns"

export const WORLD_SCALE = 0.0025
type Retain = <T extends { dispose(): void }>(resource: T) => T

const smooth = (value: number, from: number, to: number) => {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)))
  return t * t * (3 - 2 * t)
}

const fogShader = /* glsl */ `
  uniform vec3 uFogColor;
  uniform float uExit;
  varying float vDistance;
  vec3 inMist(vec3 color) {
    float fog = 1.0 - exp(-pow(vDistance * 0.026, 2.0));
    return mix(color, uFogColor, clamp(fog + uExit * 0.35, 0.0, 1.0));
  }
`

const worldVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vLocal;
  varying float vDistance;
  void main() {
    vUv = uv;
    vLocal = position;
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vDistance = length(view.xyz) / ${WORLD_SCALE};
    gl_Position = projectionMatrix * view;
  }
`

const paintings = import.meta.glob<string>("/src/assets/img/garden/*.webp", { eager: true, import: "default" })

export function loadWorldTextures(retain: Retain) {
  // The painted flora is baked from the original brushstrokes. Growth still runs in the world shaders.
  const loader = new TextureLoader()
  return Promise.all(["daisy", "lavender", "poppy", "cup", "open", ...worldSpecies].map(async (kind) => {
    const texture = retain(await loader.loadAsync(paintings[`/src/assets/img/garden/${kind}.webp`]))
    texture.colorSpace = SRGBColorSpace
    return texture
  }))
}

export function createBotanicalWorld(textures: Texture[], retain: Retain) {
  const root = new Group()
  root.visible = false
  const random = paintRandom(1826)
  const time = { value: 0 }
  const exit = { value: 0 }
  const fog = { value: new Color("#142b2b") }
  const night = new Color("#070d0d")
  const horizon = new Color("#142b2b")
  const shared = { uTime: time, uExit: exit, uFogColor: fog }

  const sky = createWorldSky(retain, fog)
  textures.push(sky.texture)
  root.add(sky.mesh)

  const soilCanvas = document.createElement("canvas")
  soilCanvas.width = soilCanvas.height = 512
  const soilPaint = soilCanvas.getContext("2d")!
  soilPaint.fillStyle = "#23392c"
  soilPaint.fillRect(0, 0, 512, 512)
  soilPaint.lineCap = "round"
  const soilRandom = paintRandom(914)
  for (let i = 0; i < 3400; i++) {
    const x = soilRandom() * 512
    const y = soilRandom() * 512
    const length = 3 + soilRandom() * 23
    soilPaint.strokeStyle = i % 3 === 0 ? "rgb(84 100 52 / 0.25)" : "rgb(12 32 24 / 0.4)"
    soilPaint.lineWidth = 0.5 + soilRandom() * 2.3
    soilPaint.beginPath()
    soilPaint.moveTo(x, y)
    soilPaint.quadraticCurveTo(x + length * 0.5, y - 1, x + length, y - 2.5)
    soilPaint.stroke()
  }
  const soil = retain(new CanvasTexture(soilCanvas))
  soil.colorSpace = SRGBColorSpace
  soil.wrapS = soil.wrapT = RepeatWrapping
  textures.push(soil)
  const groundGeometry = retain(new PlaneGeometry(200, 300, 160, 200))
  groundGeometry.rotateX(-Math.PI / 2)
  const groundPosition = groundGeometry.getAttribute("position")
  for (let i = 0; i < groundPosition.count; i++) groundPosition.setY(i, groundAt(groundPosition.getX(i), groundPosition.getZ(i)))
  const ground = new Mesh(groundGeometry, retain(new ShaderMaterial({
    uniforms: { ...shared, uSoil: { value: soil }, uLanterns: { value: lanternPositions } },
    vertexShader: worldVertex,
    fragmentShader: /* glsl */ `
      uniform sampler2D uSoil;
      varying vec3 vLocal;
      ${terrainShader}
      ${fogShader}
      ${lanternGroundShader}
      void main() {
        float patches = sin(vLocal.x * 0.41 + sin(vLocal.z * 0.17) * 2.0) * sin(vLocal.z * 0.36) * 0.5 + 0.5;
        float path = exp(-pow((vLocal.x - pathAt(vLocal.z)) / 1.15, 4.0));
        vec3 color = mix(vec3(0.008, 0.023, 0.019), vec3(0.025, 0.052, 0.035), patches);
        color = mix(color, texture2D(uSoil, vLocal.xz * 0.1).rgb, 0.32);
        color = mix(color, vec3(0.025, 0.028, 0.025), path * 0.9);
        gl_FragColor = vec4(inMist(lanternGround(color, vLocal)), 1.0);
        #include <colorspace_fragment>
      }
    `,
  })))
  root.add(ground)

  const blade = new PlaneGeometry(1, 1, 1, 4)
  blade.translate(0, 0.5, 0)
  const grassGeometry = retain(new InstancedBufferGeometry())
  grassGeometry.index = blade.index?.clone() ?? null
  for (const key of ["position", "uv"]) grassGeometry.setAttribute(key, blade.getAttribute(key).clone())
  blade.dispose()
  const count = window.innerWidth < 768 ? 16000 : 32000
  const roots = new Float32Array(count * 3)
  const shape = new Float32Array(count * 3)
  const lampLight = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const z = random() * 135 - 75
    const side = random() < 0.5 ? -1 : 1
    const x = side * (1.3 + random() ** 1.7 * 15) + pathAt(z)
    const y = groundAt(x, z)
    roots.set([x, y, z], i * 3)
    shape.set([0.018 + random() * 0.048, 0.18 + random() ** 2 * 0.72, random() * Math.PI * 2], i * 3)
    lampLight[i] = lanternLightAt(x, y + 0.36, z)
  }
  grassGeometry.setAttribute("aRoot", new InstancedBufferAttribute(roots, 3))
  grassGeometry.setAttribute("aShape", new InstancedBufferAttribute(shape, 3))
  grassGeometry.setAttribute("aLampLight", new InstancedBufferAttribute(lampLight, 1))
  grassGeometry.instanceCount = count
  const grass = new Mesh(grassGeometry, retain(new ShaderMaterial({
    uniforms: shared, side: DoubleSide,
    vertexShader: /* glsl */ `
      attribute vec3 aRoot;
      attribute vec3 aShape;
      attribute float aLampLight;
      uniform float uTime;
      varying float vHeight;
      varying float vTone;
      varying float vBlade;
      varying float vDistance;
      varying float vLampLight;
      void main() {
        float h = uv.y;
        float turn = aShape.z;
        vec3 p = aRoot;
        float width = position.x * aShape.x * pow(max(0.0, sin(h * 3.14159)), 0.65);
        float breeze = sin(uTime * 0.64 + aRoot.z * 0.18 + aRoot.x * 0.4) * 0.18;
        float bend = (0.25 + breeze) * h * h * aShape.y;
        p += vec3(cos(turn) * width + bend, h * aShape.y, sin(turn) * width + bend * 0.3);
        vHeight = h;
        vTone = sin(turn * 4.0) * 0.5 + 0.5;
        vBlade = uv.x;
        vLampLight = aLampLight;
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        vDistance = length(view.xyz) / ${WORLD_SCALE};
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vHeight;
      varying float vTone;
      varying float vBlade;
      varying float vLampLight;
      ${fogShader}
      void main() {
        vec3 color = mix(vec3(0.015, 0.043, 0.025), vec3(0.15, 0.21, 0.073), vHeight * (0.45 + vTone * 0.5));
        color += vec3(0.012, 0.02, 0.006) * pow(1.0 - abs(vBlade - 0.5) * 2.0, 5.0) * vHeight;
        color += vec3(0.18, 0.085, 0.019) * vLampLight * (0.35 + vHeight * 0.65);
        gl_FragColor = vec4(inMist(color), 1.0);
        #include <colorspace_fragment>
      }
    `,
  })))
  grass.frustumCulled = false
  root.add(grass)

  const planting = createPlanting(retain, textures, random, shared, fogShader, WORLD_SCALE)
  root.add(...planting.meshes)
  root.add(createGroundcover(retain, random, shared, fogShader, WORLD_SCALE))
  root.add(createWorldLanterns(retain, shared, fogShader, WORLD_SCALE))
  const shadowQuad = new PlaneGeometry(1, 1)
  const shadowGeometry = retain(new InstancedBufferGeometry())
  shadowGeometry.index = shadowQuad.index?.clone() ?? null
  for (const key of ["position", "uv"]) shadowGeometry.setAttribute(key, shadowQuad.getAttribute(key).clone())
  shadowQuad.dispose()
  shadowGeometry.setAttribute("aAnchor", new InstancedBufferAttribute(new Float32Array(planting.anchors), 3))
  shadowGeometry.instanceCount = planting.anchors.length / 3
  const shadows = new Mesh(shadowGeometry, retain(new ShaderMaterial({
    uniforms: shared, transparent: true, depthWrite: false,
    vertexShader: /* glsl */ `
      attribute vec3 aAnchor;
      ${terrainShader}
      varying vec2 vUv;
      varying float vDistance;
      void main() {
        vUv = uv;
        float x = aAnchor.x + position.x * aAnchor.z;
        float z = aAnchor.y - position.y * aAnchor.z;
        float y = groundAt(x, z) + 0.003;
        vec4 view = modelViewMatrix * vec4(x, y, z, 1.0);
        vDistance = length(view.xyz) / ${WORLD_SCALE};
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uExit;
      varying vec2 vUv;
      varying float vDistance;
      void main() {
        float alpha = pow(max(0.0, 1.0 - length(vUv - 0.5) * 2.0), 2.0) * 0.32;
        alpha *= exp(-vDistance * 0.035) * (1.0 - uExit * 0.5);
        gl_FragColor = vec4(vec3(0.002, 0.005, 0.003), alpha);
        #include <colorspace_fragment>
      }
    `,
  })))
  shadows.frustumCulled = false
  shadows.renderOrder = -1
  root.add(shadows)

  const petalGeometry = retain(new PlaneGeometry(1, 1, 8, 8))
  const petalsPosition = petalGeometry.getAttribute("position")
  for (let i = 0; i < petalsPosition.count; i++) {
    const x = petalsPosition.getX(i)
    const y = petalsPosition.getY(i)
    const shape = Math.sin((y + 0.5) * Math.PI) ** 0.6
    petalsPosition.setXYZ(i, x * (0.25 + shape * 0.75), y, Math.sin(x * Math.PI) * shape * 0.24)
  }
  const petals: { mesh: Mesh; seed: number; z: number }[] = []
  for (let i = 0; i < 8; i++) {
    const material = retain(new ShaderMaterial({
      uniforms: shared, vertexShader: worldVertex, side: DoubleSide,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        ${fogShader}
        void main() {
          vec3 color = mix(vec3(0.25, 0.023, 0.056), vec3(0.65, 0.17, 0.23), vUv.y);
          color += pow(abs(sin(vUv.x * 31.0)), 7.0) * 0.018;
          gl_FragColor = vec4(inMist(color), 1.0);
          #include <colorspace_fragment>
        }
      `,
    }))
    const mesh = new Mesh(petalGeometry, material)
    mesh.scale.setScalar(0.13 + random() * 0.13)
    root.add(mesh)
    petals.push({ mesh, seed: random() * 6, z: 25 - i * 12 })
  }

  const route = new CatmullRomCurve3([
    new Vector3(2, 27, 44), new Vector3(1.5, 8, 30), new Vector3(pathAt(14), 2.6, 14),
    new Vector3(pathAt(-5), 1.75, -5), new Vector3(pathAt(-25), 1.6, -25), new Vector3(pathAt(-48), 1.6, -48),
  ], false, "centripetal")
  const cameraPosition = new Vector3()
  const cameraTarget = new Vector3()

  return {
    root,
    textures,
    route,
    resize: sky.resize,
    cameraPosition,
    cameraTarget,
    update(progress: number, elapsed: number) {
      time.value = elapsed
      if (root.visible) sky.update(elapsed)
      const leave = smooth(progress, 0.76, 1)
      exit.value = leave
      fog.value.copy(horizon).lerp(night, leave)
      route.getPointAt(progress, cameraPosition)
      route.getPointAt(Math.min(1, progress + 0.11), cameraTarget)
      sky.mesh.position.copy(cameraPosition)
      const lowGaze = Math.max(1.2, cameraTarget.y * 0.28)
      cameraTarget.y = lowGaze + (cameraPosition.y - 0.12 - lowGaze) * smooth(progress, 0.12, 0.4)
      if (progress > 0.94) cameraTarget.z -= (progress - 0.94) * 70
      planting.update(progress, cameraPosition)
      for (const { mesh, seed, z } of petals) {
        const arc = smooth(progress, 0.25, 0.92)
        mesh.position.set(Math.sin(seed + arc * 3.7) * 1.9, 1.9 + Math.sin(seed + arc * 2.6) * 0.7, z)
        mesh.rotation.set(seed + arc * 2, arc * 3 + Math.sin(elapsed * 0.6 + seed) * 0.12, seed + arc)
      }
    },
  }
}
