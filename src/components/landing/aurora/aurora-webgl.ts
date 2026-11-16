import { auroraColors, curtains, FIELD_SAMPLES, updateAuroraField } from "./aurora-field"

const vertexSource = `#version 300 es
out vec2 vUv;

void main() {
  vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = corner;
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`

const fragmentSource = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;
uniform sampler2D uField;
uniform vec3 uColors[${curtains.length}];
uniform vec4 uOptics[${curtains.length}];
uniform float uTime;
uniform float uPortrait;
uniform float uLight;

float gaussian(float d) {
  return exp2(-1.442695 * d * d);
}

float hash(vec2 cell) {
  vec3 p = fract(vec3(cell.xyx) * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise(vec2 value) {
  vec2 cell = floor(value);
  vec2 f = fract(value);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(cell), hash(cell + vec2(1, 0)), f.x),
    mix(hash(cell + vec2(0, 1)), hash(cell + vec2(1, 1)), f.x),
    f.y
  );
}

vec4 sampleField(float x, int layer) {
  float sampleX = clamp(x, 0.0, 1.0) * ${FIELD_SAMPLES - 1}.0;
  int column = min(int(sampleX), ${FIELD_SAMPLES - 2});
  return mix(texelFetch(uField, ivec2(column, layer), 0),
    texelFetch(uField, ivec2(column + 1, layer), 0), sampleX - float(column));
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y);
  float x = mix(p.x, 0.10 + p.x * 0.80, uPortrait);
  float horizon = 0.68 + 0.32 * sin(3.14159265 * p.x);
  int column = int(x * ${FIELD_SAMPLES - 1}.0 + 0.5);
  vec3 light = vec3(0.0);
  float density = 0.0;

  for (int layer = 0; layer < ${curtains.length}; ++layer) {
    vec4 base = texelFetch(uField, ivec2(column, layer), 0);
    float above = max(0.0, base.x - p.y);
    float foldX = x + base.w * above;
    vec4 field = sampleField(foldX, layer);
    float altitude = (p.y - field.x) / max(0.06, field.y);
    vec4 optics = uOptics[layer];
    float profile = mix(0.61, 0.22, smoothstep(-0.18, 0.14, altitude));
    float haze = gaussian((altitude + 0.19) / profile) * optics.x;
    float lowerEdge = gaussian(altitude / (optics.w * (altitude < 0.0 ? 1.32 : 0.78)));

    // Fine light columns lean with each sheet and unravel as they rise.
    float seed = float(layer) * 13.9;
    vec2 texturePoint = vec2(foldX * (57.0 + seed), altitude * 1.8 + seed + uTime * 0.08);
    float fibres = noise(texturePoint) * 0.72 + noise(texturePoint * 1.94 + seed) * 0.28;
    float fold = fibres * fibres;
    float heightMask = smoothstep(-0.04, 0.22, -altitude) * (1.0 - smoothstep(0.45, 1.0, -altitude));
    float shafts = heightMask * fold * optics.z * 0.58;
    float rim = lowerEdge * optics.y * (0.50 + fold * 0.66);
    float energy = (haze + shafts + rim) * field.z * horizon;
    vec3 dye = uColors[layer];
    vec3 cold = dye * vec3(0.69, 0.86, 1.12);
    vec3 emission = mix(cold, dye, smoothstep(-0.56, 0.07, altitude));
    vec3 highlight = mix(emission, vec3(0.78, 0.97, 0.94), lowerEdge * fold * 0.16);
    light += highlight * energy;
    density += energy;
  }

  float glow = 1.0 - exp2(-density * 2.55);
  float skyFade = mix(0.50, 1.0, smoothstep(0.025, 0.29, p.y));
  float textShade = gaussian((p.x - 0.5) / mix(0.205, 0.36, uPortrait)) * gaussian((p.y - 0.57) / 0.13);
  float alpha = min(glow, 0.82) * skyFade * (1.0 - textShade * mix(0.55, 0.16, uLight));
  vec3 color = light / max(density, 0.001);
  outColor = vec4(clamp(color * mix(1.0, 0.81, uLight), 0.0, 1.0), alpha * mix(1.0, 0.43, uLight));
}`

// Limit shaded pixels while letting the browser upscale the soft light field.
const DESKTOP_LONG_EDGE = 736
const MOBILE_LONG_EDGE = 432

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  gl.deleteShader(shader)
  return null
}

function linkProgram(gl: WebGL2RenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource)
  if (!vertex) return null

  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = fragment && gl.createProgram()
  if (program) {
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
  }
  gl.deleteShader(vertex)
  if (fragment) gl.deleteShader(fragment)
  if (!program || gl.getProgramParameter(program, gl.LINK_STATUS)) return program
  gl.deleteProgram(program)
  return null
}

export function createWebGLAurora(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", {
    alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: false,
    powerPreference: "low-power",
  })
  if (!gl || gl.isContextLost()) return null

  const program = linkProgram(gl)
  if (!program) return null

  const fieldTexture = gl.createTexture()
  if (!fieldTexture) {
    gl.deleteProgram(program)
    return null
  }

  const field = new Float32Array(FIELD_SAMPLES * curtains.length * 4)
  const time = gl.getUniformLocation(program, "uTime")
  const colors = gl.getUniformLocation(program, "uColors[0]")
  const portrait = gl.getUniformLocation(program, "uPortrait")
  const light = gl.getUniformLocation(program, "uLight")
  gl.useProgram(program)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, fieldTexture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, FIELD_SAMPLES, curtains.length)
  gl.uniform1i(gl.getUniformLocation(program, "uField"), 0)
  gl.uniform4fv(gl.getUniformLocation(program, "uOptics[0]"), new Float32Array(curtains.flatMap(({ optics }) => optics)))

  return {
    resize(width: number, height: number) {
      const limit = width <= 720 ? MOBILE_LONG_EDGE : DESKTOP_LONG_EDGE
      const scale = Math.min(0.65, limit / Math.max(width, height, 1))
      const nextWidth = Math.max(1, Math.round(width * scale))
      const nextHeight = Math.max(1, Math.round(height * scale))
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth
        canvas.height = nextHeight
      }
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
      gl.uniform1f(portrait, width < height ? 1 : 0)
    },
    setAppearance(accent: { r: number; g: number; b: number }, isLight: boolean) {
      gl.uniform3fv(colors, auroraColors(accent))
      gl.uniform1f(light, isLight ? 1 : 0)
    },
    draw(seconds: number) {
      updateAuroraField(field, seconds)
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, FIELD_SAMPLES, curtains.length, gl.RGBA, gl.FLOAT, field)
      gl.uniform1f(time, seconds)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose() {
      gl.deleteTexture(fieldTexture)
      gl.deleteProgram(program)
    },
  }
}
