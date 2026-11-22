/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { musicTracks, type MusicTrack } from "@/data/music-tracks"
import { setPageScrollPaused } from "@/lib/section-stack"
import { prefersReducedMotion } from "@/lib/motion"
import { MusicPlayerDrawer } from "@/components/music/MusicPlayerDrawer"

const TRACK_SESSION_KEY = "portfolio:music-track-index"
const DEFAULT_VOLUME = 0.38
const CLOSE_TRANSITION_MS = 560

type AmbientAudioContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggleDrawer: () => void
  tracks: readonly MusicTrack[]
  currentTrack: MusicTrack
  currentIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  togglePlay: () => void
  selectTrack: (index: number) => void
  nextTrack: () => void
  prevTrack: () => void
  seek: (seconds: number) => void
}

const AmbientAudioContext = React.createContext<AmbientAudioContextValue | null>(null)

function readInitialTrackIndex(): number {
  try {
    const raw = globalThis.sessionStorage?.getItem(TRACK_SESSION_KEY)
    const parsed = raw !== null ? Number.parseInt(raw, 10) : Number.NaN
    if (Number.isInteger(parsed) && parsed >= 0 && parsed < musicTracks.length) {
      return parsed
    }
  } catch {
    // Ignore storage errors in restricted browsing modes.
  }
  return 0
}

function writeTrackIndex(index: number) {
  try {
    globalThis.sessionStorage?.setItem(TRACK_SESSION_KEY, String(index))
  } catch {
    // Ignore storage errors.
  }
}

function isEditableElement(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']"))
}

function syncViewportVars() {
  const root = document.documentElement
  const vh = window.innerHeight
  const maxScroll = Math.max(0, root.scrollHeight - vh)
  const sy = Math.max(0, Math.min(window.scrollY, maxScroll))
  root.style.setProperty("--music-scroll-y", `${sy}px`)
  root.style.setProperty("--music-vh", `${vh}px`)
}

function clearViewportVars() {
  const root = document.documentElement
  root.style.removeProperty("--music-scroll-y")
  root.style.removeProperty("--music-vh")
}

