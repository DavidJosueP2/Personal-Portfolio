export function scheduleIdle(task: () => void, timeout = 180) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(task, { timeout })
    return () => window.cancelIdleCallback(id)
  }
  const id = window.setTimeout(task, 16)
  return () => window.clearTimeout(id)
}

export function yieldToIdle() {
  return new Promise<void>((resolve) => { scheduleIdle(resolve) })
}
