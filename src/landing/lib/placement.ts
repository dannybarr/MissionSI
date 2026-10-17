import { isFeatureId, type FeatureId } from '@/shared/card-features'

export interface XY {
  x: number
  y: number
}

export interface FeaturePlacement extends XY {
  id: FeatureId
}

/** What the visitor placed on the landing teaser, in millimetres on the card face. +x right, +y up. */
export interface TeaserPlacement {
  wordmark?: XY
  earth?: XY
  initials?: XY
  features?: FeaturePlacement[]
}

export type IdentityId = 'wordmark' | 'earth' | 'initials'

export const TEASER_KEY = 'mission:teaser-placement'

export const HOME_SLOTS: Record<IdentityId, XY> = {
  wordmark: { x: -22, y: 13.5 },
  earth: { x: 30, y: 15.2 },
  initials: { x: 29.5, y: -15 },
}

export function saveTeaserPlacement(p: TeaserPlacement) {
  try {
    localStorage.setItem(TEASER_KEY, JSON.stringify(p))
  } catch {
    /* storage blocked: the studio link still works, without the placement */
  }
}

function xy(v: unknown): XY | undefined {
  if (!v || typeof v !== 'object') return undefined
  const { x, y } = v as XY
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined
}

export function readTeaserPlacement(): TeaserPlacement | null {
  try {
    const raw = localStorage.getItem(TEASER_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Record<string, unknown>
    if (!p || typeof p !== 'object') return null
    const features = Array.isArray(p.features)
      ? (p.features as unknown[]).flatMap((f) => {
          const pos = xy(f)
          const id = (f as { id?: unknown })?.id
          return pos && isFeatureId(id) ? [{ id, ...pos }] : []
        })
      : []
    const out: TeaserPlacement = { wordmark: xy(p.wordmark), earth: xy(p.earth), initials: xy(p.initials), features }
    return out.wordmark || out.earth || out.initials || features.length ? out : null
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
