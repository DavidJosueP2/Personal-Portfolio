import {
  AmbientLight, BoxGeometry, BufferGeometry, Color, DirectionalLight, EdgesGeometry,
  LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  OctahedronGeometry, OrthographicCamera, QuadraticBezierCurve3, Scene, TubeGeometry,
  Vector3, WebGLRenderer,
} from "three"
import {
  BOARD, CAMERA_HEIGHT, CAMERA_POSITION, CAMERA_TARGET_Y, DATABASE_LAYERS, NODE_BASE, NODE_BODY,
  VIEW_HEIGHT, VIEW_WIDTH, activeNodeAt, boardGrid, databaseLinks, entryLink, nodes, packetPosition, routes,
} from "./microservices-flow"

export function createRequestScene(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" })
  if (!context) return null

  const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true })
  const scene = new Scene()
  const initialHalfWidth = CAMERA_HEIGHT * VIEW_WIDTH / VIEW_HEIGHT / 2
  const camera = new OrthographicCamera(-initialHalfWidth, initialHalfWidth, CAMERA_HEIGHT / 2, -CAMERA_HEIGHT / 2, 0.1, 50)
  camera.position.set(...CAMERA_POSITION)
  camera.lookAt(0, CAMERA_TARGET_Y, 0)
  scene.add(new AmbientLight(0xc2e5f5, 2.3))

  const keyLight = new DirectionalLight(0xd0f0ff, 2.1)
  keyLight.position.set(-4, 10, 5)
  scene.add(keyLight)

  const resources: { dispose(): void }[] = []
  function retain<T extends { dispose(): void }>(resource: T) {
    resources.push(resource)
    return resource
  }

  const accent = new Color()
  const mutedEdge = new Color("#577482")
  const mutedWire = new Color("#3b6171")
  const body = new Color("#20343d")
  const material = (color: Color | string) => retain(new MeshStandardMaterial({ color, roughness: 0.75 }))

  function addBox(
    x: number,
    z: number,
    shape: typeof BOARD,
    fill: MeshStandardMaterial,
    edge: LineBasicMaterial,
  ) {
    const geometry = retain(new BoxGeometry(shape.width, shape.top - shape.bottom, shape.depth))
    const mesh = new Mesh(geometry, fill)
    mesh.position.set(x, (shape.top + shape.bottom) / 2, z)
    mesh.add(new LineSegments(retain(new EdgesGeometry(geometry)), edge))
    scene.add(mesh)
  }

  const boardEdge = retain(new LineBasicMaterial({ color: "#47606d" }))
  addBox(0, 0, BOARD, material("#101b24"), boardEdge)
  const gridPoints = boardGrid.flatMap(([start, end]) => [new Vector3(...start), new Vector3(...end)])
  const grid = new LineSegments(
    retain(new BufferGeometry().setFromPoints(gridPoints)),
    retain(new LineBasicMaterial({ color: "#304553", transparent: true, opacity: 0.58 })),
  )
  scene.add(grid)

  const baseFill = material("#192a32")
  const nodeMaterials = nodes.map(({ x, z, database }) => {
    const edge = retain(new LineBasicMaterial({ color: mutedEdge }))
    const fill = material(body)
    addBox(x, z, NODE_BASE, baseFill, edge)
    for (const layer of database ? DATABASE_LAYERS : [NODE_BODY]) addBox(x, z, layer, fill, edge)
    return { edge, fill }
  })

  function addWire(segment: typeof entryLink, wire: MeshBasicMaterial) {
    const curve = new QuadraticBezierCurve3(
      new Vector3(...segment.start), new Vector3(...segment.control), new Vector3(...segment.end),
    )
    scene.add(new Mesh(retain(new TubeGeometry(curve, 20, 0.022, 5)), wire))
  }

  const entryWire = retain(new MeshBasicMaterial({ transparent: true, opacity: 0.7 }))
  addWire(entryLink, entryWire)
  const branchWires = routes.map(({ segments }) => {
    const wire = retain(new MeshBasicMaterial({ color: mutedWire, transparent: true, opacity: 0.55 }))
    for (const segment of segments.slice(1)) addWire(segment, wire)
    return wire
  })
  const replicationWire = retain(new MeshBasicMaterial({ color: mutedWire, transparent: true, opacity: 0.65 }))
  for (const segment of databaseLinks) addWire(segment, replicationWire)

  const packetFill = retain(new MeshBasicMaterial())
  const packet = new Mesh(retain(new OctahedronGeometry(0.16)), packetFill)
  const haloFill = retain(new MeshBasicMaterial({ transparent: true, opacity: 0.14, depthWrite: false }))
  packet.add(new Mesh(retain(new OctahedronGeometry(0.28)), haloFill))
  scene.add(packet)

  let lastProgress = 0
  let lastNode = -1
  let lastReplica: number | null = null

  function highlightNode(activeNode: number) {
    nodeMaterials.forEach(({ edge, fill }, index) => {
      edge.color.copy(index === activeNode ? accent : mutedEdge)
      fill.color.copy(body).lerp(accent, index === activeNode ? 0.23 : 0.02)
      fill.emissive.copy(accent)
      fill.emissiveIntensity = index === activeNode ? 0.12 : 0
    })
  }

  function highlightBranch(replica: number | null) {
    branchWires.forEach((wire, index) => {
      wire.color.copy(index === replica ? accent : mutedWire)
      wire.opacity = index === replica ? 0.82 : 0.55
    })
  }

  function draw(progress: number, replica: number | null) {
    const activeNode = activeNodeAt(replica ?? 0, progress)
    if (activeNode !== lastNode) highlightNode(activeNode)
    if (replica !== lastReplica) highlightBranch(replica)
    lastProgress = progress
    lastNode = activeNode
    lastReplica = replica
    packet.position.set(...packetPosition(replica ?? 0, progress))
    packet.rotation.y = progress * 2
    renderer.render(scene, camera)
  }

  function syncAccent() {
    const value = getComputedStyle(canvas).getPropertyValue("--accent-rgb").trim() || "52 211 153"
    accent.setStyle(`rgb(${value.split(/\s+/).join(", ")})`)
    entryWire.color.copy(accent)
    highlightBranch(lastReplica)
    haloFill.color.copy(accent)
    packetFill.color.copy(accent).lerp(new Color("#ffffff"), 0.34)
    lastNode = -1
    draw(lastProgress, lastReplica)
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = canvas
    if (!width || !height) return
    const halfWidth = (CAMERA_HEIGHT / 2) * width / height
    camera.left = -halfWidth
    camera.right = halfWidth
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4))
    renderer.setSize(width, height, false)
    draw(lastProgress, lastReplica)
  }

  syncAccent()
  resize()
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)

  return {
    draw,
    syncAccent,
    dispose() {
      observer.disconnect()
      for (const resource of resources) resource.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}

export type RequestScene = NonNullable<ReturnType<typeof createRequestScene>>
