import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase)

/**
 * The landing page's motion vocabulary. Everything eases out long and settles softly;
 * nothing bounces unless it is physically landing on something.
 */
export const EASE = {
  /** Long, quiet deceleration for type and copy. */
  out: CustomEase.create('m-out', '0.16, 1, 0.3, 1'),
  /** Objects arriving: a touch more push at the start. */
  arrive: CustomEase.create('m-arrive', '0.22, 1, 0.36, 1'),
  /** Symmetric move for scrubbed transitions. */
  inOut: CustomEase.create('m-inout', '0.65, 0, 0.35, 1'),
  /** Falling under gravity. */
  fall: CustomEase.create('m-fall', '0.55, 0, 0.85, 0.36'),
}

export const DUR = { type: 1.15, copy: 0.9, object: 1.4 }

/** True when the page should stay static. Checked inside effects because the reduced prop flips after the first effect flush. */
export function prefersStatic() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(window.location.search).has('reduced')
}

export { gsap, ScrollTrigger, SplitText }
