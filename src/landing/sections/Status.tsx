import { useRef } from 'react';
import { motion, useScroll } from 'framer-motion';
import { ChapterHead, Reveal, useT } from '@/landing/lib/motion';

const STOPS = [
  { k: 'Now', h: 'Software v1, in development', p: 'The plan being validated: an encrypted USB-C stick holds the memory, and a local helper detects it, decrypts it and runs the MCP connector, with Ollama optional. Not released; there is nothing to download or run yet.', l: ['Current focus, not a working release', 'Claude Desktop first', 'The demo on this page is a browser simulation'], now: true },
  { k: 'Next', h: 'At-home hardware prototype', p: 'A dev-board card and a 3D-printed dock, to test seating, the moon light, sensing and Bluetooth.', l: ['Not built yet'] },
  { k: 'Then', h: 'Custom card and dock', p: 'The deep-blue card with its own secure element, and the bead-blasted bed with the X clamp. A standard USB stick can\u2019t be locked to memory-only use; this can.', l: ['Founding target £249'] },
  { k: 'Later', h: 'Signals and phone bridge', p: 'Opt-in location and on-device speech, the chief-of-staff feed, and a phone app as the Bluetooth bridge. Payments after that.', l: ['Planned'] },
];

export function Status() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start 85%', 'end 60%'] });
  const fill = useT(p, [0, 1], [0, 0.18]);
  return (
    <section className="status" id="status" data-theme="night">
      <div className="wrap">
        <ChapterHead no="08" label="Where it stands" />
        <Reveal><h2 className="display d-l" style={{ maxWidth: 900 }}>Early, and <span className="it metal">saying so.</span></h2></Reveal>
        <div className="track" ref={ref}>
          <motion.span className="track-fill" style={{ scaleX: fill, width: '100%' }} />
          {STOPS.map((s, i) => (
            <Reveal key={s.k} className={`stop ${s.now ? 'now' : ''} d${i % 3}`}>
              <span className="mono metal">{s.k}</span>
              <h4>{s.h}</h4>
              <p>{s.p}</p>
              <ul>{s.l.map((x) => <li key={x}>{x}</li>)}</ul>
            </Reveal>
          ))}
        </div>
        <Reveal className="price">
          <div className="price-num" data-testid="text-price">£249</div>
          <div>
            <span className="mono metal">Founding target · custom hardware</span>
            <p className="lede" style={{ marginTop: 10 }}>The intended price for founding buyers of the custom card. We are not taking orders, deposits or reservations, and there is no ship date. Software v1 comes first, and it is still in development.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
