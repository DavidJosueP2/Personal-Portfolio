type Point = readonly [x: number, y: number, z: number]

export const VIEW_WIDTH = 460
export const VIEW_HEIGHT = 610
export const CAMERA_HEIGHT = 10.6
export const CAMERA_POSITION = [3.4, 22, 16] as const
export const CAMERA_TARGET_Y = 0.18

export const BOARD = { width: 5.45, depth: 10.2, bottom: -0.27, top: 0 }
export const NODE_BASE = { width: 1.45, depth: 1.3, bottom: 0.04, top: 0.2 }
export const NODE_BODY = { width: 1.2, depth: 1.06, bottom: 0.22, top: 0.67 }
export const DATABASE_LAYERS = [
  { ...NODE_BODY, top: 0.4 },
  { ...NODE_BODY, bottom: 0.46 },
]

const lanes = [-1.7, 0, 1.7]
const client = 0
const api = 1
const firstReplica = 2
const firstDatabase = firstReplica + lanes.length

export const nodes = [
  { name: "Client", x: 0, z: -4.02, database: false },
  { name: "API", x: 0, z: -2.18, database: false },
  ...lanes.map((x, index) => ({ name: `Trips ${index + 1}`, x, z: 0.3, database: false })),
  ...lanes.map((x, index) => ({ name: `DB ${index + 1}`, x, z: 3.15, database: true })),
]

export const boardGrid: ReadonlyArray<readonly [Point, Point]> = [
  ...Array.from({ length: 11 }, (_, index) => {
    const x = index * 0.5 - 2.5
    return [[x, 0.006, -5], [x, 0.006, 5]] as const
  }),
  ...Array.from({ length: 21 }, (_, index) => {
    const z = index * 0.5 - 5
    return [[-2.63, 0.006, z], [2.63, 0.006, z]] as const
  }),
]

function link(from: number, to: number, top = 0.72, rise = 0.6) {
  const start = nodes[from]
  const end = nodes[to]
  return {
    start: [start.x, top, start.z] as Point,
    control: [(start.x + end.x) / 2, top + rise, (start.z + end.z) / 2] as Point,
    end: [end.x, top, end.z] as Point,
  }
}

export const entryLink = link(client, api)
export const routes = lanes.map((_, index) => {
  const replica = firstReplica + index
  const database = firstDatabase + index
  return {
    nodes: [client, api, replica, database],
    segments: [entryLink, link(api, replica), link(replica, database)],
  }
})

export const databaseLinks = lanes.slice(1).map((_, index) =>
  link(firstDatabase + index, firstDatabase + index + 1, 0.35, 0),
)

const [cameraX, cameraY, cameraZ] = CAMERA_POSITION
const horizontal = Math.hypot(cameraX, cameraZ)
const distance = Math.hypot(horizontal, cameraY - CAMERA_TARGET_Y)
const sinYaw = cameraX / horizontal
const cosYaw = cameraZ / horizontal
const sinPitch = (cameraY - CAMERA_TARGET_Y) / distance
const cosPitch = horizontal / distance
const scale = VIEW_HEIGHT / CAMERA_HEIGHT

// Keep the fallback diagram aligned with the orthographic WebGL camera.
export function projectPoint([x, y, z]: Point) {
  const screenX = x * cosYaw - z * sinYaw
  const screenY = (y - CAMERA_TARGET_Y) * cosPitch - (x * sinYaw + z * cosYaw) * sinPitch
  return [VIEW_WIDTH / 2 + screenX * scale, VIEW_HEIGHT / 2 - screenY * scale] as const
}

export function activeNodeAt(replica: number, progress: number) {
  const route = routes[replica]
  const reached = Math.floor(progress)
  return route.nodes[Math.min(reached, route.segments.length * 2 - reached)]
}

export function packetPosition(replica: number, progress: number): Point {
  const { segments } = routes[replica]
  const position = Math.min(progress, segments.length * 2 - progress)
  const index = Math.min(Math.floor(position), segments.length - 1)
  const { start, control, end } = segments[index]
  const t = position - index
  const before = 1 - t
  const interpolate = (axis: 0 | 1 | 2) =>
    before * before * start[axis] + 2 * before * t * control[axis] + t * t * end[axis]
  return [interpolate(0), interpolate(1), interpolate(2)]
}
