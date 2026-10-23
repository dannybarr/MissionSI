import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, prefersStatic, ScrollTrigger } from './motion'

let current: Lenis | null = null

/** Long jumps glide on a fixed-length ease, so a link across several pins never lurches. */
const GLIDE = { duration: 1.5, easing: (t: number) => 1 - Math.pow(1 - t, 4) }

/** Scroll the landing page to a y position, through Lenis when it is running. */
export function scrollToY(y: number) {
  if (current) current.scrollTo(y, GLIDE)
  else window.scrollTo({ top: y, behavior: prefersStatic() ? 'auto' : 'smooth' })
}

/** Smooth scroll for the landing page only. Torn down on leave so Studio is unaffected. */
export function useLandingScroll(reduced: boolean) {
  useEffect(() => {
    if (reduced || prefersStatic()) return
    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 0.95,
      touchMultiplier: 1,
      syncTouch: false,
      autoRaf: false,
      prevent: (node) => !!node.closest?.('.log, .gf-root, [data-lenis-prevent]'),
    })
    current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    ScrollTrigger.config({ ignoreMobileResize: true })
    const onRefresh = () => lenis.resize()
    ScrollTrigger.addEventListener('refresh', onRefresh)
    // Late images can change section heights after the first measure; re-measure once they land.
    const onLoad = () => ScrollTrigger.refresh()
    if (document.readyState !== 'complete') window.addEventListener('load', onLoad, { once: true })
    // Same-page links glide through Lenis. Lenis's own anchor option does not cancel the
    // browser's jump, so the page flashed at the target before gliding there.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]')
      const hash = link?.getAttribute('href')
      if (!hash || hash.length < 2) return
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (!target) return
      e.preventDefault()
      // Land on the section's first frame: pinned and sticky sections start at their top,
      // and every other section carries its own top padding below the fixed nav.
      // A pinned section is measured by its spacer, which stays in the flow while it is fixed.
      const spacer = target.parentElement?.classList.contains('pin-spacer') ? target.parentElement : target
      lenis.scrollTo(spacer, { offset: 0, ...GLIDE })
      if (location.hash !== hash) history.pushState(null, '', hash)
    }
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('load', onLoad)
      ScrollTrigger.removeEventListener('refresh', onRefresh)
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      if (current === lenis) current = null
    }
  }, [reduced])
}
