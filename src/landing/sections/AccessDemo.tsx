import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChapterHead, media } from '@/landing/lib/motion';
import { MButton, MSwitch } from '@/landing/components/nova';

type AgentId = 'claude' | 'chatgpt' | 'local';
type ScopeId = 'prefs' | 'work' | 'people' | 'health';

const AGENTS: { id: AgentId; name: string; where: string }[] = [
  { id: 'claude', name: 'Claude Desktop', where: 'remote provider' },
  { id: 'chatgpt', name: 'ChatGPT', where: 'remote provider' },
  { id: 'local', name: 'Local model', where: 'this laptop' },
];
const SCOPES: { id: ScopeId; name: string; desc: string; items: string[] }[] = [
  { id: 'prefs', name: 'Preferences', desc: 'Tone, diet, routines', items: ['prefers short answers', 'partner is vegetarian'] },
  { id: 'work', name: 'Work projects', desc: 'Active projects and deadlines', items: ['tide-table book: draft due 30 June', 'kitchen rebuild starts April'] },
  { id: 'people', name: 'People & dates', desc: 'Family, friends, birthdays', items: ["Mum's birthday 14 March"] },
  { id: 'health', name: 'Health notes', desc: 'Kept back unless you say so', items: ['penicillin allergy'] },
];
const ASKS: { id: string; q: string; needs: ScopeId[]; a: string }[] = [
  { id: 'week', q: 'Plan my week', needs: ['work', 'people', 'prefs'], a: 'Here is a short plan built around your deadlines.' },
  { id: 'dinner', q: 'Suggest a dinner', needs: ['prefs', 'health'], a: 'Something vegetarian for two, kept simple.' },
  { id: 'card', q: 'Draft a birthday note', needs: ['people', 'prefs'], a: 'A brief, warm note, ready for March.' },
];

type Msg = { k: 'user' | 'agent' | 'denied' | 'pack'; t: string };
type Log = { t: string; k: 'grant' | 'deny' | 'share' | 'sys'; m: string };

