import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

type CarouselProps = {
  images: Array<{ src: string; alt: string }>
}

const controlClassName = "grid h-11 w-11 cursor-pointer place-items-center rounded-lg border border-ink/15 bg-panel text-ink/85 hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"

export function Carousel({ images }: Readonly<CarouselProps>) {
  const [index, setIndex] = useState(0)
  const count = images.length
  const activeIndex = Math.min(index, count - 1)
  const image = images[activeIndex]
  if (!image) return null

  const move = (direction: number) => {
    setIndex((current) => (Math.min(current, count - 1) + direction + count) % count)
  }

  return (
    <div
      role="group"
      aria-label="Project screenshots"
      className="min-w-0"
      onKeyDown={(event) => {
        if (count < 2 || event.target instanceof HTMLSelectElement || event.altKey || event.metaKey || event.ctrlKey) return
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault()
          move(event.key === "ArrowLeft" ? -1 : 1)
        }
      }}
    >
      <div className="aspect-[4/3] overflow-hidden rounded-lg border border-ink/10 bg-panel">
        <img key={image.src} src={image.src} alt={image.alt} decoding="async" className="h-full w-full object-contain" />
      </div>

      {count > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button type="button" data-slot="gallery-prev" onClick={() => move(-1)} className={controlClassName} aria-label="Previous screenshot">
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </button>
          <select
            aria-label="Choose screenshot"
            value={activeIndex}
            onChange={(event) => setIndex(Number(event.target.value))}
            className="min-h-11 min-w-20 rounded-lg border border-ink/15 bg-panel py-2 pl-3 pr-7 text-sm tabular-nums text-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
          >
            {images.map(({ src }, position) => (
              <option key={src} value={position}>{position + 1} / {count}</option>
            ))}
          </select>
          <button type="button" data-slot="gallery-next" onClick={() => move(1)} className={controlClassName} aria-label="Next screenshot">
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </button>
          <p className="sr-only" aria-live="polite">{activeIndex + 1} of {count}. {image.alt}</p>
        </div>
      ) : null}
    </div>
  )
}
