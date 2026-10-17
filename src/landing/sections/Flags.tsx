import { useEffect, useRef } from 'react'
import { gsap } from '@/landing/lib/motion'
import { AGENT_MARKS, FLAG_LAYOUT } from './marks'

function scoped(svg: string, id: string) {
  return svg
    .replace(/id="([^"]+)"/g, (_, name) => `id="${name}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, name) => `url(#${name}-${id})`)
}

export function Flags({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el || reduced) return
    const ribbons = gsap.utils.toArray<HTMLElement>('.ribbon-slide', el)
    const ctx = gsap.context(() => {
      gsap.from(ribbons, {
        xPercent: 36,
        opacity: 0,
        duration: 1.35,
        ease: 'expo.out',
        stagger: { each: 0.045, from: 'end' },
        scrollTrigger: { trigger: el, start: 'top 72%', once: true },
      })
    }, el)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section className="flags" id="agents" ref={root} aria-labelledby="flags-title">
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
          Claude, ChatGPT, Grok, Gemini, Meta, Mistral, Perplexity, Manus, DeepSeek, Copilot, Cursor, Ollama, Hugging Face, Apple and Qwen are trademarks of their owners. Marks show who can connect, not an endorsement. Logos from Lobe Icons (MIT).
        </p>
      </div>
      <div className="flag-cluster" aria-hidden="true">
        <ul className="ribbon-list">
          {FLAG_LAYOUT.map((slot, i) => {
            const mark = AGENT_MARKS[slot.mark]
            if (!mark) return null
            return (
              <li
                key={mark.id}
                className="ribbon"
                style={{
                  top: slot.top,
                  width: slot.width,
                  zIndex: slot.z,
                  ['--cloth' as string]: mark.cloth,
                  ['--ink' as string]: mark.ink,
                  ['--rot' as string]: `${slot.rot}deg`,
                  animationDelay: `${-slot.delay * 18}s`,
                }}
              >
                <span className="ribbon-slide">
                  <span className="ribbon-cloth" />
                  <span className="ribbon-logo" style={{ color: mark.color ? undefined : mark.ink }}>
                    <span className={`ribbon-svg ${mark.color ? 'is-color' : ''}`} dangerouslySetInnerHTML={{ __html: scoped(mark.svg, mark.id) }} />
                    <span className="ribbon-name">{mark.name}</span>
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
