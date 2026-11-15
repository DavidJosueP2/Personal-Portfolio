import { boardGridLines, createProjection, pointOnSegment, type DiagramSegment } from "./diagram-geometry"

export const VIEW_WIDTH = 460
export const VIEW_HEIGHT = 610
export const CAMERA_HEIGHT = 10.6

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

export function serviceName(index: number) {
  return `Service ${index + 1}`
}

export const nodes = [
  { name: "Client", x: 0, z: -4.02, database: false },
  { name: "API", x: 0, z: -2.18, database: false },
  ...lanes.map((x, index) => ({ name: serviceName(index), x, z: 0.3, database: false })),
  ...lanes.map((x, index) => ({ name: `DB ${index + 1}`, x, z: 3.15, database: true })),
]

export const boardGrid = boardGridLines(BOARD)

function link(from: number, to: number, top = 0.72, rise = 0.6): DiagramSegment {
  const start = nodes[from]
  const end = nodes[to]
  return {
    start: [start.x, top, start.z],
    control: [(start.x + end.x) / 2, top + rise, (start.z + end.z) / 2],
    end: [end.x, top, end.z],
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

export const projectPoint = createProjection(VIEW_WIDTH, VIEW_HEIGHT, CAMERA_HEIGHT)

export function activeNodeAt(replica: number, progress: number) {
  const route = routes[replica]
  const reached = Math.floor(progress)
  return route.nodes[Math.min(reached, route.segments.length * 2 - reached)]
}

export function packetPosition(replica: number, progress: number) {
  const { segments } = routes[replica]
  const position = Math.min(progress, segments.length * 2 - progress)
  const index = Math.min(Math.floor(position), segments.length - 1)
  return pointOnSegment(segments[index], position - index)
}
