import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/landing/lib/motion'
import { CardFace } from '@/landing/components/CardFace'
import { AGENT_MARKS } from './marks'

/** Scene coordinates: a 1600 × 1000 box. Laptop deck on the left, port on its right edge at y = 500. */
const PORT_X = 762
const PORT_Y = 500
const CARD_W = 560
const CARD_H = (CARD_W * 550) / 918
const SEATED_LEFT = PORT_X - (58 / 918) * CARD_W + 2
const RING = { x: SEATED_LEFT + ((790 + 58) / 918) * CARD_W, y: PORT_Y - CARD_H / 2 + (65 / 550) * CARD_H }

const AGENTS = [
  { id: 'claude', granted: true, at: { x: 905, y: 150 } },
  { id: 'chatgpt', granted: true, at: { x: 1055, y: 112 } },
  { id: 'gemini', granted: true, at: { x: 1210, y: 96 } },
  { id: 'grok', granted: false, at: { x: 1365, y: 112 } },
  { id: 'ollama', granted: true, at: { x: 1515, y: 150 } },
].map((a) => ({ ...a, mark: AGENT_MARKS.find((m) => m.id === a.id)! }))

const STEPS = [
  { h: 'Slide it in', p: 'The built-in USB-C connector goes straight into your laptop. No cable, no dongle.' },
  { h: 'It wakes up', p: 'A local helper unlocks the memory. The status light comes on.' },
  { h: 'Agents you allow connect', p: 'Each one gets only what you granted. Grok has no grant here, so it gets nothing.' },
  { h: 'Pull it out', p: 'The light goes off and future requests fail. What a provider already received stays under its policy.' },
]

const READOUT = ['Card not connected', 'Connecting · unlocking memory', 'Connected · 4 agents granted · 1 held back', 'Card removed · access ended']

const pct = (x: number, y: number) => ({ left: `${(x / 1600) * 100}%`, top: `${(y / 1000) * 100}%` })

function keys() {
  const out: { x: number; y: number; w: number }[] = []
  const rows = [14, 14, 13, 12, 11]
  rows.forEach((n, r) => {
    let x = -150 + r * 18
    for (let i = 0; i < n; i++) {
      const w = r === 4 && i === 4 ? 230 : 58
      out.push({ x, y: 224 + r * 68, w })
      x += w + 10
    }
  })
  return out.filter((k) => k.x + k.w < 650)
}

const KEYS = keys()

