import { useEffect, useId, useRef, useState } from 'react'
import { gsap, prefersStatic } from '@/landing/lib/motion'
import { CardFace } from '@/landing/components/CardFace'

const STEPS = [
  { h: 'Plug in the cable', p: 'A USB-C cable runs from the laptop into the port on the card’s left edge.' },
  { h: 'It wakes up', p: 'A local helper unlocks the memory. The status light comes on.' },
  { h: 'Agents you allow connect', p: 'Each one gets only what you granted. Grok has no grant here, so it gets nothing.' },
  { h: 'Or pair a phone', p: 'The same card speaks Bluetooth. Pair it, and the phone can ask. Unpair, and access ends.' },
  { h: 'Disconnect', p: 'Pull the cable or end the pairing. Future requests fail. What a provider already received stays under its policy.' },
]

const READOUT = ['Cable not connected', 'Connecting · unlocking memory', 'Connected · 4 agents granted · 1 held back', 'Paired with iPhone', 'Disconnected · access ended']

export function PlugSequence({ reduced }: { reduced: boolean }) {
  const cableId = useId().replace(/:/g, '')
  const root = useRef<HTMLElement>(null)
  const [phase, setPhase] = useState(reduced ? 2 : 0)
  const [step, setStep] = useState(reduced ? 2 : 0)

  useEffect(() => {
    if (reduced || prefersStatic()) {
      setPhase(2)
      setStep(2)
      return
    }
    const el = root.current
    if (!el) return
    const scene = el.querySelector<HTMLElement>('.conn-scene')!
    const ctx = gsap.context(() => {
      gsap.set(scene, { '--cable': 0, '--status': 0, '--on': 0, '--phone': 0, '--off': 0 })
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: '+=220%',
          pin: true,
          // Lenis already smooths the scroll; matching every pin to scrub: true keeps one feel.
          scrub: true,
          onUpdate: (self) => {
            const p = self.progress
            const ph = p < 0.18 ? 0 : p < 0.32 ? 1 : p < 0.55 ? 2 : p < 0.78 ? 3 : 4
            const st = p < 0.16 ? 0 : p < 0.3 ? 1 : p < 0.48 ? 2 : p < 0.7 ? 3 : 4
            setPhase((v) => (v === ph ? v : ph))
            setStep((v) => (v === st ? v : st))
          },
        },
      })
      // Steps overlap and fill the whole pin, so every stretch of scroll moves the scene.
      tl.to(scene, { '--cable': 1, duration: 0.28, ease: 'power2.inOut' }, 0)
        .to(scene, { '--status': 1, duration: 0.12, ease: 'power1.inOut' }, 0.22)
        .to(scene, { '--on': 1, duration: 0.22, ease: 'power1.inOut' }, 0.3)
        .to(scene, { '--phone': 1, duration: 0.26, ease: 'power1.inOut' }, 0.48)
        .to(scene, { '--status': 0.35, '--on': 0, '--cable': 0, '--off': 1, duration: 0.28, ease: 'power1.inOut' }, 0.72)
    }, el)
    return () => ctx.revert()
  }, [reduced])

  const live = reduced ? ({ '--cable': 1, '--status': 1, '--on': 1, '--phone': 0, '--off': 0 } as React.CSSProperties) : undefined

  return (
    <section className={`plug conn ${reduced ? 'is-static' : ''}`} id="hardware" ref={root} aria-labelledby="plug-title">
      <div className="plug-pin">
        <div className="conn-scene" style={live}>
          <figure className="conn-laptop conn-device-photo">
            <img src="/media/product/apple-macbook-pro.jpg" alt="MacBook Pro computers, official Apple product photograph" width={600} height={600} loading="lazy" />
            <figcaption>MacBook Pro · Apple photography</figcaption>
          </figure>

          <svg className="conn-cable" viewBox="0 0 240 80" aria-hidden="true">
            <defs>
              <linearGradient id={cableId} x2="0" y2="1">
                <stop offset="0" stopColor="#fffdf7" />
                <stop offset="0.5" stopColor="#e7e3db" />
                <stop offset="1" stopColor="#bab8b3" />
              </linearGradient>
            </defs>
            <path d="M0 40 C50 40 38 72 102 72 S178 40 216 40" style={{ stroke: `url(#${cableId})` }} />
            <rect x="-8" y="34" width="20" height="12" rx="4" fill="#efece5" />
            <g className="conn-tip">
              <rect x="212" y="36" width="10" height="8" rx="3" fill="#e6e2da" />
              <rect x="218" y="33" width="17" height="14" rx="4" fill="#f4f1eb" />
              <rect x="234" y="35" width="8" height="10" rx="2" fill="#c4c8cc" />
            </g>
          </svg>

          <div className="conn-card">
            <CardFace plug status={1} className="live-status" alt="The Mission card, USB-C port on the left edge" />
          </div>

          <figure className="conn-phone conn-device-photo" aria-hidden="true">
            <img src="/media/product/apple-iphone-pro.jpg" alt="" width={600} height={600} loading="lazy" />
            <figcaption>iPhone 16 Pro · Apple photography</figcaption>
          </figure>
        </div>

        <div className="plug-copy">
          <p className="eyebrow on-dark">
            <i /> Cable or Bluetooth
          </p>
          <h2 id="plug-title" data-split>
            Connect it. Then take it back.
          </h2>
          <ol className="plug-steps">
            {STEPS.map((s, i) => (
              <li key={s.h} className={i === step ? 'on' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
                <span className="n">0{i + 1}</span>
                <span>
                  <b>{s.h}</b>
                  <span>{s.p}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <p className={`plug-readout phase-${phase}`} aria-live="polite">
          <i aria-hidden="true" />
          {READOUT[phase]}
        </p>
        <p className="plug-fine">Concept animation. Apple device photography is illustrative; no Apple affiliation. The Mission card has not been manufactured.</p>
      </div>
    </section>
  )
}
