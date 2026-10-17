import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const DockCanvas = lazy(() => import('./DockCanvas'))

export function DockScroll({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null)
  const progress = useRef(reduced ? 1 : 0)
  const [mount, setMount] = useState(reduced)
  const [phase, setPhase] = useState(reduced ? 2 : 0)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setMount(true)
      },
      { rootMargin: '400px' },
    )
    io.observe(el)
    if (reduced) return () => io.disconnect()
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: '+=180%',
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          progress.current = self.progress
          const bucket = self.progress < 0.38 ? 0 : self.progress < 0.72 ? 1 : 2
          setPhase(bucket)
        },
      })
    }, el)
    return () => {
      io.disconnect()
      ctx.revert()
    }
  }, [reduced])

  const phaseLabel = ['Lowering the card', 'The clamp swings shut', 'The moon lights'][phase]

  return (
    <section className="dock-scene" id="hardware" ref={root}>
      <div className="dock-pin">
        <div className="dock-copy">
          <p className="eyebrow on-dark">The dock</p>
          <h2>A bed for the card. A moon that tells you it’s home.</h2>
          <p>
            Matte grey metal. The card lowers in, the X clamp folds shut from the side, and the split moon lights only when both are true. Concept — not built yet.
          </p>
          <p className="dock-phase" aria-live="polite">
            {phaseLabel}
          </p>
        </div>
        <div className="dock-view">
          {mount ? (
            <Suspense fallback={<div className="dock-fallback" role="img" aria-label="Dock loading" />}>
              <DockCanvas progress={progress} reduced={reduced} />
            </Suspense>
          ) : (
            <div className="dock-fallback" />
          )}
        </div>
      </div>
    </section>
  )
}
