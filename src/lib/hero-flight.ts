// Shared, transient camera state. The star field and the hero use the same scroll clock.
export const heroFlight = { active: false, progress: 0, covered: false }

export const planetDeparture = { active: false, progress: 0 }
export const planetDepartureTiming = { auroraStart: 0.74, planetGone: 0.85, contactStart: 0.87 } as const

export function updatePlanetDeparture(active: boolean, progress: number) {
  planetDeparture.active = active
  planetDeparture.progress = progress
}

export function updateHeroFlight(active: boolean, progress: number) {
  if (heroFlight.active === active && heroFlight.progress === progress) return
  heroFlight.active = active
  heroFlight.progress = progress
}
