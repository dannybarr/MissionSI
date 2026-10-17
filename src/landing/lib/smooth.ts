import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** Smooth scroll for the landing page only. Torn down on leave so Studio is unaffected. */
export function useLandingScroll(reduced: boolean) {
  useEffect(() => {
    if (reduced) return
    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.92,
      touchMultiplier: 1,
      autoRaf: false,
    })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    const onRefresh = () => lenis.resize()
    ScrollTrigger.addEventListener('refresh', onRefresh)
    return () => {
      ScrollTrigger.removeEventListener('refresh', onRefresh)
      gsap.ticker.remove(tick)
      lenis.destroy()
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [reduced])
}
