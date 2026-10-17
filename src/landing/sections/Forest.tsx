import { useEffect, useRef } from 'react'
import { mountForest } from '@/landing/forest/mountForest'

export function Forest({ reduced }: { reduced: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    return mountForest({ canvas: el, src: '/media/forest.webp', reduced })
  }, [reduced])

  return (
    <section className="forest" id="privacy" aria-labelledby="forest-title">
      <canvas ref={canvas} className="forest-canvas" aria-hidden="true" />
      <div className="forest-copy">
        <p className="eyebrow on-dark">Privacy</p>
        <h2 id="forest-title">Lives with you. Not in a cloud.</h2>
        <p>The encrypted source of truth sits on your device. There is no Mission server holding a copy. An agent sees only what you grant for that session.</p>
      </div>
    </section>
  )
}