function Laptop() {
  return (
    <svg className="plug-laptop" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="deck" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a3b3f" />
          <stop offset="0.6" stopColor="#2a2b2e" />
          <stop offset="1" stopColor="#202123" />
        </linearGradient>
        <linearGradient id="bevel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a2b2e" />
          <stop offset="0.7" stopColor="#4a4b50" />
          <stop offset="1" stopColor="#141416" />
        </linearGradient>
        <radialGradient id="port-glow">
          <stop offset="0" stopColor="#cfe3ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#cfe3ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="-220" y="108" width={PORT_X + 220} height="784" rx="44" fill="url(#deck)" />
      <rect x="-220" y="108" width={PORT_X + 220} height="46" rx="20" fill="#17181a" />
      <rect x={PORT_X - 18} y="150" width="18" height="700" fill="url(#bevel)" />
      <line x1={PORT_X - 1} y1="160" x2={PORT_X - 1} y2="840" stroke="#fff" strokeOpacity="0.16" strokeWidth="2" />
      {KEYS.map((k, i) => (
        <g key={i}>
          <rect x={k.x} y={k.y} width={k.w} height="58" rx="10" fill="#1b1c1e" />
          <rect x={k.x + 1} y={k.y + 1} width={k.w - 2} height="2" rx="1" fill="#fff" fillOpacity="0.05" />
        </g>
      ))}
      <rect x="100" y="620" width="460" height="230" rx="24" fill="#2f3034" stroke="#fff" strokeOpacity="0.05" />
      {Array.from({ length: 12 }).flatMap((_, r) =>
        Array.from({ length: 3 }).map((__, c) => <circle key={`${r}-${c}`} cx={690 + c * 16} cy={234 + r * 28} r="3.2" fill="#151617" />),
      )}
      <circle className="plug-port-glow" cx={PORT_X} cy={PORT_Y} r="150" fill="url(#port-glow)" />
      <rect x={PORT_X - 22} y={PORT_Y - 24} width="24" height="48" rx="11" fill="#0a0a0b" />
      <rect x={PORT_X - 15} y={PORT_Y - 9} width="10" height="18" rx="3" fill="#2b2c2f" />
    </svg>
  )
}

export function PlugSequence({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null)
  const [phase, setPhase] = useState(reduced ? 2 : 0)
  const [step, setStep] = useState(reduced ? 2 : 0)

  useEffect(() => {
    const el = root.current
    if (reduced) {
      setPhase(2)
      setStep(2)
    }
    if (!el || reduced) return
    const scene = el.querySelector<HTMLElement>('.plug-scene')!
    const card = el.querySelector<HTMLElement>('.plug-card')!
    const lines = el.querySelectorAll<SVGPathElement>('.plug-line')
    const chips = el.querySelectorAll<HTMLElement>('.agent-chip[data-granted="true"]')
    const held = el.querySelector<HTMLElement>('.agent-chip[data-granted="false"]')
    const ctx = gsap.context(() => {
      gsap.set(card, { xPercent: 168, rotation: 4 })
      gsap.set(scene, { '--status': 0, '--port': 0 })
      gsap.set(lines, { strokeDashoffset: 1 })
      gsap.set(chips, { '--on': 0 })
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: '+=320%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress
            const ph = p < 0.31 ? 0 : p < 0.44 ? 1 : p < 0.74 ? 2 : 3
            setPhase((v) => (v === ph ? v : ph))
            const st = p < 0.3 ? 0 : p < 0.42 ? 1 : p < 0.72 ? 2 : 3
            setStep((v) => (v === st ? v : st))
          },
        },
      })
      tl.addLabel('in', 0)
        .to(card, { xPercent: 7, rotation: 0, duration: 0.27, ease: 'power3.out' }, 'in')
        .to(card, { xPercent: -0.8, duration: 0.035, ease: 'power2.in' }, 0.28)
        .to(card, { xPercent: 0, duration: 0.025, ease: 'power1.out' }, 0.315)
        .to(scene, { '--port': 1, duration: 0.06, ease: 'power2.out' }, 0.31)
        .to(scene, { '--status': 1, duration: 0.08, ease: 'power1.inOut' }, 0.34)
        .to(lines, { strokeDashoffset: 0, duration: 0.12, stagger: 0.035, ease: 'power2.inOut' }, 0.44)
        .to(chips, { '--on': 1, duration: 0.06, stagger: 0.035, ease: 'power2.out' }, 0.5)
        .to(held, { '--held': 1, duration: 0.06, ease: 'power2.out' }, 0.62)
        .addLabel('out', 0.74)
        .to(scene, { '--status': 0, duration: 0.03, ease: 'power2.out' }, 'out')
        .to(lines, { strokeDashoffset: -1, duration: 0.08, stagger: { each: 0.015, from: 'end' }, ease: 'power2.in' }, 'out')
        .to(chips, { '--on': 0, duration: 0.06, stagger: { each: 0.015, from: 'end' }, ease: 'power2.in' }, 0.76)
        .to(held, { '--held': 0, duration: 0.04 }, 0.76)
        .to(scene, { '--port': 0, duration: 0.05 }, 0.77)
        .to(card, { xPercent: 4, duration: 0.03, ease: 'power2.in' }, 0.775)
        .to(card, { xPercent: 168, rotation: -3, duration: 0.17, ease: 'power3.in' }, 0.805)
        .to({}, { duration: 0.03 })
    }, el)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section className={`plug ${reduced ? 'is-static' : ''}`} id="hardware" ref={root} aria-labelledby="plug-title">
      <div className="plug-pin">
        <div className="plug-frame">
          <div className="plug-scene" style={reduced ? ({ '--status': 1, '--port': 1 } as React.CSSProperties) : undefined}>
            <div className="plug-card" style={{ left: `${(SEATED_LEFT / 1600) * 100}%`, top: `${((PORT_Y - CARD_H / 2) / 1000) * 100}%`, width: `${(CARD_W / 1600) * 100}%` }}>
              <CardFace plug status={1} className="live-status" alt="The Mission card with its built-in USB-C connector" />
            </div>
            <Laptop />
            <svg className="plug-lines" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="true">
              {AGENTS.filter((a) => a.granted).map((a) => (
                <path
                  key={a.id}
                  className="plug-line"
                  pathLength={1}
                  d={`M${RING.x} ${RING.y} C${RING.x} ${RING.y - 120}, ${a.at.x} ${a.at.y + 170}, ${a.at.x} ${a.at.y + 44}`}
                  style={reduced ? { strokeDashoffset: 0 } : undefined}
                />
              ))}
            </svg>
            <ul className="agent-row" aria-label="Agents">
              {AGENTS.map((a) => (
                <li
                  key={a.id}
                  className="agent-chip"
                  data-granted={a.granted}
                  style={{ ...pct(a.at.x, a.at.y), ['--brand' as string]: a.mark.cloth, ['--brand-ink' as string]: a.mark.ink, ...(reduced ? { '--on': a.granted ? 1 : 0, '--held': a.granted ? 0 : 1 } : {}) } as React.CSSProperties}
                >
                  <span className="agent-dot" dangerouslySetInnerHTML={{ __html: a.mark.svg }} />
                  <span className="agent-text">
                    <span className="agent-name">{a.mark.name}</span>
                    <span className="agent-state">{a.granted ? 'granted' : 'no grant'}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="plug-copy">
          <p className="eyebrow on-dark">
            <i /> Plug in · pull out
          </p>
          <h2 id="plug-title" data-split>
            Your laptop’s new favourite port.
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
