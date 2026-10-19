import { useEffect, useRef, useState } from 'react'
import { gsap, prefersStatic } from '@/landing/lib/motion'
import { flagPose, flagSignals } from '@/landing/three/flagPose'
import { AGENT_MARKS, FLAG_LAYOUT } from './marks'

function scoped(svg: string, id: string) {
  return svg
    .replace(/id="([^"]+)"/g, (_, name) => `id="${name}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, name) => `url(#${name}-${id})`)
}

/** Flat ribbons for reduced motion, or if WebGL is unavailable. */
function StaticRibbons() {
  return (
    <ul className="ribbon-list">
      {FLAG_LAYOUT.map((slot) => {
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
  )
}

export function Flags({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'3d' | 'static'>('3d')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = root.current
    const view = track.current
    if (reduced || prefersStatic()) {
      setMode('static')
      return
    }
    if (!el || !view) return
    flagSignals.onReady = () => setReady(true)
    flagPose.unfurl = 0
    let dead = false
    let unregister = () => {}
    let release = () => {}
    const stageP = import('@/landing/three/stage')
    Promise.all([stageP, import('@/landing/three/FlagsScene')])
      .then(async ([stage, world]) => {
        if (dead || !track.current) return
        await stage.acquireStage()
        if (dead || !track.current) {
          stage.releaseStage()
          return
        }
        release = () => stage.releaseStage()
        unregister = stage.registerView('flags', track.current, <world.FlagsScene />)
        stage.setViewActive('flags', true)
      })
      .catch(() => !dead && setMode('static'))

    const io = new IntersectionObserver(
      ([entry]) => {
        stageP.then((stage) => stage.setViewActive('flags', !!entry?.isIntersecting))
      },
      { rootMargin: '200px' },
    )
    io.observe(view)

    const ctx = gsap.context(() => {
      // Strips stream out of the corner as the section arrives, then lift slightly as it leaves.
      gsap.to(flagPose, {
        unfurl: 1,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'top 5%', scrub: 1.1 },
      })
      gsap.to(flagPose, {
        drift: 1,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      })
    }, el)

    let last = { x: 0, y: 0, t: 0 }
    const onMove = (e: PointerEvent) => {
      const now = performance.now()
      const dtm = Math.max(16, now - last.t)
      const speed = Math.hypot(e.clientX - last.x, e.clientY - last.y) / dtm
      last = { x: e.clientX, y: e.clientY, t: now }
      flagPose.wind = Math.min(1, flagPose.wind + speed * 0.05)
    }
    el.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      dead = true
      io.disconnect()
      ctx.revert()
      el.removeEventListener('pointermove', onMove)
      unregister()
      release()
      flagSignals.onReady = () => {}
    }
  }, [reduced])

  return (
    <section className={`flags ${mode === 'static' ? 'is-static' : ''} ${ready ? 'is-ready' : ''}`} id="agents" ref={root} aria-labelledby="flags-title">
      <div className="flag-view" ref={track} aria-hidden="true" />
      {mode === 'static' && (
        <div className="flag-cluster" aria-hidden="true">
          <StaticRibbons />
        </div>
      )}
      <div className="flag-copy">
        <p className="flag-tag" data-reveal>
          <span aria-hidden="true">+</span> (Agents)
        </p>
        <h2 id="flags-title" data-split>
          One memory that works with every agent. You choose who connects, and what they may read.
        </h2>
        <div className="flag-notes">
          <p data-reveal>
            Mission speaks MCP, an open way to hand an agent context. Support depends on the agent: Claude Desktop is the strongest path today. We will not promise a connector a provider has not shipped.
          </p>
          <p className="legal" data-reveal>
            Claude, ChatGPT, Grok, Gemini, Meta, Mistral, Perplexity, Manus, DeepSeek, Copilot, Cursor, Ollama, Hugging Face, Apple and Qwen are trademarks of their owners. Marks show who can connect, not an endorsement. Logos from Lobe Icons (MIT).
          </p>
        </div>
      </div>
    </section>
  )
}
