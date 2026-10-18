import { useEffect, useRef, useState } from 'react'
import { EASE, gsap, prefersStatic, ScrollTrigger } from '@/landing/lib/motion'

type AgentId = 'claude' | 'chatgpt' | 'local'
type ScopeId = 'prefs' | 'work' | 'people' | 'health'

const AGENTS: { id: AgentId; name: string; where: string }[] = [
  { id: 'claude', name: 'Claude Desktop', where: 'remote provider' },
  { id: 'chatgpt', name: 'ChatGPT', where: 'remote provider' },
  { id: 'local', name: 'Local model', where: 'this laptop' },
]
const SCOPES: { id: ScopeId; name: string; desc: string; items: string[] }[] = [
  { id: 'prefs', name: 'Preferences', desc: 'Tone, diet, routines', items: ['prefers short answers', 'partner is vegetarian'] },
  { id: 'work', name: 'Work projects', desc: 'Active projects and deadlines', items: ['tide-table book: draft due 30 June', 'kitchen rebuild starts April'] },
  { id: 'people', name: 'People & dates', desc: 'Family, friends, birthdays', items: ["Mum's birthday 14 March"] },
  { id: 'health', name: 'Health notes', desc: 'Kept back unless you say so', items: ['penicillin allergy'] },
]
const ASKS: { id: string; q: string; needs: ScopeId[]; a: string }[] = [
  { id: 'week', q: 'Plan my week', needs: ['work', 'people', 'prefs'], a: 'Here is a short plan built around your deadlines.' },
  { id: 'dinner', q: 'Suggest a dinner', needs: ['prefs', 'health'], a: 'Something vegetarian for two, kept simple.' },
  { id: 'card', q: 'Draft a birthday note', needs: ['people', 'prefs'], a: 'A brief, warm note, ready for March.' },
]
const STEPS = [
  { n: '01', h: 'Connect', p: 'A USB-C cable runs from the laptop to the port on the card’s left edge. A local helper unlocks the memory.' },
  { n: '02', h: 'Grant per agent', p: 'Each agent gets only the scopes you allow. Health stays back unless you open it.' },
  { n: '03', h: 'Ask', p: 'The session is packed with just that grant. You can see what was shared and what was held.' },
  { n: '04', h: 'Disconnect', p: 'Unplug the cable, or unpair the phone. Future requests fail. Anything already sent stays under that provider’s policy.' },
]

