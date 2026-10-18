/**
 * Hardware feature modules a visitor can place on the card.
 * These are concept options under exploration; none of them is committed hardware.
 * Coordinates are millimetres from the face centre on an 86 × 55 mm card: +x right, +y up.
 * `svg` is the mark drawn on the card face. It uses currentColor so the landing page can tint it
 * and Studio can rasterise it as a single-colour alpha mask.
 */

export type FeatureId = 'nfc' | 'gps' | 'mic' | 'haptics' | 'secure' | 'bluetooth' | 'status'

export interface CardFeature {
  id: FeatureId
  label: string
  /** Short name for chips and lists. */
  short: string
  /** One-line benefit shown in the tooltip. */
  benefit: string
  /** Indicative add-on in GBP. Always labelled as an estimate, never as a price. */
  estGbp: number
  home: { x: number; y: number }
  /** Footprint on the card face in mm. */
  w: number
  h: number
  svg: string
}

export const CARD_MM = { w: 86, h: 55 } as const

export const FEATURES: CardFeature[] = [
  {
    id: 'nfc',
    label: 'NFC',
    short: 'NFC',
    benefit: 'Tap the card to your phone to start a session.',
    estGbp: 6,
    home: { x: -12, y: -3 },
    w: 24,
    h: 15,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 150" fill="none" stroke="currentColor" stroke-width="4"><rect x="4" y="4" width="232" height="142" rx="22"/><rect x="16" y="16" width="208" height="118" rx="16"/><rect x="28" y="28" width="184" height="94" rx="10"/><rect x="40" y="40" width="160" height="70" rx="6"/><path d="M200 75h36"/></svg>`,
  },
  {
    id: 'gps',
    label: 'Location (GPS)',
    short: 'Location',
    benefit: 'Find the card if you leave it somewhere.',
    estGbp: 22,
    home: { x: -24, y: -19 },
    w: 16,
    h: 5,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 50" fill="none" stroke="currentColor"><rect x="2" y="2" width="156" height="46" rx="23" stroke-width="4"/><path stroke-width="2.5" d="M30 14v22M42 14v22M54 14v22M66 14v22M78 14v22M90 14v22M102 14v22M114 14v22M126 14v22"/></svg>`,
  },
  {
    id: 'mic',
    label: 'Microphone (push-to-talk)',
    short: 'Microphone',
    benefit: 'Hold to speak a note straight into your memory.',
    estGbp: 12,
    home: { x: -35, y: -19 },
    w: 4,
    h: 4,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="20" cy="20" r="6.5" fill="currentColor"/></svg>`,
  },
  {
    id: 'haptics',
    label: 'Haptics',
    short: 'Haptics',
    benefit: 'A quiet pulse when an agent reads your memory.',
    estGbp: 8,
    home: { x: 9, y: -5 },
    w: 10,
    h: 10,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor"><circle cx="50" cy="50" r="7" fill="currentColor" stroke="none"/><circle cx="50" cy="50" r="20" stroke-width="3.5"/><circle cx="50" cy="50" r="33" stroke-width="3" stroke-opacity="0.7"/><circle cx="50" cy="50" r="46" stroke-width="2.5" stroke-opacity="0.4"/></svg>`,
  },
  {
    id: 'secure',
    label: 'Secure element',
    short: 'Secure element',
    benefit: 'Encryption keys stay inside tamper-resistant silicon.',
    estGbp: 9,
    home: { x: -32, y: 1 },
    w: 9,
    h: 8,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 80" fill="none" stroke="currentColor" stroke-width="3"><rect x="2" y="2" width="86" height="76" rx="12"/><path d="M2 28h26v24H2M88 28H62v24h26M28 2v26M62 2v26M28 78V52M62 78V52M28 28h34v24H28z"/></svg>`,
  },
  {
    id: 'bluetooth',
    label: 'Bluetooth',
    short: 'Bluetooth',
    benefit: 'Pair with your phone. Unpair and access ends.',
    estGbp: 14,
    home: { x: 12, y: -19.5 },
    w: 14,
    h: 4,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 40" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"><path d="M2 34V6h12v28h12V6h12v28h12V6h12v28h12V6h12v28h12V6h12v28h12V6h10"/></svg>`,
  },
  {
    id: 'status',
    label: 'Status light',
    short: 'Status light',
    benefit: 'Glows softly while an agent has access.',
    estGbp: 4,
    home: { x: 36, y: 21 },
    w: 3.2,
    h: 3.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="16" cy="16" r="7.5" fill="currentColor"/></svg>`,
  },
]

export const FEATURE_BY_ID = Object.fromEntries(FEATURES.map((f) => [f.id, f])) as Record<FeatureId, CardFeature>

export const FEATURE_IDS = FEATURES.map((f) => f.id)

export function isFeatureId(v: unknown): v is FeatureId {
  return typeof v === 'string' && (FEATURE_IDS as string[]).includes(v)
}

/** Studio identifies feature marks by this svgName. */
export function featureSvgName(id: FeatureId) {
  return `feature-${id}.svg`
}

export function featureIdFromSvgName(name: string | null | undefined): FeatureId | null {
  const m = name?.match(/^feature-([a-z]+)\.svg$/)
  return m && isFeatureId(m[1]) ? m[1] : null
}

/** Keeps a feature's whole footprint on the usable face. */
export function clampFeature(id: FeatureId, x: number, y: number) {
  const f = FEATURE_BY_ID[id]
  const mx = CARD_MM.w / 2 - 5 - f.w / 2
  const my = CARD_MM.h / 2 - 4.5 - f.h / 2
  const r = (v: number) => Math.round(v * 2) / 2
  return { x: r(Math.max(-mx, Math.min(mx, x))), y: r(Math.max(-my, Math.min(my, y))) }
}

export function indicativeTotal(ids: FeatureId[]) {
  return ids.reduce((sum, id) => sum + FEATURE_BY_ID[id].estGbp, 0)
}
