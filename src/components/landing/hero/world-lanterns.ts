import {
  BoxGeometry, BufferGeometry, CylinderGeometry, Float32BufferAttribute, Group,
  InstancedMesh, Object3D, ShaderMaterial, SphereGeometry, Vector4,
} from "three"
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js"
import { groundAt, pathAt } from "./world-terrain"

type Retain = <T extends { dispose(): void }>(resource: T) => T

const windowHeight = 0.98
const lightRadius = 2.85
const lanterns = [
  { z: 23, offset: -1.85, size: 0.92 },
  { z: 12, offset: 1.72, size: 1.1 },
  { z: 0, offset: -1.75, size: 1 },
  { z: -13, offset: 1.78, size: 0.94 },
  { z: -27, offset: -1.72, size: 1.12 },
  { z: -39, offset: 1.8, size: 0.89 },
  { z: -53, offset: -1.65, size: 1.04 },
  { z: -60, offset: 1.9, size: 0.9 },
].map(({ z, offset, size }) => {
  const x = pathAt(z) + offset
  return { x, y: groundAt(x, z), z, size }
})

export function lanternLightAt(x: number, y: number, z: number) {
  let light = 0
  for (const lamp of lanterns) {
    const height = y - (lamp.y + windowHeight * lamp.size)
    const distanceSquared = (x - lamp.x) ** 2 + (z - lamp.z) ** 2 + height ** 2
    const falloff = Math.max(0, 1 - distanceSquared / (lightRadius * lamp.size) ** 2)
    light += falloff * falloff
  }
  return light
}

export const lanternPositions = lanterns.map(({ x, y, z, size }) => new Vector4(x, y + windowHeight * size, z, size))

export const lanternGroundShader = /* glsl */ `
  uniform vec4 uLanterns[${lanterns.length}];
  vec3 lanternGround(vec3 color, vec3 point) {
    float light = 0.0;
    float contactShadow = 0.0;
    for (int i = 0; i < ${lanterns.length}; i++) {
      vec4 lamp = uLanterns[i];
      vec3 delta = point - lamp.xyz;
      float r = ${lightRadius} * lamp.w;
      float falloff = max(0.0, 1.0 - dot(delta, delta) / (r * r));
      light += falloff * falloff;
      vec2 footprint = delta.xz / lamp.w;
      contactShadow += 1.0 - smoothstep(0.08, 0.48, dot(footprint, footprint));
    }
    return (color + vec3(0.16, 0.073, 0.019) * light) * (1.0 - contactShadow * 0.46);
  }
`

// The roof lifts at the corners and narrows towards the finial.
function stoneProfile(rings: readonly (readonly [height: number, halfWidth: number, lift: number])[], segments: number) {
  const points: number[] = []
  const triangles: number[] = []
  for (let side = 0; side < 4; side++) {
    const angle = side * Math.PI / 2
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const start = points.length / 3
    for (const [height, halfWidth, lift] of rings) {
      for (let i = 0; i <= segments; i++) {
        const along = i * 2 / segments - 1
        const x = along * halfWidth
        points.push(x * cos + halfWidth * sin, height + lift * along ** 4, halfWidth * cos - x * sin)
      }
    }
    for (let row = 0; row < rings.length - 1; row++) {
      for (let i = 0; i < segments; i++) {
        const lower = start + row * (segments + 1) + i
        const upper = lower + segments + 1
        triangles.push(lower, lower + 1, upper, lower + 1, upper + 1, upper)
      }
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3))
  geometry.setIndex(triangles)
  geometry.computeVertexNormals()
  return geometry
}

