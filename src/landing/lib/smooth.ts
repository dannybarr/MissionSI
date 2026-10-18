import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './motion'

/** Smooth scroll for the landing page only. Torn down on leave so Studio is unaffected. */
export function useLandingScroll(reduced: boolean) {
  useEffect(() => {
    if (reduced) return
    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 0.95,
      touchMultiplier: 1,
      syncTouch: false,
      autoRaf: false,
      anchors: { offset: -24 },
      prevent: (node) => !!node.closest?.('.log, .gf-root, [data-lenis-prevent]'),
    })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    ScrollTrigger.config({ ignoreMobileResize: true })
    const onRefresh = () => lenis.resize()
    ScrollTrigger.addEventListener('refresh', onRefresh)
    return () => {
      ScrollTrigger.removeEventListener('refresh', onRefresh)
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
    }
  }, [reduced])
}