type Msg = { k: 'user' | 'agent' | 'denied' | 'pack'; t: string }
type Log = { t: string; k: 'grant' | 'deny' | 'share' | 'sys'; m: string }
const clock = (n: number) => {
  const m = 9 * 60 + 14 + n
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function HowItWorks({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null)
  const [step, setStep] = useState(0)
  const [pinned, setPinned] = useState(false)
  const activePanel = pinned ? [0, 1, 2, 0][step] : -1
  const [plugged, setPlugged] = useState(false)
  const [agent, setAgent] = useState<AgentId>('claude')
  const [grants, setGrants] = useState<Record<AgentId, ScopeId[]>>({ claude: ['prefs', 'work'], chatgpt: [], local: ['prefs', 'work', 'people'] })
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [log, setLog] = useState<Log[]>([{ t: clock(0), k: 'sys', m: 'demo ready · card not connected' }])
  const [shared, setShared] = useState(0)
  const tick = useRef(1)

  useEffect(() => {
    const el = root.current
    if (!el || reduced || prefersStatic()) return
    const mm = gsap.matchMedia(el)
    mm.add('(min-width: 1101px) and (min-height: 700px)', () => {
      setPinned(true)
      gsap.set('.how-rail i', { scaleY: 0 })
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: '+=180%',
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          gsap.set('.how-rail i', { scaleY: self.progress })
          setStep(Math.min(3, Math.floor(self.progress * 4)))
        },
      })
      gsap.from('.panel', { y: 40, opacity: 0, duration: 1.1, stagger: 0.09, ease: EASE.out, clearProps: 'transform,opacity', scrollTrigger: { trigger: el, start: 'top 70%', once: true } })
      return () => setPinned(false)
    })
    mm.add('(max-width: 1100px), (max-height: 699px)', () => {
      gsap.utils.toArray<HTMLElement>('.panel', el).forEach((p) => {
        gsap.from(p, { y: 32, opacity: 0, duration: 0.9, ease: EASE.out, clearProps: 'transform,opacity', scrollTrigger: { trigger: p, start: 'top 88%', once: true } })
      })
    })
    return () => mm.revert()
  }, [reduced])

  const push = (k: Log['k'], m: string) => setLog((l) => [{ t: clock(tick.current++), k, m }, ...l].slice(0, 40))
  const agentName = AGENTS.find((a) => a.id === agent)!.name
  const togglePlug = () => {
    const next = !plugged
    setPlugged(next)
    push(next ? 'grant' : 'deny', next ? 'card connected · helper unlocked memory · connector up' : 'card removed · connector stopped · future requests will fail')
  }
  const toggleScope = (s: ScopeId) => {
    setGrants((g) => {
      const has = g[agent].includes(s)
      push(has ? 'deny' : 'grant', `${has ? 'revoked' : 'granted'} ${SCOPES.find((x) => x.id === s)!.name} → ${agentName}`)
      return { ...g, [agent]: has ? g[agent].filter((x) => x !== s) : [...g[agent], s] }
    })
  }
  const ask = (id: string) => {
    const q = ASKS.find((x) => x.id === id)!
    const next: Msg[] = [{ k: 'user', t: q.q }]
    if (!plugged) {
      next.push({ k: 'denied', t: 'Mission connector unavailable. The card is not connected, so no memory can be read.' })
      push('deny', `${agentName} request refused · card not connected`)
    } else {
      const ok = q.needs.filter((n) => grants[agent].includes(n))
      const held = q.needs.filter((n) => !grants[agent].includes(n))
      const items = SCOPES.filter((s) => ok.includes(s.id)).flatMap((s) => s.items)
      next.push({
        k: 'pack',
        t: items.length
          ? `shared for this session:\n${items.map((i) => `· ${i}`).join('\n')}${held.length ? `\nwithheld (no grant): ${held.map((h) => SCOPES.find((s) => s.id === h)!.name).join(', ')}` : ''}`
          : `nothing shared: no matching grants\nwithheld: ${held.map((h) => SCOPES.find((s) => s.id === h)!.name).join(', ')}`,
      })
      next.push({ k: 'agent', t: items.length ? q.a : 'I can help in general terms, but I have no personal context for this.' })
      if (items.length) {
        push('share', `${items.length} item${items.length > 1 ? 's' : ''} → ${agentName} (${AGENTS.find((a) => a.id === agent)!.where})`)
        setShared((n) => n + items.length)
      }
      if (held.length) push('sys', `withheld from ${agentName}: ${held.join(', ')}`)
    }
    setMsgs(next)
  }

  return (
    <section className={`how ${pinned ? 'is-pinned' : ''}`} id="how" ref={root}>
      <div className="how-pin">
        <div className="how-intro">
          <p className="eyebrow" data-reveal>
            <i /> How it works
          </p>
          <h2 data-split>Connect. Grant. Ask. Disconnect.</h2>
          <p className="demo-note" data-testid="text-demo-label">
            Demonstration · simulated in your browser · not hardware
          </p>
          <div className="how-track">
            <span className="how-rail" aria-hidden="true">
              <i />
            </span>
            <ol className="how-steps">
            {STEPS.map((s, i) => (
              <li key={s.n} className={i === step ? 'on' : i < step ? 'done' : ''} aria-current={pinned && i === step ? 'step' : undefined}>
                <span>{s.n}</span>
                <div>
                  <h3>{s.h}</h3>
                  <p>{s.p}</p>
                </div>
              </li>
            ))}
            </ol>
          </div>
        </div>

        <div className="console" aria-label="Simulated access demo">
          <div className={`os ${activePanel === 0 ? 'is-active' : ''}`}>
            <div className="os-bar">
              <span className="os-lights" aria-hidden="true"><i /><i /><i /></span>
              <span>Mission Helper</span>
              <span className="os-state">{plugged ? 'Cable connected' : 'No cable'}</span>
            </div>
            <div className="os-body">
              <div className="ios ios-inline" aria-hidden="true">
                <div className="ios-status"><b>9:41</b><span>{plugged ? 'Paired' : 'Not paired'}</span></div>
                <p>{plugged ? 'Mission is available to apps on this iPhone.' : 'Bluetooth is waiting for the card.'}</p>
              </div>
              <button type="button" className="btn btn-ink plug-toggle" onClick={togglePlug} aria-pressed={plugged} data-testid="button-toggle-plug">
                {plugged ? 'Disconnect the cable' : 'Connect the cable'}
              </button>
              <ul className="helper">
                <li><span>Memory</span><span>{plugged ? 'unlocked' : 'locked'}</span></li>
                <li><span>MCP connector</span><span>{plugged ? 'running' : 'stopped'}</span></li>
                <li><span>Shared so far</span><span data-testid="text-shared-count">{shared} item{shared === 1 ? '' : 's'}</span></li>
              </ul>
            </div>
          </div>

          <div className={`os sheet ${activePanel === 1 ? 'is-active' : ''}`}>
            <div className="os-bar">
              <span className="os-lights" aria-hidden="true"><i /><i /><i /></span>
              <span>Permissions — {agentName}</span>
            </div>
            <div className="os-body">
              <p className="sheet-lead">Allow {agentName} to read these scopes for this session only.</p>
              <div className="scopes">
                {SCOPES.map((s) => {
                  const on = grants[agent].includes(s.id)
                  return (
                    <div key={s.id} className={on ? 'scope on' : 'scope'}>
                      <span>
                        {s.name}
                        <small>{s.desc}</small>
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={`Allow ${s.name} for ${agentName}`}
                        className="switch"
                        onClick={() => toggleScope(s.id)}
                        data-testid={`toggle-scope-${s.id}`}
                      />
                    </div>
                  )
                })}
              </div>
              <h3 className="log-head"><span>Audit log</span><span>local · today</span></h3>
              <div className="log" data-testid="list-audit-log">
                {log.map((l, i) => (
                  <div key={`${l.t}-${i}`} className={`log-line ${l.k}`}>
                    <span>{l.t}</span>
                    <span>{l.m}</span>
                  </div>
                ))}
              </div>
              <p className="retain">Disconnecting stops future access. It does not pull back anything already shared. A remote provider may keep that under its own policy.</p>
            </div>
          </div>

          <div className={`os claude ${activePanel === 2 ? 'is-active' : ''}`}>
            <div className="os-bar">
              <span className="os-lights" aria-hidden="true"><i /><i /><i /></span>
              <span>{agentName}</span>
            </div>
            <div className="os-body">
              <div className="agent-tabs" role="group" aria-label="Agent">
                {AGENTS.map((a) => (
                  <button key={a.id} type="button" className="agent-tab" aria-pressed={agent === a.id} onClick={() => { setAgent(a.id); setMsgs([]) }} data-testid={`button-agent-${a.id}`}>
                    {a.name}
                  </button>
                ))}
              </div>
              <div className="session" aria-live="polite">
                {msgs.length === 0 && <p className="empty">Pick a request. You’ll see exactly which memory is packed in, and what is held back.</p>}
                {msgs.map((m, i) =>
                  m.k === 'pack' ? (
                    <pre key={i} className="pack" data-testid="text-context-pack">{m.t}</pre>
                  ) : (
                    <p key={i} className={`bubble ${m.k}`} data-testid={`text-message-${i}`}>
                      {m.k === 'agent' && !reduced ? <Stream text={m.t} /> : m.t}
                    </p>
                  ),
                )}
                <div className="asks">
                  {ASKS.map((a) => (
                    <button key={a.id} type="button" className="ask" onClick={() => ask(a.id)} data-testid={`button-ask-${a.id}`}>
                      {a.q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stream({ text }: { text: string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let i = 0
    const id = window.setInterval(() => {
      i += 2
      setN(Math.min(text.length, i))
      if (i >= text.length) window.clearInterval(id)
    }, 18)
    return () => window.clearInterval(id)
  }, [text])
  return (
    <>
      {text.slice(0, n)}
      {n < text.length && <span className="caret" aria-hidden="true" />}
    </>
  )
}
