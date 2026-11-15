export type DiagramPoint = readonly [x: number, y: number, z: number]
export type DiagramBox = { width: number; depth: number; bottom: number; top: number }
export type DiagramSegment = { start: DiagramPoint; control: DiagramPoint; end: DiagramPoint }

export const CAMERA_POSITION = [3.4, 22, 16] as const
export const CAMERA_TARGET_Y = 0.18

export const diagramColors = {
  boardEdge: "#41565c",
  boardTop: "#142024",
  grid: "#34494f",
  nodeEdge: "#597179",
  wire: "#45636b",
}

const [cameraX, cameraY, cameraZ] = CAMERA_POSITION
const horizontal = Math.hypot(cameraX, cameraZ)
const distance = Math.hypot(horizontal, cameraY - CAMERA_TARGET_Y)
const sinYaw = cameraX / horizontal
const cosYaw = cameraZ / horizontal
const sinPitch = (cameraY - CAMERA_TARGET_Y) / distance
const cosPitch = horizontal / distance

// Both SVG diagrams use the same orthographic angle as the WebGL request scene.
export function createProjection(width: number, height: number, cameraHeight: number) {
  const scale = height / cameraHeight
  return ([x, y, z]: DiagramPoint) => {
    const screenX = x * cosYaw - z * sinYaw
    const screenY = (y - CAMERA_TARGET_Y) * cosPitch - (x * sinYaw + z * cosYaw) * sinPitch
    return [width / 2 + screenX * scale, height / 2 - screenY * scale] as const
  }
}

export type Projection = ReturnType<typeof createProjection>

export function projectBox(project: Projection, { width, depth, bottom, top }: DiagramBox, x = 0, z = 0) {
  const left = x - width / 2
  const right = x + width / 2
  const near = z + depth / 2
  const far = z - depth / 2
  const point = (px: number, py: number, pz: number) => project([px, py, pz]).map((n) => n.toFixed(2)).join(",")
  return {
    front: [point(left, top, near), point(right, top, near), point(right, bottom, near), point(left, bottom, near)].join(" "),
    side: [point(right, top, near), point(right, top, far), point(right, bottom, far), point(right, bottom, near)].join(" "),
    top: [point(left, top, far), point(right, top, far), point(right, top, near), point(left, top, near)].join(" "),
  }
}

export function boardGridLines({ width, depth, top }: DiagramBox) {
  const halfWidth = width / 2 - 0.1
  const halfDepth = depth / 2 - 0.1
  const y = top + 0.006
  const columns = Math.floor((halfWidth + Number.EPSILON) * 2)
  const rows = Math.floor((halfDepth + Number.EPSILON) * 2)
  return [
    ...Array.from({ length: columns * 2 + 1 }, (_, index) => {
      const x = (index - columns) * 0.5
      return [[x, y, -halfDepth], [x, y, halfDepth]] as const
    }),
    ...Array.from({ length: rows * 2 + 1 }, (_, index) => {
      const z = (index - rows) * 0.5
      return [[-halfWidth, y, z], [halfWidth, y, z]] as const
    }),
  ]
}

export function tracePath(project: Projection, segments: readonly DiagramSegment[]) {
  return segments.map(({ start, control, end }) => {
    const point = (value: DiagramPoint) => project(value).map((n) => n.toFixed(2)).join(",")
    return `M${point(start)} Q${point(control)} ${point(end)}`
  }).join(" ")
}

export function pointOnSegment({ start, control, end }: DiagramSegment, t: number): DiagramPoint {
  const before = 1 - t
  const interpolate = (axis: 0 | 1 | 2) =>
    before * before * start[axis] + 2 * before * t * control[axis] + t * t * end[axis]
  return [interpolate(0), interpolate(1), interpolate(2)]
}
