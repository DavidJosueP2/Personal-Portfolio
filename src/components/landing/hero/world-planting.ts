import { DoubleSide, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from "three"
import type { Texture } from "three"
import { groundAt, pathAt } from "./world-terrain"
import { lanternLightAt } from "./world-lanterns"

type Retain = <T extends { dispose(): void }>(resource: T) => T
export function createPlanting(retain: Retain, textures: Texture[], random: () => number, shared: Record<string, { value: unknown }>, fogShader: string, scale: number) {
  const camera = { value: new Vector3() }
  const progress = { value: 0 }
  const groups = Array.from({ length: 15 }, () => [] as number[])
  const anchors: number[] = []
  const plant = (kind: number, x: number, z: number, height: number) => {
    const aspect = kind === 3 || kind === 4 ? 160 / 176 : 2 / 3
    groups[kind].push(x, groundAt(x, z), z, height * aspect, height, random() * 7)
    anchors.push(x, z, Math.max(0.3, height * aspect * 0.5))
  }
  // Beds follow the path in loose drifts, with small plants between the focal blooms.
  for (let bed = 0; bed < 21; bed++) {
    const z = 37 - bed * 5.4
    for (const side of [-1, 1]) {
      const center = pathAt(z) + side * (2.9 + random() * 1.0)
      const kind = 5 + (bed * 2 + (side > 0 ? 3 : 0)) % 9
      plant(kind, center, z, 2 + random() * 1.05)
      for (let companion = 0; companion < 3; companion++) {
        plant(companion === 0 ? kind : [5, 6, 9, 10, 11, 12][(bed + companion) % 6],
          center + (random() - 0.5) * 2.8, z + (random() - 0.5) * 3.8, 0.65 + random() * 1.2)
      }
      plant(14, pathAt(z) + side * (1.6 + random() * 0.6), z - 1.4, 0.7 + random() * 0.55)
      plant((bed + (side > 0 ? 7 : 0)) % 14, pathAt(z) + side * (6 + random() * 5), z + 2, 1.7 + random() * 1.6)
      if (window.innerWidth >= 768) plant(5 + bed % 9, side * (13 + random() * 8), z - 2, 2 + random() * 1.6)
    }
  }
  const meshes = groups.map((plants, kind) => {
    const base = new PlaneGeometry(1, 1, 6, 12)
    const geometry = retain(new InstancedBufferGeometry())
    geometry.index = base.index?.clone() ?? null
    for (const key of ["position", "uv"]) geometry.setAttribute(key, base.getAttribute(key).clone())
    base.dispose()
    const count = plants.length / 6
    const roots = new Float32Array(count * 3)
    const shapes = new Float32Array(count * 3)
    const lampLight = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      const [x, y, z, width, height, seed] = plants.slice(i * 6, i * 6 + 6)
      roots.set([x, y, z], i * 3)
      shapes.set([width, height, seed], i * 3)
      lampLight.set([lanternLightAt(x, y + 0.15, z), lanternLightAt(x, y + height * 0.85, z)], i * 2)
    }
    geometry.setAttribute("aRoot", new InstancedBufferAttribute(roots, 3))
    geometry.setAttribute("aShape", new InstancedBufferAttribute(shapes, 3))
    geometry.setAttribute("aLampLight", new InstancedBufferAttribute(lampLight, 2))
    geometry.instanceCount = count
    const mesh = new Mesh(geometry, retain(new ShaderMaterial({
      uniforms: { ...shared, uCamera: camera, uProgress: progress, uPainting: { value: textures[kind] }, uOffset: { value: kind === 3 || kind === 4 ? -0.225 : 0 } },
      side: DoubleSide, transparent: true, depthWrite: true,
      vertexShader: /* glsl */ `
        attribute vec3 aRoot;
        attribute vec3 aShape;
        attribute vec2 aLampLight;
        uniform vec3 uCamera;
        uniform float uTime;
        uniform float uProgress;
        uniform float uOffset;
        varying vec2 vUv;
        varying float vDistance;
        varying float vReveal;
        varying float vTone;
        varying float vLampLight;
        void main() {
          vUv = uv;
          vLampLight = mix(aLampLight.x, aLampLight.y, uv.y);
          vTone = sin(aShape.z) * 0.5 + 0.5;
          vReveal = smoothstep(0.01 + aShape.z * 0.001, 0.17 + aShape.z * 0.001, uProgress) * 1.1;
          vec2 p = (position.xy + vec2(uOffset, 0.445)) * aShape.xy;
          float tip = pow(max(0.0, uv.y - 0.055), 1.7);
          p.x += (sin(uTime * 0.58 + aShape.z) * 0.024 + sin(uTime * 1.1 + uv.y * 6.0 + aShape.z) * 0.006) * tip * aShape.y;
          vec2 facing = normalize(uCamera.xz - aRoot.xz);
          vec3 point = aRoot + vec3(facing.y * p.x, p.y, -facing.x * p.x);
          point.xz += facing * sin(uv.x * 3.14159) * sin(uv.y * 3.14159) * aShape.y * 0.035;
          vec4 view = modelViewMatrix * vec4(point, 1.0);
          vDistance = length(view.xyz) / ${scale};
          gl_Position = projectionMatrix * view;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uPainting;
        varying vec2 vUv;
        varying float vReveal;
        varying float vTone;
        varying float vLampLight;
        ${fogShader}
        void main() {
          vec4 paint = texture2D(uPainting, vUv);
          float growing = 1.0 - smoothstep(vReveal - 0.04, vReveal + 0.025, vUv.y);
          float alpha = paint.a * growing;
          if (alpha < 0.15) discard;
          vec3 light = mix(vec3(0.46, 0.65, 0.62), vec3(0.92, 0.98, 0.91), smoothstep(0.06, 0.85, vUv.y));
          light *= mix(vec3(0.91, 0.96, 1.02), vec3(1.03, 1.0, 0.92), vTone);
          vec3 warmLight = vec3(0.74, 0.37, 0.13) * vLampLight;
          gl_FragColor = vec4(inMist(paint.rgb * (light + warmLight)), alpha);
          #include <colorspace_fragment>
        }
      `,
    })))
    mesh.frustumCulled = false
    return mesh
  })
  return {
    meshes, anchors,
    update(value: number, position: Vector3) { progress.value = value; camera.value.copy(position) },
  }
}
