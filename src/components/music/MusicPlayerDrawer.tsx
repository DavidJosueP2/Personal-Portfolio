import { useEffect, useRef, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { Pause, Play, SkipBack, SkipForward } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAmbientAudio } from "@/context/ambient-audio"
import "./music-player.css"

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const total = Math.floor(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${String(secs).padStart(2, "0")}`
}

export function MusicPlayerDrawer() {
  const { t } = useTranslation()
  const {
    isOpen,
    close,
    tracks,
    currentTrack,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    selectTrack,
    nextTrack,
    prevTrack,
    seek,
  } = useAmbientAudio()

  const drawerRef = useRef<HTMLElement>(null)
  const activeRowRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const frame = window.requestAnimationFrame(() => {
      drawerRef.current?.focus({ preventScroll: true })
      activeRowRef.current?.scrollIntoView({ block: "nearest" })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

  if (typeof document === "undefined") return null

  const safeDuration = duration > 0 ? duration : currentTrack.duration
  const progressPct = safeDuration > 0 ? Math.min(100, (currentTime / safeDuration) * 100) : 0

  return createPortal(
    <>
      <div
        className="music-backdrop"
        data-music-backdrop
        data-inverse-cursor-exclude
        aria-hidden={!isOpen}
      >
        <aside
          ref={drawerRef}
          tabIndex={-1}
          data-music-drawer
          role="dialog"
          aria-label={t("music.dialogAria")}
          aria-hidden={!isOpen}
          inert={!isOpen}
          className="music-drawer"
        >
          <div className="music-drawer-top">
            <button
              type="button"
              data-slot="music-close"
              onClick={close}
              className="music-close-btn"
              aria-label={t("music.closeAria")}
            >
              {t("music.closeHint")}
            </button>
          </div>

          <div className="music-now-playing">
            <img
              src={currentTrack.cover}
              alt=""
              width={78}
              height={78}
              className="music-now-cover"
            />
            <div className="music-now-meta">
              <p className="music-now-title">{currentTrack.title}</p>
              <p className="music-now-artist">{currentTrack.artist}</p>
            </div>
          </div>

          <div className="music-scrubber">
            <div className="music-times">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(safeDuration)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={safeDuration || 1}
              step={0.1}
              value={Math.min(currentTime, safeDuration || 1)}
              onChange={(event) => seek(Number(event.target.value))}
              aria-label={t("music.seekAria")}
              aria-valuetext={`${formatTime(currentTime)} / ${formatTime(safeDuration)}`}
              className="music-range"
              style={{ "--progress": `${progressPct}%` } as CSSProperties}
            />
          </div>

          <div className="music-controls">
            <button
              type="button"
              data-slot="music-prev"
              onClick={prevTrack}
              className="music-control-btn"
              aria-label={t("music.previous")}
            >
              <SkipBack aria-hidden="true" className="size-5 fill-current" />
            </button>

            <button
              type="button"
              data-slot="music-play-toggle"
              onClick={togglePlay}
              className="music-control-btn music-control-btn-play"
              aria-label={isPlaying ? t("music.pause") : t("music.play")}
            >
              {isPlaying ? (
                <Pause aria-hidden="true" className="size-6 fill-current" />
              ) : (
                <Play aria-hidden="true" className="size-6 translate-x-0.5 fill-current" />
              )}
            </button>

            <button
              type="button"
              data-slot="music-next"
              onClick={nextTrack}
              className="music-control-btn"
              aria-label={t("music.next")}
            >
              <SkipForward aria-hidden="true" className="size-5 fill-current" />
            </button>
          </div>

          <ul className="music-tracklist" role="list" aria-label={t("music.playlistAria")}>
            {tracks.map((track, index) => {
              const active = index === currentIndex
              return (
                <li key={track.id}>
                  <button
                    ref={active ? activeRowRef : undefined}
                    type="button"
                    data-slot="music-track"
                    data-active={active}
                    aria-current={active ? "true" : undefined}
                    aria-label={
                      active && isPlaying
                        ? t("music.pauseTrackAria", { title: track.title, artist: track.artist })
                        : t("music.playTrackAria", { title: track.title, artist: track.artist })
                    }
                    onClick={() => selectTrack(index)}
                    className="music-track-row"
                  >
                    <img
                      src={track.cover}
                      alt=""
                      width={42}
                      height={42}
                      loading="lazy"
                      decoding="async"
                      className="music-track-cover"
                    />
                    <span className="music-track-meta">
                      <span className="music-track-title">{track.title}</span>
                      <span className="music-track-artist">{track.artist}</span>
                    </span>
                    {active && (
                      <span className="music-eq" data-playing={isPlaying} aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>
      </div>

      <button
        type="button"
        data-slot="music-card-shield"
        tabIndex={-1}
        aria-label={t("music.closeAria")}
        aria-hidden={!isOpen}
        data-music-card-shield
        data-inverse-cursor-exclude
        onClick={close}
        className="music-card-shield"
      />
    </>,
    document.body,
  )
}
