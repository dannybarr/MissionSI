import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

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
  { n: '01', h: 'Plug in', p: 'The card connects over USB-C. A local helper unlocks the memory and starts the connector.' },
  { n: '02', h: 'Grant per agent', p: 'Each agent gets only the scopes you allow. Health stays back unless you open it.' },
  { n: '03', h: 'Ask', p: 'The session is packed with just that grant. You can see what was shared and what was held.' },
  { n: '04', h: 'Pull out', p: 'Future requests fail. Anything already sent to a remote provider stays under their policy.' },
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
  const [plugged, setPlugged] = useState(false)
  const [agent, setAgent] = useState<AgentId>('claude')
  const [grants, setGrants] = useState<Record<AgentId, ScopeId[]>>({ claude: ['prefs', 'work'], chatgpt: [], local: ['prefs', 'work', 'people'] })
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [log, setLog] = useState<Log[]>([{ t: clock(0), k: 'sys', m: 'demo ready · card not connected' }])
  const [shared, setShared] = useState(0)
  const tick = useRef(1)

  useEffect(() => {
    const el = root.current
    if (!el || reduced) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: '+=160%',
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => setStep(Math.min(3, Math.floor(self.progress * 4))),
      })
    }, el)
    return () => ctx.revert()
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
    <section className="how" id="how" ref={root}>
      <div className="how-pin">
        <div className="how-intro">
          <p className="eyebrow">How it works</p>
          <h2>Plug in. Grant. Ask. Pull it out.</h2>
          <p className="demo-note" data-testid="text-demo-label">
            Demonstration · simulated in your browser · not hardware
          </p>
          <ol className="how-steps">
            {STEPS.map((s, i) => (
              <li key={s.n} className={i === step ? 'on' : ''} aria-current={i === step ? 'step' : undefined}>
                <span>{s.n}</span>
                <div>
                  <h3>{s.h}</h3>
                  <p>{s.p}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="console" aria-label="Simulated access demo">
          <div className="panel">
            <h3>
              <span>1 · Device</span>
              <span>{plugged ? 'connected' : 'idle'}</span>
            </h3>
            <div className="laptop" aria-hidden="true">
              <span>your laptop</span>
              <i className="port" />
              <img className={plugged ? 'in' : ''} src="/media/front.webp" alt="" />
            </div>
            <button type="button" className="btn btn-ink plug" onClick={togglePlug} aria-pressed={plugged} data-testid="button-toggle-plug">
              {plugged ? 'Unplug the card' : 'Plug in the card'}
            </button>
            <ul className="helper">
              <li>
                <span>Memory</span>
                <span>{plugged ? 'unlocked' : 'locked'}</span>
              </li>
              <li>
                <span>MCP connector</span>
                <span>{plugged ? 'running' : 'stopped'}</span>
              </li>
              <li>
                <span>Shared so far</span>
                <span data-testid="text-shared-count">
                  {shared} item{shared === 1 ? '' : 's'}
                </span>
              </li>
            </ul>
          </div>

          <div className="panel">
            <h3>
              <span>2 · Grants for {agentName}</span>
            </h3>
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
            <h3 className="log-head">
              <span>Audit log</span>
              <span>local</span>
            </h3>
            <div className="log" data-testid="list-audit-log">
              {log.map((l, i) => (
                <div key={`${l.t}-${i}`} className={`log-line ${l.k}`}>
                  <span>{l.t}</span>
                  <span>{l.m}</span>
                </div>
              ))}
            </div>
            <p className="retain">Unplugging stops future access. It does not pull back anything already shared. A remote provider may keep that under its own policy.</p>
          </div>

          <div className="panel">
            <h3>
              <span>3 · Session</span>
              <span>{agentName}</span>
            </h3>
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
                  <pre key={i} className="pack" data-testid="text-context-pack">
                    {m.t}
                  </pre>
                ) : (
                  <p key={i} className={`bubble ${m.k}`} data-testid={`text-message-${i}`}>
                    {m.t}
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
    </section>
  )
}
