import { DoubleSide, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, PlaneGeometry, ShaderMaterial } from "three"
import { groundAt, pathAt } from "./world-terrain"

type Retain = <T extends { dispose(): void }>(resource: T) => T
export function createGroundcover(retain: Retain, random: () => number, shared: Record<string, { value: unknown }>, fogShader: string, scale: number) {
  const leaf = new PlaneGeometry(1, 1, 4, 8)
  const positions = leaf.getAttribute("position")
  const uv = leaf.getAttribute("uv")
  for (let i = 0; i < positions.count; i++) {
    const h = uv.getY(i)
    const across = positions.getX(i)
    const width = Math.sin(h * Math.PI) ** 0.75
    positions.setXYZ(i, across * width, h, (1 - across * across * 4) * width * 0.09)
  }
  const geometry = retain(new InstancedBufferGeometry())
  geometry.index = leaf.index?.clone() ?? null
  for (const key of ["position", "uv"]) geometry.setAttribute(key, leaf.getAttribute(key).clone())
  leaf.dispose()
  const clumps = window.innerWidth < 768 ? 100 : 190
  const roots: number[] = []
  const forms: number[] = []
  for (let i = 0; i < clumps; i++) {
    const z = random() * 125 - 77
    const x = pathAt(z) + (random() < 0.5 ? -1 : 1) * (1.25 + random() ** 1.7 * 12)
    for (let blade = 0; blade < 7; blade++) {
      roots.push(x, groundAt(x, z) + 0.015, z)
      forms.push(0.3 + random() * 0.4, 0.05 + random() * 0.1, blade * Math.PI * 2 / 7 + i, random() * 6.28)
    }
  }
  geometry.setAttribute("aRoot", new InstancedBufferAttribute(new Float32Array(roots), 3))
  geometry.setAttribute("aForm", new InstancedBufferAttribute(new Float32Array(forms), 4))
  geometry.instanceCount = roots.length / 3
  const mesh = new Mesh(geometry, retain(new ShaderMaterial({
    uniforms: shared, side: DoubleSide,
    vertexShader: /* glsl */ `
      attribute vec3 aRoot;
      attribute vec4 aForm;
      uniform float uTime;
      varying vec2 vUv;
      varying float vTone;
      varying float vDistance;
      void main() {
        vUv = uv;
        vTone = sin(aForm.w) * 0.5 + 0.5;
        float h = uv.y;
        float turn = aForm.z;
        float reach = sin(h * 1.6) * aForm.x;
        float breeze = sin(uTime * 0.52 + aForm.w) * 0.035 * h * h;
        vec3 p = aRoot + vec3(cos(turn) * reach, sin(h * 2.1) * aForm.x * 0.56, sin(turn) * reach);
        p += vec3(-sin(turn), 0.0, cos(turn)) * position.x * aForm.y;
        p.y += position.z * aForm.x + breeze;
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        vDistance = length(view.xyz) / ${scale};
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      varying float vTone;
      ${fogShader}
      void main() {
        float vein = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 15.0);
        float ribs = pow(abs(sin(vUv.y * 56.0 + abs(vUv.x - 0.5) * 28.0)), 10.0);
        vec3 color = mix(vec3(0.009, 0.028, 0.022), vec3(0.048, 0.11, 0.066), vTone * 0.55 + vUv.y * 0.45);
        color += vein * vec3(0.027, 0.046, 0.023) + ribs * vec3(0.005, 0.01, 0.005);
        gl_FragColor = vec4(inMist(color), 1.0);
        #include <colorspace_fragment>
      }
    `,
  })))
  mesh.frustumCulled = false
  return mesh
}