function stoneLantern() {
  const foot = stoneProfile([[0, 0.4, 0], [0.085, 0.39, 0], [0.15, 0.29, 0], [0.15, 0.17, 0]], 1)
  const stand = new CylinderGeometry(0.115, 0.16, 0.54, 8).translate(0, 0.39, 0)
  const sill = stoneProfile([[0.62, 0.18, 0], [0.69, 0.32, 0], [0.77, 0.31, 0]], 1)
  const roof = stoneProfile([
    [1.18, 0.29, 0], [1.15, 0.39, 0.085], [1.21, 0.39, 0.09],
    [1.23, 0.29, 0.054], [1.36, 0.15, 0.018], [1.45, 0.065, 0], [1.45, 0.012, 0],
  ], 8)
  const finial = new SphereGeometry(0.07, 12, 8).scale(1, 1.27, 1).translate(0, 1.49, 0)
  const parts = [foot, stand, sill, roof, finial]
  for (const x of [-0.25, 0.25]) {
    for (const z of [-0.25, 0.25]) parts.push(new BoxGeometry(0.145, 0.41, 0.145).translate(x, 0.965, z))
  }
  for (const side of [-1, 1]) {
    parts.push(new BoxGeometry(0.5, 0.038, 0.06).translate(0, 0.91, side * 0.267))
    parts.push(new BoxGeometry(0.06, 0.038, 0.5).translate(side * 0.267, 0.91, 0))
  }
  // Only position and normal are needed for the local-space stone material.
  for (const part of parts) part.deleteAttribute("uv")
  const geometry = mergeGeometries(parts)!
  for (const part of parts) part.dispose()
  return geometry
}

export function createWorldLanterns(retain: Retain, shared: Record<string, { value: unknown }>, fogShader: string, worldScale: number) {
  const vertexShader = /* glsl */ `
    varying vec3 vStone;
    varying vec3 vNormal;
    varying float vSeed;
    varying float vDistance;
    void main() {
      vStone = position;
      vNormal = normal;
      vSeed = instanceMatrix[3].z * 0.49;
      vec4 view = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      vDistance = length(view.xyz) / ${worldScale};
      gl_Position = projectionMatrix * view;
    }
  `
  const stone = retain(new ShaderMaterial({
    uniforms: shared, vertexShader,
    fragmentShader: /* glsl */ `
      varying vec3 vStone;
      varying vec3 vNormal;
      varying float vSeed;
      ${fogShader}
      void main() {
        vec3 normal = normalize(vNormal);
        float moon = max(0.0, dot(normal, normalize(vec3(-0.6, 0.7, 0.5))));
        vec3 p = vStone + vSeed;
        float grain = sin(dot(p, vec3(133.0, 184.0, 215.0))) * sin(dot(p, vec3(198.0, 167.0, -111.0)));
        float moss = smoothstep(0.27, 0.74, sin(p.x * 9.0 + p.y * 11.0) * cos(p.z * 13.0 + p.y * 3.0));
        vec3 color = mix(vec3(0.1, 0.13, 0.14), vec3(0.052, 0.091, 0.069), moss * 0.57);
        color *= 0.62 + moon * 0.55 + grain * 0.13;
        float chamberLight = exp(-abs(vStone.y - ${windowHeight}) * 8.0) * (0.24 + max(0.0, -normal.y) * 0.64);
        color += vec3(0.34, 0.18, 0.059) * chamberLight;
        gl_FragColor = vec4(inMist(color), 1.0);
        #include <colorspace_fragment>
      }
    `,
  }))
  const paper = retain(new ShaderMaterial({
    uniforms: shared, vertexShader,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vStone;
      varying vec3 vNormal;
      varying float vSeed;
      ${fogShader}
      void main() {
        float across = dot(abs(vStone.xz), abs(vNormal.zx));
        float height = (vStone.y - ${windowHeight}) * 4.0;
        float core = exp(-across * across * 15.0 - height * height);
        float flicker = 0.96 + 0.04 * sin(uTime * 2.1 + vSeed) * sin(uTime * 1.13 + vSeed);
        vec3 color = mix(vec3(0.81, 0.19, 0.028), vec3(1.0, 0.77, 0.37), core) * flicker;
        gl_FragColor = vec4(inMist(color), 1.0);
        #include <colorspace_fragment>
      }
    `,
  }))
  const frames = retain(new InstancedMesh(retain(stoneLantern()), stone, lanterns.length))
  const windowGeometry = retain(new BoxGeometry(0.51, 0.385, 0.51).translate(0, 0.965, 0))
  const windows = retain(new InstancedMesh(windowGeometry, paper, lanterns.length))
  const transform = new Object3D()
  for (const [index, { x, y, z, size }] of lanterns.entries()) {
    transform.position.set(x, y - 0.024, z)
    transform.rotation.y = 0.12 + Math.sin(z * 0.17) * 0.29
    transform.scale.setScalar(size)
    transform.updateMatrix()
    frames.setMatrixAt(index, transform.matrix)
    windows.setMatrixAt(index, transform.matrix)
  }
  const group = new Group()
  group.add(frames, windows)
  return group
}
