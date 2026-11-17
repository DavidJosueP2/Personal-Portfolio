export type ProjectPose = {
  x: number
  y: number
  scale: number
  pitch: number
  yaw: number
  roll: number
  opacity: number
  depth: number
}

export type GalleryFrame = {
  width: number
  height: number
  cardWidth: number
  compact: boolean
}

export const galleryLanding = 0.72

export function smoothStep(start: number, end: number, progress: number) {
  const t = Math.min(1, Math.max(0, (progress - start) / (end - start)))
  return t * t * (3 - 2 * t)
}

const mix = (from: number, to: number, progress: number) => from + (to - from) * progress

function blend(from: ProjectPose, to: ProjectPose, progress: number): ProjectPose {
  return {
    x: mix(from.x, to.x, progress),
    y: mix(from.y, to.y, progress),
    scale: mix(from.scale, to.scale, progress),
    pitch: mix(from.pitch, to.pitch, progress),
    yaw: mix(from.yaw, to.yaw, progress),
    roll: mix(from.roll, to.roll, progress),
    opacity: mix(from.opacity, to.opacity, progress),
    depth: mix(from.depth, to.depth, progress),
  }
}

export function enterGallery(frame: GalleryFrame, carousel: ProjectPose, index: number, count: number, progress: number) {
  const { width, height, cardWidth, compact } = frame
  // The same covers travel around the words, with a large card crossing in front below them.
  const spacing = index * 2 * Math.PI / count
  const turn = Math.min(progress, galleryLanding + 0.015)
  const angle = Math.PI / 2 + (0.59 - turn) * 3.9 + spacing + Math.sin(spacing) * 0.62
  const side = Math.cos(angle)
  const heightOnRing = Math.sin(angle)
  const near = (heightOnRing + 1) / 2
  const orbit: ProjectPose = {
    x: width * (0.5 + side * (compact ? 0.395 : 0.36)),
    y: height * ((compact ? 0.562 : 0.584) + heightOnRing * (compact ? 0.329 : 0.314)),
    scale: mix(compact ? 0.28 : 0.35, compact ? 0.68 : 0.91, near ** 2),
    pitch: mix(-7, 6, near),
    yaw: side * (compact ? -66 : -63),
    roll: side * 8,
    opacity: 1,
    depth: mix(6, 40, near),
  }

  const launch = index * 0.028
  const right = index % 3 !== 1
  const offstage: ProjectPose = {
    ...orbit,
    x: right ? width + cardWidth * (0.29 + index * 0.09) : -cardWidth * 0.45,
    y: height * (0.89 + (index % 3) * 0.2),
    yaw: right ? -81 : 75,
    roll: right ? -12 : 11,
  }
  const arriving = blend(offstage, orbit, smoothStep(launch, launch + 0.31, progress))
  // The featured cover lifts into its place while the neighboring cards fan out.
  const lift = index === 0 ? 0 : (index % 3 + 1) * 0.015
  const landing = smoothStep(galleryLanding + lift, 1, progress)
  const settled = blend(arriving, carousel, landing)
  settled.y += Math.sin(Math.PI * landing) * height * (index === 0 ? -0.06 : index < count / 2 ? -0.12 : 0.055)
  return settled
}

export function exitGallery(frame: GalleryFrame, carousel: ProjectPose, index: number, progress: number) {
  const { width, height, cardWidth } = frame
  const side = carousel.x < width * 0.48 ? -1 : 1
  const foreground = carousel.scale > 0.66
  const delay = foreground ? 0.14 : (index % 3) * 0.045
  const travel = smoothStep(delay, 0.95, progress)
  const offstage: ProjectPose = {
    ...carousel,
    x: side < 0 ? -cardWidth * 0.73 : width + cardWidth * 0.74,
    y: foreground ? carousel.y + height * 0.5 : carousel.y - height * 0.12,
    scale: carousel.scale * (foreground ? 1.10 : 0.84),
    pitch: foreground ? 12 : -7,
    yaw: side * -72,
    roll: side * 15,
  }
  const leaving = blend(carousel, offstage, travel)
  leaving.y += Math.sin(Math.PI * travel) * height * (foreground ? 0.14 : -0.06)
  return leaving
}
