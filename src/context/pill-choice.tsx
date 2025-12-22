/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

export type PillChoice = "red" | "blue" | null

type PillChoiceContextValue = {
  choice: PillChoice
  setChoice: (choice: Exclude<PillChoice, null>) => void
  resetChoice: () => void
}

const PillChoiceContext = React.createContext<PillChoiceContextValue | null>(null)

const STORAGE_KEY = "portfolio:pill-choice"

function readStoredChoice(): PillChoice {
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY)
    if (raw === "red" || raw === "blue") return raw
    return null
  } catch {
    return null
  }
}

export function PillChoiceProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [choice, setChoiceState] = React.useState<PillChoice>(() => {
    if (globalThis.window === undefined) return null
    return readStoredChoice()
  })

  const setChoice = React.useCallback((next: Exclude<PillChoice, null>) => {
    setChoiceState(next)
    try {
      globalThis.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  const resetChoice = React.useCallback(() => {
    setChoiceState(null)
    try {
      globalThis.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  React.useEffect(() => {
    // Pill choice feature is paused. Keeping storage + state for later without affecting global theming.
  }, [choice])

  const value = React.useMemo(() => ({ choice, setChoice, resetChoice }), [choice, setChoice, resetChoice])

  return <PillChoiceContext.Provider value={value}>{children}</PillChoiceContext.Provider>
}

export function usePillChoice() {
  const ctx = React.useContext(PillChoiceContext)
  if (!ctx) throw new Error("usePillChoice must be used within PillChoiceProvider")
  return ctx
}
