import * as React from "react"

import { cn } from "@/lib/utils"

type CarouselProps = {
  images: Array<{ src: string; alt: string }>
  className?: string
}

export function Carousel({ images, className }: CarouselProps) {
  const [index, setIndex] = React.useState(0)

  const count = images.length
  const safeIndex = ((index % count) + count) % count

  const prev = () => setIndex((i) => i - 1)
  const next = () => setIndex((i) => i + 1)

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  if (count === 0) return null

  return (
    <div className={cn("relative", className)}>
      <div className="relative h-[60vh] max-h-[560px] min-h-[360px] overflow-hidden rounded-xl border border-white/10 bg-black/55">
        <img
          key={images[safeIndex]?.src}
          src={images[safeIndex]?.src}
          alt={images[safeIndex]?.alt}
          className="h-full w-full object-contain"
          loading="lazy"
        />

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/0 to-black/10" />

        <button
          type="button"
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-xs text-white/80 backdrop-blur hover:bg-black/55 focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Previous"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-xs text-white/80 backdrop-blur hover:bg-black/55 focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Next"
        >
          Next
        </button>

        <div className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs text-white/80">
          {safeIndex + 1} / {count}
        </div>
      </div>

      {/* Thumbnails */}
      {count > 1 ? (
        <div className="mt-3 flex gap-2 overflow-auto pb-1">
          {images.slice(0, 12).map((im, i) => (
            <button
              key={im.src}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border bg-black/35",
                i === safeIndex ? "border-white/30" : "border-white/10 hover:border-white/20"
              )}
              aria-label={`Go to image ${i + 1}`}
            >
              <img src={im.src} alt={im.alt} className="h-full w-full object-contain p-1" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
