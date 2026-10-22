import { useEffect, useRef } from 'react'
import { EASE, gsap, prefersStatic } from '@/landing/lib/motion'
import { Custody, addCustody, settleCustody } from '@/landing/sections/Custody'

const LINES = ['Your memory.', 'Any agent.', 'Nobody else.']

const FACTS = [
  { k: 'On you', d: 'Encrypted on a card you carry. Disconnect, and future access stops.' },
  { k: 'Any agent', d: 'Claude, ChatGPT, Grok and any client that speaks MCP. None of them keeps the source.' },
  { k: 'No cloud copy', d: 'There is no Mission server holding your memory.' },
  { k: 'Per agent', d: 'You grant what each session may read. The rest stays on the card.' },
  { k: 'A local log', d: 'Grants, refusals and shares are written where you can read them.' },
  { k: '£249', d: 'Founding target for the custom card. No orders, deposits or ship date.' },
  { k: 'Open protocol', d: 'Built on MCP, so new agents can connect without new hardware.' },
]

export function Statement({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = root.current
    const row = track.current
    if (!section || !row) return
    if (reduced || prefersStatic()) {
      settleCustody(section)
      return
    }
    const words = section.querySelectorAll<HTMLElement>('[data-word]')
    const facts = row.querySelectorAll<HTMLElement>('.fact')
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=300%',
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
      // The custody story plays beside the headline while its words light up.
      const told = addCustody(tl, section, 0)
      words.forEach((word, i) => {
        tl.fromTo(word, { opacity: 0.14, yPercent: 14 }, { opacity: 1, yPercent: 0, duration: 0.7, ease: EASE.inOut }, 0.2 + i * 0.5)
      })
      tl.from(facts, { yPercent: 18, rotation: 2, opacity: 0, duration: 0.5, stagger: 0.07, ease: EASE.out }, told)
      tl.to({}, { duration: 0.15 })
      tl.to(row, {
        x: () => -Math.max(0, row.scrollWidth - section.clientWidth + 48),
        duration: 1.8,
        ease: 'none',
      })
    }, section)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section className="statement" id="memory" ref={root}>
      <div className="statement-pin">
        <p className="eyebrow">
          <i /> The point
        </p>
        <div className="statement-head">
          <h2 className="statement-lines">
            {LINES.map((line) => (
              <span key={line} className="statement-line">
                {line.split(' ').map((word) => (
                  <span key={word} data-word style={reduced ? { opacity: 1 } : undefined}>
                    {word}
                  </span>
                ))}
              </span>
            ))}
          </h2>
          <Custody reduced={reduced} />
        </div>
        <div className="h-scroll" ref={track}>
          {FACTS.map((f, i) => (
            <article key={f.k} className="fact">
              <span className="fact-n">
                {String(i + 1).padStart(2, '0')} / {String(FACTS.length).padStart(2, '0')}
              </span>
              <h3>{f.k}</h3>
              <p>{f.d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
