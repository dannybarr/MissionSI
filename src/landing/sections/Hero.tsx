import { useEffect, useRef } from 'react'
import { EASE, gsap } from '@/landing/lib/motion'
import { Magnetic } from '@/landing/components/Magnetic'
import { CardFace } from '@/landing/components/CardFace'

export function Hero({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el || reduced) return
    const float = el.querySelector<HTMLElement>('.hero-float')!
    const tilt = el.querySelector<HTMLElement>('.hero-tilt')!
    const shadow = el.querySelector<HTMLElement>('.hero-shadow')!
    const face = el.querySelector<HTMLElement>('.hero-card')!
    const copy = el.querySelector<HTMLElement>('.hero-copy')!
    const specs = el.querySelectorAll<HTMLElement>('.hero-specs li')

    const ctx = gsap.context(() => {
      gsap.set(face, { '--status': 0 })
      const intro = gsap.timeline({ delay: 0.25 })
      intro
        .from(float, { xPercent: 22, yPercent: -6, rotation: 9, opacity: 0, duration: 1.7, ease: EASE.arrive })
        .from(tilt, { rotationY: -28, rotationX: 10, duration: 2, ease: EASE.out }, 0)
        .from(shadow, { scaleX: 0.55, opacity: 0, duration: 1.7, ease: EASE.arrive }, 0)
        .from(specs, { y: 12, opacity: 0, duration: 0.8, stagger: 0.07, ease: EASE.out, clearProps: 'transform,opacity' }, 0.9)
        // the light wakes once the card has come to rest: a quick catch, a dip, then steady
        .to(face, { '--status': 0.85, duration: 0.18, ease: 'power2.out' }, 1.45)
        .to(face, { '--status': 0.35, duration: 0.22, ease: 'power1.in' }, '>')
        .to(face, { '--status': 1, duration: 0.6, ease: EASE.out }, '>')
        .add(() => {
          gsap.to(face, { '--status': 0.62, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        })

      gsap.to(float, {
        yPercent: 18,
        rotation: -3.5,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 0.8 },
      })
      gsap.to(shadow, {
        scaleX: 0.7,
        opacity: 0.35,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 0.8 },
      })
      gsap.to(copy, {
        yPercent: -14,
        opacity: 0.25,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 0.6 },
      })
    }, el)

    let off = () => {}
    if (window.matchMedia('(pointer: fine)').matches) {
      const rx = gsap.quickTo(tilt, 'rotationX', { duration: 1.1, ease: 'power3.out' })
      const ry = gsap.quickTo(tilt, 'rotationY', { duration: 1.1, ease: 'power3.out' })
      const onMove = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5
        const ny = e.clientY / window.innerHeight - 0.5
        ry(nx * 14)
        rx(-ny * 10)
      }
      const onLeave = () => {
        rx(0)
        ry(0)
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', onLeave)
      off = () => {
        window.removeEventListener('pointermove', onMove)
        document.documentElement.removeEventListener('pointerleave', onLeave)
      }
    }
    return () => {
      off()
      ctx.revert()
    }
  }, [reduced])

  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero-copy">
        <p className="eyebrow" data-testid="status-prototype" data-reveal data-reveal-now data-delay="0.15">
          <i />
          In development · not taking orders
        </p>
        <h1 data-split="now" data-delay="0.25">
          A personal AI memory, encrypted on a card you own.
        </h1>
        <p className="lede" data-reveal data-reveal-now data-delay="0.7">
          Plug it in and every AI knows you. Unplug it and their access ends.
        </p>
        <div className="hero-actions" data-reveal="stagger" data-reveal-now data-delay="0.85">
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

      <div className="hero-object">
        <div className="hero-float">
          <div className="hero-tilt">
            <CardFace status={1} className="hero-card live-status" />
          </div>
        </div>
        <span className="hero-shadow" aria-hidden="true" />
        <ul className="hero-specs" aria-label="Concept card">
          <li>
            <b>86 × 55 mm</b> graphite
          </li>
          <li>
            <b>Built-in</b> USB-C
          </li>
          <li>
            <b>Status</b> light
          </li>
          <li className="hero-specs-note">Concept · not manufactured</li>
        </ul>
      </div>
    </section>
  )
}
