// Shared, transient camera state. The star field and the hero use the same scroll clock.
export const heroFlight = { active: false, progress: 0, covered: false }

export const planetDeparture = { active: false, progress: 0 }

export function updatePlanetDeparture(active: boolean, progress: number) {
  planetDeparture.active = active
  planetDeparture.progress = progress
}

export function updateHeroFlight(active: boolean, progress: number) {
  if (heroFlight.active === active && heroFlight.progress === progress) return
  heroFlight.active = active
  heroFlight.progress = progress
}
