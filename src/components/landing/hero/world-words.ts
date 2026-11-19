import { Vector3 } from "three"
import type { PerspectiveCamera } from "three"
import { gardenWords } from "./journey-copy"

const smooth = (value: number, low: number, high: number) => {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)))
  return t * t * (3 - 2 * t)
}

export function createWorldWords(
  stage: HTMLElement, camera: PerspectiveCamera, fromLocal: (point: Vector3, target: Vector3) => Vector3,
) {
  const words = gardenWords.map((word, index) => ({
    element: stage.querySelector<HTMLElement>(`[data-garden-word="${index}"]`), width: 0,
    anchor: fromLocal(new Vector3(word.x, word.y, word.z), new Vector3()),
    phase: index * 1.7, from: word.from, to: word.to,
  }))
  const view = new Vector3()
  const screen = new Vector3()
  let width = stage.clientWidth
  let height = stage.clientHeight
  return {
    resize() {
      width = stage.clientWidth; height = stage.clientHeight
      for (const word of words) word.width = word.element?.offsetWidth ?? 0
    },
    update(progress: number, elapsed: number, visible: boolean) {
      for (const { element, anchor, phase, width: wordWidth, from, to } of words) {
        if (!element) continue
        view.copy(anchor).applyMatrix4(camera.matrixWorldInverse)
        const distance = -view.z / 0.0025
        const alpha = visible ? smooth(progress, from, from + 0.013) * (1 - smooth(progress, to - 0.013, to)) : 0
        if (alpha < 0.005 || distance <= 0) { element.style.visibility = "hidden"; continue }
        screen.copy(anchor).project(camera)
        // Preserve reading space on phones while retaining genuine camera depth.
        const y = Math.max(height * 0.23, Math.min(height * 0.56, (-screen.y * 0.5 + 0.5) * height))
        const scale = Math.min(1.12, 0.82 + smooth(progress, from, to) * 0.3, (width - 44) / Math.max(1, wordWidth))
        const halfWidth = Math.min(width / 2, wordWidth * scale / 2 + 22)
        const x = Math.max(halfWidth, Math.min(width - halfWidth, (screen.x * 0.5 + 0.5) * width))
        element.style.visibility = "visible"
        element.style.opacity = String(alpha)
        const tilt = Math.max(-7, Math.min(7, view.x / Math.max(0.001, -view.z) * 12))
        element.style.transform = `translate3d(${x}px,${y + Math.sin(elapsed * 0.45 + phase) * 3}px,0) translate(-50%,-50%) perspective(1100px) rotateY(${tilt}deg) scale(${scale})`
        element.style.filter = `blur(${(1 - alpha) * 2}px)`
      }
    },
  }
}
