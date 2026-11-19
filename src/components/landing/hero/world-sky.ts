import { BackSide, Color, DataTexture, FloatType, Mesh, NearestFilter, RGBAFormat, ShaderMaterial, SphereGeometry } from "three"
import { auroraColors, curtains, FIELD_SAMPLES, updateAuroraField } from "../aurora/aurora-field"
import { auroraShader } from "../aurora/aurora-shader"

type Retain = <T extends { dispose(): void }>(resource: T) => T

export function createWorldSky(retain: Retain, fog: { value: Color }) {
  const field = new Float32Array(FIELD_SAMPLES * curtains.length * 4)
  updateAuroraField(field, 0)
  const texture = retain(new DataTexture(field, FIELD_SAMPLES, curtains.length, RGBAFormat, FloatType))
  texture.minFilter = texture.magFilter = NearestFilter
  texture.needsUpdate = true
  const uniforms = {
    uField: { value: texture },
    uColors: { value: auroraColors({ r: 190, g: 255, b: 60 }) },
    uOptics: { value: new Float32Array(curtains.flatMap(({ optics }) => [...optics])) },
    uTime: { value: 0 }, uPortrait: { value: 0 }, uLight: { value: 0 }, uFogColor: fog,
  }
  const appearance = () => {
    const channels = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim().split(/[ ,]+/).map(Number)
    if (channels.length >= 3 && channels.every(Number.isFinite)) {
      uniforms.uColors.value = auroraColors({ r: channels[0], g: channels[1], b: channels[2] })
    }
  }
  appearance()
  const observer = new MutationObserver(appearance)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class", "data-accent"] })
  retain({ dispose: () => observer.disconnect() })

  const mesh = new Mesh(retain(new SphereGeometry(120, 48, 32)), retain(new ShaderMaterial({
    side: BackSide, depthWrite: false, uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDirection;
      void main() {
        vDirection = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      #define AURORA_SAMPLE texture2D
      ${auroraShader}
      uniform vec3 uFogColor;
      varying vec3 vDirection;
      vec3 linearLight(vec3 c) {
        return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
      }
      void main() {
        vec3 direction = normalize(vDirection);
        float altitude = direction.y;
        vec3 night = vec3(0.001, 0.003, 0.008);
        vec3 color = mix(uFogColor, night, smoothstep(-0.01, 0.22, altitude));
        float azimuth = atan(direction.x, -direction.z);
        vec2 p = vec2(0.5 + azimuth / 1.65, 0.78 - max(0.0, altitude) * 2.0);
        vec4 aurora = auroraAt(p);
        float sky = smoothstep(-0.015, 0.065, altitude);
        float upperFade = smoothstep(-0.1, 0.12, p.y);
        color = mix(color, linearLight(aurora.rgb), aurora.a * sky * upperFade * 0.65);
        vec2 starGrid = vec2(azimuth * 230.0, asin(clamp(altitude, -1.0, 1.0)) * 230.0);
        vec2 cell = floor(starGrid);
        float star = step(0.993, hash(cell)) * pow(max(0.0, 1.0 - length(fract(starGrid) - 0.5) * 2.0), 5.0);
        color += vec3(0.44, 0.55, 0.64) * star * sky * (0.68 + 0.2 * sin(uTime + hash(cell) * 20.0));
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
  })))
  mesh.renderOrder = -5
  let lastField = -1
  return {
    mesh, texture,
    resize(aspect: number) { uniforms.uPortrait.value = aspect < 1 ? 1 : 0 },
    update(elapsed: number) {
      uniforms.uTime.value = elapsed
      if (elapsed - lastField < 1 / 24) return
      updateAuroraField(field, elapsed)
      texture.needsUpdate = true
      lastField = elapsed
    },
  }
}
