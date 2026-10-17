/** Placements chosen on the landing teaser, in millimetres on the card face. +x right, +y up. */
export interface TeaserPlacement {
  wordmark: { x: number; y: number }
  earth: { x: number; y: number }
  initials: { x: number; y: number }
}

export const TEASER_KEY = 'mission:teaser-placement'

export const HOME_SLOTS: TeaserPlacement = {
  wordmark: { x: -24, y: 14 },
  earth: { x: 22, y: 12 },
  initials: { x: 26, y: -14 },
}

export function saveTeaserPlacement(p: TeaserPlacement) {
  try {
    localStorage.setItem(TEASER_KEY, JSON.stringify(p))
  } catch {
    /* storage blocked: the studio link still works, without the placement */
  }
}

export function readTeaserPlacement(): TeaserPlacement | null {
  try {
    const raw = localStorage.getItem(TEASER_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as TeaserPlacement
    if (!p?.wordmark || !p.earth || !p.initials) return null
    return p
  } catch {
    return null
  }
}

export function clearTeaserPlacement() {
  try {
    localStorage.removeItem(TEASER_KEY)
  } catch {
    /* ignore */
  }
}