export function AmbientAudioProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const loadedTrackIdRef = React.useRef<string | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentIndex, setCurrentIndex] = React.useState(readInitialTrackIndex)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(() => musicTracks[readInitialTrackIndex()].duration)

  const isOpenRef = React.useRef(isOpen)
  const currentIndexRef = React.useRef(currentIndex)
  const isPlayingRef = React.useRef(isPlaying)
  const openFrameRef = React.useRef(0)
  const closeTimerRef = React.useRef(0)

  React.useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  React.useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  React.useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  const loadAndPlay = React.useCallback((index: number, autoPlay: boolean) => {
    const safeIndex = ((index % musicTracks.length) + musicTracks.length) % musicTracks.length
    const track = musicTracks[safeIndex]
    const audio = audioRef.current

    currentIndexRef.current = safeIndex
    setCurrentIndex(safeIndex)
    setCurrentTime(0)
    setDuration(track.duration)
    writeTrackIndex(safeIndex)

    if (!audio) return
    if (loadedTrackIdRef.current !== track.id) {
      audio.src = track.src
      loadedTrackIdRef.current = track.id
    }
    audio.currentTime = 0

    if (autoPlay) {
      void audio.play().catch(() => {
        setIsPlaying(false)
      })
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }, [])

  const togglePlay = React.useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    const track = musicTracks[currentIndexRef.current]
    if (loadedTrackIdRef.current !== track.id) {
      audio.src = track.src
      loadedTrackIdRef.current = track.id
    }

    if (audio.paused) {
      void audio.play().catch(() => {
        setIsPlaying(false)
      })
    } else {
      audio.pause()
    }
  }, [])

  const selectTrack = React.useCallback((index: number) => {
    if (index === currentIndexRef.current) {
      togglePlay()
      return
    }
    loadAndPlay(index, true)
  }, [loadAndPlay, togglePlay])

  const nextTrack = React.useCallback(() => {
    loadAndPlay(currentIndexRef.current + 1, true)
  }, [loadAndPlay])

  const prevTrack = React.useCallback(() => {
    const audio = audioRef.current
    if (audio && loadedTrackIdRef.current === musicTracks[currentIndexRef.current].id && audio.currentTime > 3) {
      audio.currentTime = 0
      setCurrentTime(0)
      if (isPlayingRef.current && audio.paused) {
        void audio.play().catch(() => {})
      }
      return
    }
    loadAndPlay(currentIndexRef.current - 1, true)
  }, [loadAndPlay])

  const seek = React.useCallback((seconds: number) => {
    const audio = audioRef.current
    const track = musicTracks[currentIndexRef.current]
    const max = audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : track.duration
    const clamped = Math.max(0, Math.min(seconds, max))
    setCurrentTime(clamped)

    if (!audio) return
    if (loadedTrackIdRef.current !== track.id) {
      audio.src = track.src
      loadedTrackIdRef.current = track.id
    }
    audio.currentTime = clamped
  }, [])

  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])
  const toggleDrawer = React.useCallback(() => setIsOpen((prev) => !prev), [])

  // Audio element lifecycle
  React.useEffect(() => {
    const audio = new Audio()
    audio.preload = "none"
    audio.volume = DEFAULT_VOLUME
    audioRef.current = audio

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => {
      loadAndPlay(currentIndexRef.current + 1, true)
    }

    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("loadedmetadata", onDuration)
    audio.addEventListener("durationchange", onDuration)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", onEnded)

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("loadedmetadata", onDuration)
      audio.removeEventListener("durationchange", onDuration)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnded)
      audio.pause()
      audio.removeAttribute("src")
      audio.load()
      audioRef.current = null
      loadedTrackIdRef.current = null
    }
  }, [loadAndPlay])

  // Global keyboard shortcuts: M toggles drawer, Escape closes drawer
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpenRef.current) {
        event.preventDefault()
        setIsOpen(false)
        return
      }

      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.key.toLowerCase() !== "m"
      ) {
        return
      }
      if (isEditableElement(event.target)) return
      if (document.querySelector("[data-hero-intro][data-intro-active]")) return
      if (document.querySelector('[role="dialog"]:not([data-music-drawer])')) return

      event.preventDefault()
      setIsOpen((prev) => !prev)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // Card-shift animation & viewport scroll lock sync
  React.useEffect(() => {
    const root = document.documentElement
    window.cancelAnimationFrame(openFrameRef.current)
    window.clearTimeout(closeTimerRef.current)

    if (isOpen) {
      syncViewportVars()
      setPageScrollPaused(true)
      root.dataset.musicActive = ""

      openFrameRef.current = window.requestAnimationFrame(() => {
        openFrameRef.current = window.requestAnimationFrame(() => {
          root.dataset.musicOpen = ""
        })
      })

      const blockOutsideScroll = (event: Event) => {
        if (event.target instanceof Element && event.target.closest("[data-music-drawer]")) return
        if (event.cancelable) event.preventDefault()
      }

      const blockScrollKeys = (event: KeyboardEvent) => {
        if (event.target instanceof Element && event.target.closest("[data-music-drawer]")) return
        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
          event.preventDefault()
        }
      }

      const onResize = () => syncViewportVars()

      window.addEventListener("wheel", blockOutsideScroll, { capture: true, passive: false })
      window.addEventListener("touchmove", blockOutsideScroll, { capture: true, passive: false })
      window.addEventListener("keydown", blockScrollKeys, { capture: true })
      window.addEventListener("resize", onResize)

      return () => {
        window.cancelAnimationFrame(openFrameRef.current)
        window.removeEventListener("wheel", blockOutsideScroll, { capture: true })
        window.removeEventListener("touchmove", blockOutsideScroll, { capture: true })
        window.removeEventListener("keydown", blockScrollKeys, { capture: true })
        window.removeEventListener("resize", onResize)
      }
    }

    delete root.dataset.musicOpen
    const finishClose = () => {
      if (isOpenRef.current) return
      delete root.dataset.musicActive
      clearViewportVars()
      setPageScrollPaused(false)
    }

    if (!root.hasAttribute("data-music-active")) {
      setPageScrollPaused(false)
      return
    }

    if (prefersReducedMotion()) {
      finishClose()
      return
    }

    closeTimerRef.current = window.setTimeout(finishClose, CLOSE_TRANSITION_MS)
    return () => {
      window.clearTimeout(closeTimerRef.current)
    }
  }, [isOpen])

  // Cleanup DOM flags on provider unmount
  React.useEffect(() => {
    return () => {
      window.cancelAnimationFrame(openFrameRef.current)
      window.clearTimeout(closeTimerRef.current)
      delete document.documentElement.dataset.musicOpen
      delete document.documentElement.dataset.musicActive
      clearViewportVars()
      setPageScrollPaused(false)
    }
  }, [])

  const currentTrack = musicTracks[currentIndex]

  const value = React.useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggleDrawer,
      tracks: musicTracks,
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
    }),
    [
      isOpen,
      open,
      close,
      toggleDrawer,
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
    ],
  )

  return (
    <AmbientAudioContext.Provider value={value}>
      {children}
      <MusicPlayerDrawer />
    </AmbientAudioContext.Provider>
  )
}

export function useAmbientAudio() {
  const ctx = React.useContext(AmbientAudioContext)
  if (!ctx) throw new Error("useAmbientAudio must be used within AmbientAudioProvider")
  return ctx
}
