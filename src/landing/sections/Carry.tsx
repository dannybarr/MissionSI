import { useRef } from 'react';
import { motion, useScroll, type MotionValue } from 'framer-motion';
import { ChapterHead, Reveal, SeqCanvas, media, useT } from '@/landing/lib/motion';

const CALLOUTS = [
  { r: [0.04, 0.12, 0.26, 0.32], pos: { left: 'var(--gutter)', top: '58vh' }, k: 'At rest', h: 'Encrypted on the device.', p: 'The memory is stored encrypted on the card itself. It is the source of truth; nothing about it lives in a Mission cloud.' },
  { r: [0.3, 0.38, 0.5, 0.56], pos: { right: 'var(--gutter)', top: '30vh' }, k: 'Form', h: 'Credit-card size. 4.4 mm.', p: 'Deep-blue body, champagne-metal rim, symmetrical inward-cut contours and a USB-C socket in the edge.' },
  { r: [0.54, 0.62, 0.74, 0.8], pos: { left: 'var(--gutter)', top: '30vh' }, k: 'In use', h: 'Works while it is connected.', p: 'A small helper on your laptop unlocks the memory and runs the connector. Take the card away and there is nothing left to connect to.' },
  { r: [0.8, 0.88, 0.99, 1], pos: { right: 'var(--gutter)', top: '58vh' }, k: 'Reverse', h: 'The Moon on the front, the Earth on the back.', p: 'Apollo 17\u2019s Blue Marble, printed on anodised metal. NASA imagery, credited below.' },
];

function Callout({ p, c, i }: { p: MotionValue<number>; c: (typeof CALLOUTS)[number]; i: number }) {
  const o = useT(p, c.r, [0, 1, 1, i === CALLOUTS.length - 1 ? 1 : 0]);
  const y = useT(p, [c.r[0], c.r[1]], [24, 0]);
  return (
    <motion.div className="callout" style={{ ...c.pos, opacity: o, y }} data-testid={`text-callout-${i}`}>
      <span className="mono">{c.k}</span>
      <h3>{c.h}</h3>
      <p>{c.p}</p>
    </motion.div>
  );
}

export function Carry({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const bandRef = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const { scrollYProgress: bp } = useScroll({ target: bandRef, offset: ['start end', 'end start'] });
  const frame = useT(p, [0.04, 0.94], [10, 30]);
  const titleO = useT(p, [0, 0.04, 0.12, 0.2], [0, 1, 1, 0]);
  const imgScale = useT(bp, [0, 1], [1.18, 1]);
  const imgX = useT(bp, [0, 1], ['4%', '-4%']);

  const title = (
    <>
      <ChapterHead no="02" label="Carry yours" />
      <h2 className="display d-l">Hold it in your hand.</h2>
    </>
  );

  const band = (
    <section ref={bandRef} className="port-band" data-theme="night">
      <figure>
        <motion.img src={media('port-macro.webp')} alt="Close-up of the USB-C socket cut into the card's metal edge" style={reduced ? undefined : { scale: imgScale, x: imgX }} loading="lazy" />
      </figure>
      <div className="port-copy">
        <Reveal><span className="mono metal">The socket is the switch</span></Reveal>
        <Reveal className="d1"><h2 className="display d-m">Plugged in, it answers. Pulled out, it doesn't.</h2></Reveal>
        <Reveal className="d2">
          <ul className="truth-list">
            <li><span className="mono">Plug in</span><span>The helper on your laptop unlocks the memory and starts the connector locally.</span></li>
            <li><span className="mono">Grant</span><span>Each agent gets only the areas of memory you allow, and only for that session.</span></li>
            <li><span className="mono">Unplug</span><span>Connector access stops straight away. New requests from any agent fail.</span></li>
            <li><span className="mono">Be clear</span><span>Unplugging doesn't recall what an agent already received. Its provider may keep shared context under its own policy.</span></li>
          </ul>
        </Reveal>
      </div>
    </section>
  );

  if (reduced) {
    return (
      <>
        <section className="carry" id="carry" data-theme="night" style={{ padding: '16vh var(--gutter)' }}>
          {title}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 30, marginTop: 40, alignItems: 'center' }}>
            <img src={media('back-34.webp')} alt="Back of the Mission card with NASA Blue Marble Earth" />
            <div style={{ display: 'grid', gap: 26 }}>
              {CALLOUTS.map((c, i) => <div key={i} className="callout" style={{ position: 'static' }}><span className="mono">{c.k}</span><h3>{c.h}</h3><p>{c.p}</p></div>)}
            </div>
          </div>
        </section>
        {band}
      </>
    );
  }

  return (
    <>
      <section ref={ref} className="carry" id="carry" data-theme="night">
        <div className="stage">
          <motion.div className="carry-title" style={{ opacity: titleO }}>{title}</motion.div>
          <div className="seq-canvas">
            <SeqCanvas frame={frame} label="The Mission card turning from its front, across its edge, to its Earth-printed back" />
          </div>
          {CALLOUTS.map((c, i) => <Callout key={i} p={p} c={c} i={i} />)}
        </div>
      </section>
      {band}
    </>
  );
}
