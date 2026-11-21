import { auroraColors, curtains, FIELD_SAMPLES, updateAuroraField } from "./aurora-field"
import { auroraShader } from "./aurora-shader"

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
#define AURORA_SAMPLE texture
${auroraShader}
uniform float uPremultiplied;
void main() {
  vec4 aurora = auroraAt(vec2(vUv.x, 1.0 - vUv.y));
  outColor = vec4(aurora.rgb * mix(1.0, aurora.a, uPremultiplied), aurora.a);
}`

// Limit shaded pixels while letting the browser upscale the soft light field.
const DESKTOP_LONG_EDGE = 736
const MOBILE_LONG_EDGE = 432

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return shader
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
  // Linking checks both shaders in one query to the driver.
  if (!program || gl.getProgramParameter(program, gl.LINK_STATUS)) return program
  gl.deleteProgram(program)
  return null
}

export function createWebGLAurora(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", {
    alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true,
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
  // A canvas can already own a context (including after hot reload); its actual
  // alpha mode wins over the options requested by a later getContext call.
  gl.uniform1f(gl.getUniformLocation(program, "uPremultiplied"), gl.getContextAttributes()?.premultipliedAlpha ? 1 : 0)
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
