import { useEffect, useRef } from 'react'
import { mountForest } from '@/landing/forest/mountForest'
import { gsap } from '@/landing/lib/motion'

export function Forest({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    return mountForest({ canvas: el, src: '/media/forest.webp', reduced })
  }, [reduced])

  useEffect(() => {
    const el = root.current
    if (!el || reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.forest-depth',
        { scale: 1.14, yPercent: -4 },
        { scale: 1, yPercent: 4, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 } },
      )
      gsap.fromTo('.forest-veil', { opacity: 1 }, { opacity: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 20%', scrub: 1 } })
    }, el)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section className="forest" id="privacy" aria-labelledby="forest-title" ref={root}>
      <div className="forest-depth">
        <canvas ref={canvas} className="forest-canvas" aria-hidden="true" />
      </div>
      <div className="forest-veil" aria-hidden="true" />
      <div className="forest-copy">
        <p className="eyebrow on-dark" data-reveal>
          <i /> Privacy
        </p>
        <h2 id="forest-title" data-split>
          Lives with you. Not in a cloud.
        </h2>
        <p data-reveal>The encrypted source of truth sits on your card. There is no Mission server holding a copy. An agent sees only what you grant for that session.</p>
      </div>
    </section>
  )
}
