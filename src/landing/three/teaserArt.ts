import type { ArtItem } from './print'

/** Placement artwork shared by the teaser DOM and the card texture. No three.js here. */
let items: ArtItem[] = []
const subs = new Set<() => void>()

export function setTeaserArt(next: ArtItem[]) {
  items = next
  subs.forEach((fn) => fn())
}

export function getTeaserArt() {
  return items
}

export function subscribeTeaserArt(fn: () => void) {
  subs.add(fn)
  return () => subs.delete(fn)
}

/** Body finish and camera view for the studio preview. */
export interface TeaserLook {
  color: string
  metalness: number
  roughness: number
  view: 'front' | 'iso'
}

let look: TeaserLook = { color: '#3d3f43', metalness: 0.62, roughness: 0.56, view: 'front' }
const lookSubs = new Set<() => void>()

export function setTeaserLook(next: Partial<TeaserLook>) {
  look = { ...look, ...next }
  lookSubs.forEach((fn) => fn())
}

export function getTeaserLook() {
  return look
}

export function subscribeTeaserLook(fn: () => void) {
  lookSubs.add(fn)
  return () => lookSubs.delete(fn)
}
