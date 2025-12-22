import * as React from "react"

import { cn } from "@/lib/utils"

type CarouselProps = {
  images: Array<{ src: string; alt: string }>
  className?: string
}

export function Carousel({ images, className }: Readonly<CarouselProps>) {
  const [index, setIndex] = React.useState(0)
  const [thumbPage, setThumbPage] = React.useState(0)

  const count = images.length
  const safeIndex = ((index % count) + count) % count

  const prev = () => setIndex((i) => i - 1)
  const next = () => setIndex((i) => i + 1)

  // thumbnails pagination
  const THUMBS_PER_PAGE = 7
  const thumbPages = Math.max(1, Math.ceil(count / THUMBS_PER_PAGE))
  const safeThumbPage = Math.min(thumbPage, thumbPages - 1)
  const thumbStart = safeThumbPage * THUMBS_PER_PAGE
  const visibleThumbs = images.slice(thumbStart, thumbStart + THUMBS_PER_PAGE)

  React.useEffect(() => {
    // keep selected thumbnail visible
    const pageOfIndex = Math.floor(safeIndex / THUMBS_PER_PAGE)
    if (pageOfIndex !== safeThumbPage) setThumbPage(pageOfIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex])

  const prevThumbs = () => setThumbPage((p) => Math.max(0, p - 1))
  const nextThumbs = () => setThumbPage((p) => Math.min(thumbPages - 1, p + 1))

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    globalThis.addEventListener("keydown", onKeyDown)
    return () => globalThis.removeEventListener("keydown", onKeyDown)
  }, [])

  if (count === 0) return null

  return (
    <div className={cn("relative", className)}>
      <div className="relative h-[60vh] max-h-140 min-h-90 overflow-hidden rounded-xl border border-white/10 bg-black/55">
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

      {/* Thumbnails paginated (no scroll) */}
      {count > 1 ? (
        <div className="relative mt-4 rounded-xl border border-white/10 bg-black/35 p-3">
          {thumbPages > 1 ? (
            <>
              <button
                type="button"
                onClick={prevThumbs}
                disabled={safeThumbPage === 0}
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-black/35 text-white/85 backdrop-blur hover:bg-black/55 focus:outline-none focus:ring-2 focus:ring-white/20",
                  safeThumbPage === 0 && "opacity-40 pointer-events-none"
                )}
                aria-label="Previous thumbnails"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={nextThumbs}
                disabled={safeThumbPage === thumbPages - 1}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-black/35 text-white/85 backdrop-blur hover:bg-black/55 focus:outline-none focus:ring-2 focus:ring-white/20",
                  safeThumbPage === thumbPages - 1 && "opacity-40 pointer-events-none"
                )}
                aria-label="Next thumbnails"
              >
                ›
              </button>
            </>
          ) : null}

          <div className={cn("grid items-center gap-3", thumbPages > 1 ? "px-12" : "px-1")}>
            <div className="grid grid-cols-7 gap-3">
              {visibleThumbs.map((im, i) => {
                const absoluteIndex = thumbStart + i
                const active = absoluteIndex === safeIndex
                return (
                  <button
                    key={im.src}
                    type="button"
                    onClick={() => setIndex(absoluteIndex)}
                    className={cn(
                      "relative aspect-video overflow-hidden rounded-lg border bg-black/25",
                      active ? "border-white/35" : "border-white/10 hover:border-white/20"
                    )}
                    aria-label={`Go to image ${absoluteIndex + 1}`}
                  >
                    <img src={im.src} alt={im.alt} className="h-full w-full object-contain p-1.5" loading="lazy" />
                  </button>
                )
              })}

              {/* fill empties to keep grid aligned */}
              {Array.from({ length: Math.max(0, THUMBS_PER_PAGE - visibleThumbs.length) }).map((_, k) => (
                <div key={`thumb-empty-${k}`} className="aspect-video rounded-lg border border-white/5 bg-black/15" aria-hidden />
              ))}
            </div>

            {thumbPages > 1 ? (
              <div className="flex items-center justify-end text-[11px] text-white/55">
                {safeThumbPage + 1} / {thumbPages}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
