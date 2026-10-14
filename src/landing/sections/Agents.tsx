import { useState } from 'react';
import { ChapterHead, Reveal, media } from '@/landing/lib/motion';

const AGENTS = [
  { id: 'claude', name: 'Claude Desktop', note: 'Local MCP connector. The strongest path today.', level: 3, label: 'Best today', x: 50, y: 6 },
  { id: 'ollama', name: 'Local models', note: 'Optional, via Ollama. Runs on your own laptop, so shared context stays there.', level: 3, label: 'Optional', x: 92, y: 46 },
  { id: 'mcp', name: 'Other MCP clients', note: 'Apps that speak local MCP can connect, with quality that depends on the app.', level: 2, label: 'Varies', x: 76, y: 90 },
  { id: 'chatgpt', name: 'ChatGPT', note: 'Depends on what connector support that app offers on your plan and platform.', level: 1, label: 'Varies', x: 22, y: 90 },
  { id: 'grok', name: 'Grok', note: 'Same story. We won\u2019t promise support that the provider hasn\u2019t shipped.', level: 1, label: 'Varies', x: 8, y: 46 },
];

export function Agents() {
  const [hot, setHot] = useState('claude');
  return (
    <section className="paper agents" id="agents" data-theme="paper">
      <div className="wrap">
        <ChapterHead no="03" label="Bring any agent" />
        <div className="agents-grid">
          <div>
            <Reveal><h2 className="display d-l">Not tied to one model. <span className="it">Or one company.</span></h2></Reveal>
            <Reveal className="d1"><p className="lede dim" style={{ marginTop: 22 }}>Mission speaks MCP, an open protocol for giving AI tools context. You decide which agent connects and what it may read. Here is honestly where support stands.</p></Reveal>
            <div className="ledger" role="list">
              {AGENTS.map((a) => (
                <div key={a.id} role="listitem" className={`ledger-row ${hot === a.id ? 'on' : ''}`} onMouseEnter={() => setHot(a.id)} onFocus={() => setHot(a.id)} tabIndex={0} data-testid={`row-agent-${a.id}`}>
                  <h4>{a.name}</h4>
                  <p>{a.note}</p>
                  <span style={{ display: 'grid', justifyItems: 'end', gap: 6 }}>
                    <span className="level" aria-label={`Support: ${a.label}`}>{[1, 2, 3].map((n) => <i key={n} className={n <= a.level ? 'f' : ''} />)}</span>
                    <span className="mono" style={{ fontSize: 10 }}>{a.label}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="footnote">There is no universal integration and no one-click memory import from AI providers today. Bringing existing memory in starts with each provider's own data export.</p>
          </div>
          <div className="switchboard" aria-hidden="true">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              {AGENTS.map((a) => (
                <line key={a.id} x1="50" y1="50" x2={a.x} y2={a.y} stroke="#0c1430" strokeWidth={hot === a.id ? 0.5 : 0.18} strokeDasharray={a.level >= 3 ? '0' : '1 1.2'} opacity={hot === a.id ? 0.9 : 0.35} style={{ transition: 'all .4s' }} />
              ))}
              <circle cx="50" cy="50" r="30" fill="none" stroke="#0c1430" strokeWidth="0.15" opacity="0.25" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="#0c1430" strokeWidth="0.12" opacity="0.18" strokeDasharray="0.6 1.4" />
            </svg>
            <img className="switch-card" src={media('hero.webp')} alt="" />
            {AGENTS.map((a) => (
              <span key={a.id} className={`node ${hot === a.id ? 'on' : ''}`} style={{ left: `${a.x}%`, top: `${a.y}%` }}>{a.name}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
