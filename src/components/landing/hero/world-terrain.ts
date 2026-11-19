export const pathAt = (z: number) => Math.sin(z * 0.075) * 0.9 + Math.sin(z * 0.17) * 0.22
export function groundAt(x: number, z: number) {
  const bank = Math.min(1, Math.max(0, (Math.abs(x - pathAt(z)) - 1) / 2.8))
  return Math.sin(x * 0.21 + z * 0.13) * 0.08 + Math.cos(z * 0.31 - x * 0.15) * 0.045
    + bank * bank * (0.26 + Math.sin(z * 0.19) * 0.08)
}
export const terrainShader = /* glsl */ `
  float pathAt(float z) { return sin(z * 0.075) * 0.9 + sin(z * 0.17) * 0.22; }
  float groundAt(float x, float z) {
    float bank = clamp((abs(x - pathAt(z)) - 1.0) / 2.8, 0.0, 1.0);
    return sin(x * 0.21 + z * 0.13) * 0.08 + cos(z * 0.31 - x * 0.15) * 0.045
      + bank * bank * (0.26 + sin(z * 0.19) * 0.08);
  }
`
