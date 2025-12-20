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
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (raw === "0") return false
    if (raw === "1") return true
    return true
  } catch {
    return true
  }
}

function writeStoredEnabled(value: boolean) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, value ? "1" : "0")
  } catch {
    // ignore
  }
}

function isNotAllowedError(err: unknown) {
  return err instanceof DOMException && err.name === "NotAllowedError"
}

export function AmbientAudioProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const [enabled, setEnabled] = React.useState<boolean>(() => readStoredEnabled())

  const enabledRef = React.useRef(enabled)
  React.useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  const toggle = React.useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      writeStoredEnabled(next)

      const audio = audioRef.current
      if (!audio) return next

      if (!next) {
        audio.muted = true
        audio.pause()
        return next
      }

      // Turning ON: try to play. If blocked, it will be unlocked on the next user gesture.
      audio.muted = false
      void audio.play().catch(() => {
        // Intentionally swallow: browser policy may block; we unlock on gesture.
      })

      return next
    })
  }, [])

  React.useEffect(() => {
    const audio = new Audio(new URL("../assets/music/background_music.mp3", import.meta.url).toString())
    audioRef.current = audio

    audio.loop = true
    audio.volume = 0.12
    audio.preload = "auto"

    // Best-effort: start playback immediately in a policy-compliant way.
    // Many browsers allow autoplay ONLY if muted.
    const startMutedAutoplay = async () => {
      audio.muted = true
      try {
        await audio.play()
      } catch (err) {
        if (!isNotAllowedError(err)) {
          // Non-policy errors should not be silent.
          // eslint-disable-next-line no-console
          console.warn("Ambient audio: failed to start muted autoplay", err)
        }
      }
    }

    const resumeIfVisible = async () => {
      if (globalThis.document?.visibilityState !== "visible") return
      if (!enabledRef.current) return

      // If we already started muted autoplay, unmute if possible.
      audio.muted = false
      try {
        await audio.play()
      } catch (err) {
        // If blocked, we will try again on the next user gesture.
        if (!isNotAllowedError(err)) {
          // eslint-disable-next-line no-console
          console.warn("Ambient audio: resume failed", err)
        }
      }
    }

    const onVisibilityChange = () => {
      if (globalThis.document?.visibilityState === "visible") {
        void resumeIfVisible()
      } else {
        audio.pause()
      }
    }

    // Unlock on *any* user gesture. Scroll/wheel counts as a real gesture in many browsers.
    const unlockOnGesture = () => {
      void resumeIfVisible()
    }

    globalThis.document?.addEventListener("visibilitychange", onVisibilityChange)

    // Capture early to run before other handlers.
    globalThis.window?.addEventListener("pointerdown", unlockOnGesture, { capture: true, passive: true })
    globalThis.window?.addEventListener("keydown", unlockOnGesture, { capture: true })
    globalThis.window?.addEventListener("touchstart", unlockOnGesture, { capture: true, passive: true })
    globalThis.window?.addEventListener("wheel", unlockOnGesture, { capture: true, passive: true })
    globalThis.window?.addEventListener("scroll", unlockOnGesture, { capture: true, passive: true })

    void startMutedAutoplay().then(() => {
      // If user has sound enabled by default and browser allows it (rare), try to unmute.
      void resumeIfVisible()
    })

    return () => {
      globalThis.document?.removeEventListener("visibilitychange", onVisibilityChange)
      globalThis.window?.removeEventListener("pointerdown", unlockOnGesture, { capture: true } as any)
      globalThis.window?.removeEventListener("keydown", unlockOnGesture, { capture: true } as any)
      globalThis.window?.removeEventListener("touchstart", unlockOnGesture, { capture: true } as any)
      globalThis.window?.removeEventListener("wheel", unlockOnGesture, { capture: true } as any)
      globalThis.window?.removeEventListener("scroll", unlockOnGesture, { capture: true } as any)

      audio.pause()
      audio.src = ""
      audioRef.current = null
    }
  }, [])

  // Keep runtime state in sync with the audio element.
  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!enabled) {
      audio.muted = true
      audio.pause()
      return
    }

    // Enabled: best effort to unmute + play.
    if (globalThis.document?.visibilityState === "visible") {
      audio.muted = false
      void audio.play().catch(() => {})
    }
  }, [enabled])

  const value = React.useMemo(() => ({ enabled, toggle }), [enabled, toggle])

  return <AmbientAudioContext.Provider value={value}>{children}</AmbientAudioContext.Provider>
}

export function useAmbientAudio() {
  const ctx = React.useContext(AmbientAudioContext)
  if (!ctx) throw new Error("useAmbientAudio must be used within AmbientAudioProvider")
  return ctx
}
