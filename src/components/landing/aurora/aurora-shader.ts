import { curtains, FIELD_SAMPLES } from "./aurora-field"

// Shared light material for the page background and the world sky.
export const auroraShader = `uniform sampler2D uField;
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

vec4 auroraTexel(int column, int layer) {
  return AURORA_SAMPLE(uField, vec2((float(column) + 0.5) / ${FIELD_SAMPLES}.0, (float(layer) + 0.5) / ${curtains.length}.0));
}
vec4 sampleField(float x, int layer) {
  float sampleX = clamp(x, 0.0, 1.0) * ${FIELD_SAMPLES - 1}.0;
  int column = min(int(sampleX), ${FIELD_SAMPLES - 2});
  return mix(auroraTexel(column, layer),
    auroraTexel(column + 1, layer), sampleX - float(column));
}

vec4 auroraAt(vec2 p) {

  float x = clamp(mix(p.x, 0.10 + p.x * 0.80, uPortrait), 0.0, 1.0);
  float horizon = 0.68 + 0.32 * sin(3.14159265 * p.x);
  int column = int(x * ${FIELD_SAMPLES - 1}.0 + 0.5);
  vec3 light = vec3(0.0);
  float density = 0.0;

  for (int layer = 0; layer < ${curtains.length}; ++layer) {
    vec4 base = auroraTexel(column, layer);
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
  float opacity = alpha * mix(1.0, 0.43, uLight);
  vec3 rgb = clamp(color * mix(1.0, 0.81, uLight), 0.0, 1.0);
  return vec4(rgb, opacity);
}`
