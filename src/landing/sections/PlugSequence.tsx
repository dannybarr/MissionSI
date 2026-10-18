import { useEffect, useRef, useState } from 'react'
import { gsap, prefersStatic } from '@/landing/lib/motion'
import { CardFace } from '@/landing/components/CardFace'
import { AGENT_MARKS } from './marks'

const AGENTS = ['claude', 'chatgpt', 'gemini', 'grok', 'ollama'].map((id) => {
  const mark = AGENT_MARKS.find((m) => m.id === id)!
  return { ...mark, granted: id !== 'grok' }
})

const STEPS = [
  { h: 'Plug in the cable', p: 'A USB-C cable runs from the laptop into the port on the card’s left edge.' },
  { h: 'It wakes up', p: 'A local helper unlocks the memory. The status light comes on.' },
  { h: 'Agents you allow connect', p: 'Each one gets only what you granted. Grok has no grant here, so it gets nothing.' },
  { h: 'Or pair a phone', p: 'The same card speaks Bluetooth. Pair it, and the phone can ask. Unpair, and access ends.' },
  { h: 'Disconnect', p: 'Pull the cable or end the pairing. Future requests fail. What a provider already received stays under its policy.' },
]

const READOUT = ['Cable not connected', 'Connecting · unlocking memory', 'Connected · 4 agents granted · 1 held back', 'Paired with iPhone', 'Disconnected · access ended']

export function PlugSequence({ reduced }: { reduced: boolean }) {
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
          end: '+=280%',
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress
            const ph = p < 0.18 ? 0 : p < 0.32 ? 1 : p < 0.55 ? 2 : p < 0.78 ? 3 : 4
            const st = p < 0.16 ? 0 : p < 0.3 ? 1 : p < 0.48 ? 2 : p < 0.7 ? 3 : 4
            setPhase((v) => (v === ph ? v : ph))
            setStep((v) => (v === st ? v : st))
          },
        },
      })
      tl.to(scene, { '--cable': 1, duration: 0.22, ease: 'power2.inOut' }, 0.08)
        .to(scene, { '--status': 1, duration: 0.08, ease: 'power1.inOut' }, 0.26)
        .to(scene, { '--on': 1, duration: 0.16, ease: 'power1.inOut' }, 0.34)
        .to(scene, { '--phone': 1, duration: 0.16, ease: 'power1.inOut' }, 0.56)
        .to(scene, { '--status': 0.35, '--on': 0, '--cable': 0, '--off': 1, duration: 0.14 }, 0.82)
    }, el)
    return () => ctx.revert()
  }, [reduced])

  const live = reduced ? ({ '--cable': 1, '--status': 1, '--on': 1, '--phone': 0, '--off': 0 } as React.CSSProperties) : undefined

  return (
    <section className={`plug conn ${reduced ? 'is-static' : ''}`} id="hardware" ref={root} aria-labelledby="plug-title">
      <div className="plug-pin">
        <div className="conn-scene" style={live}>
          <div className="conn-laptop">
            <div className="mbp">
              <div className="mbp-lid">
                <div className="mbp-notch" aria-hidden="true" />
                <div className="mbp-screen">
                  <p className="mbp-kicker">Mission</p>
                  <ul>
                    {AGENTS.map((a) => (
                      <li key={a.id} style={{ ['--brand' as string]: a.cloth, ['--granted' as string]: a.granted ? 1 : 0 }}>
                        <span dangerouslySetInnerHTML={{ __html: a.svg }} />
                        <b>{a.name}</b>
                        <em>{a.granted ? 'granted' : 'no grant'}</em>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mbp-deck" aria-hidden="true">
                <div className="mbp-keys" />
                <div className="mbp-track" />
              </div>
            </div>
          </div>

          <svg className="conn-cable" viewBox="0 0 240 80" aria-hidden="true">
            <path pathLength={1} d="M8 40 C 70 40, 90 18, 140 28 S 200 58, 232 40" />
            <circle cx="8" cy="40" r="5" />
            <rect x="224" y="32" width="14" height="16" rx="3" />
          </svg>

          <div className="conn-card">
            <CardFace plug status={1} className="live-status" alt="The Mission card, USB-C port on the left edge" />
          </div>

          <div className="conn-phone" aria-hidden="true">
            <div className="phone">
              <div className="phone-screen">
                <div className="phone-island" />
                <div className="phone-bar"><b>9:41</b></div>
                <div className="phone-pair">
                  <span />
                  <span />
                  <strong>Mission</strong>
                  <em>Bluetooth pairing</em>
                </div>
              </div>
            </div>
          </div>
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
        <p className="plug-fine">Concept animation. The card has not been manufactured yet.</p>
      </div>
    </section>
  )
}
