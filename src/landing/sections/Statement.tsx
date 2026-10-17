import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const LINES = ['Your memory.', 'Any agent.', 'Nobody else.']

const FACTS = [
  { k: 'On you', d: 'Encrypted on a card you carry. Unplug, and future access stops.' },
  { k: 'Any agent', d: 'Claude, ChatGPT, Grok and any client that speaks MCP. None of them keeps the source.' },
  { k: 'No cloud copy', d: 'There is no Mission server holding your memory.' },
  { k: 'Per agent', d: 'You grant what each session may read. The rest stays on the card.' },
  { k: 'A local log', d: 'Grants, refusals and shares are written where you can read them.' },
  { k: '£249', d: 'Founding target for the custom card. No orders, deposits or ship date.' },
  { k: 'Honest', d: 'Software v1 is in development. The demo on this page is a simulation.' },
]

export function Statement({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = root.current
    const row = track.current
    if (!section || !row || reduced) return
    const words = section.querySelectorAll<HTMLElement>('[data-word]')
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=240%',
          pin: true,
          scrub: 0.65,
          anticipatePin: 1,
        },
      })
      words.forEach((word, i) => {
        tl.fromTo(word, { opacity: 0.2 }, { opacity: 1, duration: 0.6, ease: 'none' }, i * 0.28)
      })
      tl.to({}, { duration: 0.25 })
      tl.to(row, {
        x: () => -(row.scrollWidth - section.clientWidth + 48),
        duration: 1.6,
        ease: 'none',
      })
    }, section)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section className="statement" id="memory" ref={root}>
      <div className="statement-pin">
        <p className="eyebrow">The point</p>
        <h2 className="statement-lines">
          {LINES.map((line) => (
            <span key={line} className="statement-line">
              {line.split(' ').map((word) => (
                <span key={word} data-word style={reduced ? { opacity: 1 } : undefined}>
                  {word}{' '}
                </span>
              ))}
            </span>
          ))}
        </h2>
        <div className="h-scroll" ref={track}>
          {FACTS.map((f) => (
            <article key={f.k} className="fact">
              <h3>{f.k}</h3>
              <p>{f.d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
