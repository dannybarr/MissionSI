import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Magnetic } from '@/landing/components/Magnetic'
import { CardFace } from '@/landing/components/CardFace'

gsap.registerPlugin(ScrollTrigger)

export function Hero({ reduced }: { reduced: boolean }) {
  const card = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (reduced) return
    const el = card.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', delay: 0.15 },
      )
      gsap.to(el, {
        y: -48,
        ease: 'none',
        scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: 0.6 },
      })
    })
    return () => ctx.revert()
  }, [reduced])

  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow" data-testid="status-prototype">
          <i />
          In development · not taking orders
        </p>
        <h1>
          A personal AI memory,
          <br />
          encrypted on a card you own.
        </h1>
        <p className="lede">
          Mission keeps what an agent should know about you on a device you carry. Plug in to use it. Pull out, and future access stops. Nothing is stored in a Mission cloud.
        </p>
        <div className="hero-actions">
          <Magnetic>
            <a className="btn btn-ink" href="/studio" data-testid="link-hero-studio">
              Design and reserve yours <span aria-hidden="true">→</span>
            </a>
          </Magnetic>
          <a className="btn btn-line" href="#how" data-testid="link-hero-how">
            See how it works
          </a>
        </div>
      </div>
      <div className="hero-object" ref={card}>
        <CardFace />
      </div>
    </section>
  )
}
