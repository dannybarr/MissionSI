import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChapterHead, Reveal } from '@/landing/lib/motion';
import { MSwitch } from '@/landing/components/nova';

type Sig = 'location' | 'voice' | 'feed';
const SIGNALS: { id: Sig; name: string; p: string }[] = [
  { id: 'location', name: 'Location', p: 'Places, not a live track. Where you went, so "the café near the studio" means something.' },
  { id: 'voice', name: 'Voice notes', p: 'Push-to-talk, transcribed locally on your own machine. Nothing is recorded unless you press.' },
  { id: 'feed', name: 'Chief-of-staff feed', p: 'Flags changes, commitments and opportunities drawn from the signals you turned on.' },
];
const DAY: { t: string; s: Sig; p: string; n: string }[] = [
  { t: '08:12', s: 'location', p: 'Left home → studio, Hackney Wick', n: 'place, from GPS' },
  { t: '11:05', s: 'voice', p: '"Call the framer about Friday, and ask about the oak."', n: 'transcribed on device' },
  { t: '13:30', s: 'location', p: 'Lunch near Victoria Park', n: 'place, from GPS' },
  { t: '17:40', s: 'feed', p: 'You said you\u2019d call the framer. Still open, and Friday is tomorrow.', n: 'commitment flagged' },
  { t: '18:02', s: 'feed', p: 'Train times changed for your Saturday trip.', n: 'change flagged' },
];

export function Signals() {
  const [on, setOn] = useState<Sig[]>([]);
  const toggle = (s: Sig) => setOn((o) => (o.includes(s) ? o.filter((x) => x !== s) : [...o, s]));
  const feedLive = on.includes('feed') && (on.includes('location') || on.includes('voice'));
  const visible = DAY.filter((d) => (d.s === 'feed' ? feedLive : on.includes(d.s)));
  return (
    <section className="paper signals" id="signals" data-theme="paper">
      <div className="wrap">
        <ChapterHead no="05" label="Signals, with consent" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 24, flexWrap: 'wrap' }}>
          <Reveal><h2 className="display d-l" style={{ maxWidth: 860 }}>The parts of life a chat window never sees. <span className="it">Only if you say so.</span></h2></Reveal>
          <span className="planned-tag">Planned · not in the prototype</span>
        </div>
        <div className="signal-grid">
          <div className="signal-list">
            {SIGNALS.map((s) => (
              <div key={s.id} className={`signal ${on.includes(s.id) ? 'on' : ''}`}>
                <h4>{s.name}</h4>
                <MSwitch checked={on.includes(s.id)} label={`${s.name} signal`} onChange={() => toggle(s.id)} testId={`toggle-signal-${s.id}`} />
                <p>{s.p}</p>
              </div>
            ))}
            <p className="footnote">Every signal starts off. Each is opt-in on its own, stored in the same encrypted memory, and shared with an agent only under the grants above.</p>
          </div>
          <div className="day" aria-live="polite" data-testid="list-day">
            <span className="mono" style={{ color: '#7a6340' }}>An imagined Thursday</span>
            {visible.length === 0 && <p className="day-empty">Nothing is captured. Turn a signal on to see what it would add to a day, and nothing more.</p>}
            <AnimatePresence initial={false}>
              {visible.map((d) => (
                <motion.div key={d.t} className="day-item lit" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                  <time>{d.t}</time>
                  <p>{d.p}</p>
                  <small>{d.n}</small>
                </motion.div>
              ))}
            </AnimatePresence>
            {on.includes('feed') && !feedLive && <p className="day-empty">The feed needs at least one signal to work from.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
