import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AGENT_MARKS, FLAG_LAYOUT } from './marks'

gsap.registerPlugin(ScrollTrigger)

export function Flags({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el || reduced) return
    const ribbons = el.querySelectorAll<HTMLElement>('.ribbon')
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ribbons,
        { x: 80, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.04,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 75%', once: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section className="flags" id="agents" ref={root} aria-labelledby="flags-title">
      <div className="flag-cluster" aria-hidden={false}>
        <ul className="ribbon-list">
          {FLAG_LAYOUT.map((slot, i) => {
            const mark = AGENT_MARKS[slot.mark]
            return (
              <li
                key={`${mark.id}-${i}`}
                className="ribbon"
                style={{
                  top: slot.top,
                  width: slot.width,
                  ['--cloth' as string]: mark.cloth,
                  ['--ink' as string]: mark.ink,
                  ['--rot' as string]: `${slot.rot}deg`,
                  ['--delay' as string]: `${slot.delay * -8}s`,
                  animationDelay: `${slot.delay * -8}s`,
                }}
              >
                <span className="ribbon-cloth" />
                <span className="ribbon-logo">
                  <span className="ribbon-svg" dangerouslySetInnerHTML={{ __html: mark.svg }} />
                  <span className="ribbon-name">{mark.name}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="flag-copy">
        <h2 id="flags-title">One memory that works with every agent.</h2>
        <p>
          Mission speaks MCP, an open way to hand an agent context. You choose who connects and what they may read. Support depends on the agent: Claude Desktop is the strongest path today. We will not promise a connector a provider has not shipped.
        </p>
        <p className="legal">
          Claude, ChatGPT, Grok, Gemini, Meta, Mistral, Perplexity, Manus, DeepSeek, Copilot, Cursor, Ollama, Hugging Face and Apple are trademarks of their owners. Marks show who can connect, not an endorsement. Logos via Simple Icons (CC0) where the set includes them; Manus, Grok and Copilot are set in type or a simplified mark because Simple Icons does not ship those files.
        </p>
      </div>
    </section>
  )
}
