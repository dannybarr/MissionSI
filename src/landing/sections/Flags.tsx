import { useEffect, useRef } from 'react'
import { EASE, gsap } from '@/landing/lib/motion'
import { AGENT_MARKS, FLAG_LAYOUT } from './marks'

export function Flags({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el || reduced) return
    const ribbons = gsap.utils.toArray<HTMLElement>('.ribbon-unfurl', el)
    const ctx = gsap.context(() => {
      gsap.from(ribbons, {
        xPercent: 70,
        scaleX: 0.6,
        transformOrigin: '100% 50%',
        opacity: 0,
        duration: 1.5,
        ease: EASE.arrive,
        stagger: { each: 0.05, from: 'random' },
        scrollTrigger: { trigger: el, start: 'top 72%', once: true },
      })
      // three depth planes: far ribbons drift less than near ones
      ribbons.forEach((r, i) => {
        const depth = [0.4, 1, 0.7][i % 3]
        gsap.fromTo(
          r,
          { y: 70 * depth },
          { y: -70 * depth, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.9 } },
        )
      })
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
                <span className="ribbon-unfurl">
                  <span className="ribbon-cloth" />
                  <span className="ribbon-logo">
                    <span className="ribbon-svg" dangerouslySetInnerHTML={{ __html: mark.svg }} />
                    <span className="ribbon-name">{mark.name}</span>
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="flag-copy">
        <p className="eyebrow" data-reveal>
          <i /> Agent-agnostic
        </p>
        <h2 id="flags-title" data-split>
          One memory that works with every agent.
        </h2>
        <p data-reveal>
          Mission speaks MCP, an open way to hand an agent context. You choose who connects and what they may read. Support depends on the agent: Claude Desktop is the strongest path today. We will not promise a connector a provider has not shipped.
        </p>
        <p className="legal" data-reveal>
          Claude, ChatGPT, Grok, Gemini, Meta, Mistral, Perplexity, Manus, DeepSeek, Copilot, Cursor, Ollama, Hugging Face and Apple are trademarks of their owners. Marks show who can connect, not an endorsement. Logos via Simple Icons (CC0) where the set includes them; Manus, Grok and Copilot are set in type or a simplified mark because Simple Icons does not ship those files.
        </p>
      </div>
    </section>
  )
}
