/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

export type Accent = "lime" | "emerald" | "cyan" | "red" | "violet" | "amber"

type AccentThemeContextValue = {
  accent: Accent
  setAccent: (accent: Accent) => void
}

const AccentThemeContext = React.createContext<AccentThemeContextValue | null>(null)

const STORAGE_KEY = "portfolio:accent"

function readStoredAccent(): Accent {
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY)
    if (raw === "lime" || raw === "emerald" || raw === "cyan" || raw === "red" || raw === "violet" || raw === "amber") return raw
    return "emerald"
  } catch {
    return "emerald"
  }
}

function applyAccentToDom(accent: Accent) {
  document.documentElement.dataset.accent = accent
}

export function AccentThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = React.useState<Accent>(() => {
    if (typeof globalThis.window === "undefined") return "emerald"
    return readStoredAccent()
  })

  React.useLayoutEffect(() => {
    // Apply on mount ASAP to avoid a flash of wrong accent
    applyAccentToDom(accent)
  }, [accent])

  const setAccent = React.useCallback((next: Accent) => {
    setAccentState(next)
    try {
      globalThis.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  React.useEffect(() => {
    applyAccentToDom(accent)
  }, [accent])

  const value = React.useMemo(() => ({ accent, setAccent }), [accent, setAccent])

  return <AccentThemeContext.Provider value={value}>{children}</AccentThemeContext.Provider>
}

export function useAccentTheme() {
  const ctx = React.useContext(AccentThemeContext)
  if (!ctx) throw new Error("useAccentTheme must be used within AccentThemeProvider")
  return ctx
}
