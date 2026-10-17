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