const clock = (n: number) => { const m = 9 * 60 + 14 + n; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

export function AccessDemo() {
  const [plugged, setPlugged] = useState(false);
  const [agent, setAgent] = useState<AgentId>('claude');
  const [grants, setGrants] = useState<Record<AgentId, ScopeId[]>>({ claude: ['prefs', 'work'], chatgpt: [], local: ['prefs', 'work', 'people'] });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [log, setLog] = useState<Log[]>([{ t: clock(0), k: 'sys', m: 'demo ready · card not connected' }]);
  const [shared, setShared] = useState(0);
  const tick = useRef(1);

  const push = (k: Log['k'], m: string) => setLog((l) => [{ t: clock(tick.current++), k, m }, ...l].slice(0, 40));
  const agentName = AGENTS.find((a) => a.id === agent)!.name;

  const togglePlug = () => {
    const next = !plugged;
    setPlugged(next);
    push(next ? 'grant' : 'deny', next ? 'card connected · helper unlocked memory · connector up' : 'card removed · connector stopped · future requests will fail');
  };
  const toggleScope = (s: ScopeId) => {
    setGrants((g) => {
      const has = g[agent].includes(s);
      push(has ? 'deny' : 'grant', `${has ? 'revoked' : 'granted'} ${SCOPES.find((x) => x.id === s)!.name} → ${agentName}`);
      return { ...g, [agent]: has ? g[agent].filter((x) => x !== s) : [...g[agent], s] };
    });
  };
  const switchAgent = (a: AgentId) => { setAgent(a); setMsgs([]); };
  const ask = (id: string) => {
    const q = ASKS.find((x) => x.id === id)!;
    const next: Msg[] = [{ k: 'user', t: q.q }];
    if (!plugged) {
      next.push({ k: 'denied', t: 'Mission connector unavailable. The card is not connected, so no memory can be read.' });
      push('deny', `${agentName} request refused · card not connected`);
    } else {
      const ok = q.needs.filter((n) => grants[agent].includes(n));
      const held = q.needs.filter((n) => !grants[agent].includes(n));
      const items = SCOPES.filter((s) => ok.includes(s.id)).flatMap((s) => s.items);
      next.push({ k: 'pack', t: items.length ? `shared for this session:\n${items.map((i) => `· ${i}`).join('\n')}${held.length ? `\nwithheld (no grant): ${held.map((h) => SCOPES.find((s) => s.id === h)!.name).join(', ')}` : ''}` : `nothing shared: no matching grants\nwithheld: ${held.map((h) => SCOPES.find((s) => s.id === h)!.name).join(', ')}` });
      next.push({ k: 'agent', t: items.length ? q.a : 'I can help in general terms, but I have no personal context for this.' });
      if (items.length) { push('share', `${items.length} item${items.length > 1 ? 's' : ''} → ${agentName} (${AGENTS.find((a) => a.id === agent)!.where})`); setShared((n) => n + items.length); }
      if (held.length) push('sys', `withheld from ${agentName}: ${held.join(', ')}`);
    }
    setMsgs(next);
  };

  return (
    <section className="demo" id="demo" data-theme="night">
      <div className="wrap">
        <ChapterHead no="04" label="Access, demonstrated" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 30, flexWrap: 'wrap' }}>
          <h2 className="display d-l" style={{ maxWidth: 820 }}>Connect. Grant. Ask. <span className="it metal">Pull it out.</span></h2>
          <span className="demo-banner mono" data-testid="text-demo-label">Demonstration · simulated in your browser · not hardware function</span>
        </div>
        <p className="lede dim" style={{ marginTop: 20 }}>Try the access model with made-up memory. Connect the card, choose what each agent may read, then ask something. Nothing here touches a real device, model or account, and the software it imitates is still in development.</p>

        <div className="console">
          <div className="panel">
            <h5><span>1 · Device</span><span>{plugged ? 'connected' : 'idle'}</span></h5>
            <div className="laptop">
              <span className="mono dim">your laptop</span>
              <span className="laptop-port" />
              <motion.img className="demo-card" src={media('front.webp')} alt="" animate={{ x: plugged ? 86 : 200, y: '-50%', rotate: plugged ? 0 : -6, opacity: plugged ? 1 : 0.85 }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} style={{ left: 0 }} />
            </div>
            <MButton className={`btn ${plugged ? 'btn-ghost' : 'btn-metal'} plug-btn`} onClick={togglePlug} pressed={plugged} testId="button-toggle-plug">{plugged ? 'Unplug the card' : 'Plug in the card'}</MButton>
            <div className="helper-state">
              <div><span><i className={`led ${plugged ? 'ok' : 'stop'}`} />Memory</span><span className="mono dim">{plugged ? 'unlocked' : 'locked'}</span></div>
              <div><span><i className={`led ${plugged ? 'ok' : ''}`} />MCP connector</span><span className="mono dim">{plugged ? 'running' : 'stopped'}</span></div>
              <div><span><i className="led" />Shared so far</span><span className="mono dim" data-testid="text-shared-count">{shared} item{shared === 1 ? '' : 's'}</span></div>
            </div>
          </div>

          <div className="panel">
            <h5><span>3 · Session</span><span>{agentName}</span></h5>
            <div className="agent-tabs" role="group" aria-label="Agent">
              {AGENTS.map((a) => <MButton key={a.id} className="agent-tab" pressed={agent === a.id} onClick={() => switchAgent(a.id)} testId={`button-agent-${a.id}`}>{a.name}</MButton>)}
            </div>
            <div className="session" aria-live="polite">
              {msgs.length === 0 && <p className="dim" style={{ fontSize: 14 }}>Pick a request below. You'll see exactly which memory is packed into the session, and what is held back.</p>}
              {msgs.map((m, i) => m.k === 'pack'
                ? <motion.pre key={i} className="context-pack" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ whiteSpace: 'pre-wrap' }} data-testid="text-context-pack">{m.t}</motion.pre>
                : <motion.div key={i} className={`bubble ${m.k}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} data-testid={`text-message-${i}`}>{m.t}</motion.div>)}
              <div className="ask-row">
                {ASKS.map((a) => <MButton key={a.id} className="ask" onClick={() => ask(a.id)} testId={`button-ask-${a.id}`}>{a.q}</MButton>)}
              </div>
            </div>
          </div>

          <div className="panel">
            <h5><span>2 · Grants for {agentName}</span></h5>
            <div className="scopes">
              {SCOPES.map((s) => {
                const on = grants[agent].includes(s.id);
                return (
                  <div key={s.id} className={`scope ${on ? 'on' : ''}`}>
                    <span>{s.name}<small>{s.desc}</small></span>
                    <MSwitch checked={on} label={`Allow ${s.name} for ${agentName}`} onChange={() => toggleScope(s.id)} testId={`toggle-scope-${s.id}`} />
                  </div>
                );
              })}
            </div>
            <h5 style={{ marginTop: 22 }}><span>Audit log</span><span>local</span></h5>
            <div className="log" data-testid="list-audit-log">
              {log.map((l, i) => <div key={log.length - i} className={`log-line ${l.k}`}><span>{l.t}</span><span>{l.m}</span></div>)}
            </div>
            <p className="retain-note">Unplugging stops future access. It does not pull back anything already shared in a session; a remote provider may keep it under its own retention policy. Prefer temporary chats where an agent offers them.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
