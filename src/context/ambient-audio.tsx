/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

type AmbientAudioContextValue = {
  enabled: boolean
  toggle: () => void
}

const AmbientAudioContext = React.createContext<AmbientAudioContextValue | null>(null)

const STORAGE_KEY = "portfolio:ambient-audio"

function readStoredEnabled(): boolean {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

function writeStoredEnabled(value: boolean) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, value ? "1" : "0")
  } catch {
    // ignore
  }
}

function syncPlayback(audio: HTMLAudioElement, enabled: boolean) {
  audio.muted = !enabled
  if (!enabled || document.hidden) {
    audio.pause()
  } else if (audio.paused) {
    // Browsers can require a user gesture before resuming a saved preference.
    void audio.play().catch(() => {})
  }
}

export function AmbientAudioProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const [enabled, setEnabled] = React.useState(readStoredEnabled)
  const enabledRef = React.useRef(enabled)

  const toggle = React.useCallback(() => {
    const next = !enabledRef.current
    enabledRef.current = next
    setEnabled(next)
    writeStoredEnabled(next)

    if (audioRef.current) syncPlayback(audioRef.current, next)
  }, [])

  React.useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio
    audio.loop = true
    audio.volume = 0.12
    audio.preload = "none"
    audio.src = new URL("../assets/music/background_music.mp3", import.meta.url).toString()

    const updatePlayback = () => syncPlayback(audio, enabledRef.current)
    const resumeOnGesture = () => {
      if (enabledRef.current) updatePlayback()
    }

    document.addEventListener("visibilitychange", updatePlayback)
    window.addEventListener("click", resumeOnGesture, true)
    window.addEventListener("keydown", resumeOnGesture, true)
    updatePlayback()

    return () => {
      document.removeEventListener("visibilitychange", updatePlayback)
      window.removeEventListener("click", resumeOnGesture, true)
      window.removeEventListener("keydown", resumeOnGesture, true)

      audio.pause()
      audio.removeAttribute("src")
      audio.load()
      audioRef.current = null
    }
  }, [])

  const value = React.useMemo(() => ({ enabled, toggle }), [enabled, toggle])

  return <AmbientAudioContext.Provider value={value}>{children}</AmbientAudioContext.Provider>
}

export function useAmbientAudio() {
  const ctx = React.useContext(AmbientAudioContext)
  if (!ctx) throw new Error("useAmbientAudio must be used within AmbientAudioProvider")
  return ctx
}
