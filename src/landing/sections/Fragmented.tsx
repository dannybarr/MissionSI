import { useRef } from 'react';
import { motion, useScroll, type MotionValue } from 'framer-motion';
import { ChapterHead, media, useT } from '@/landing/lib/motion';

const FRAGS = [
  { t: 'Prefers short answers, no bullet lists', s: 'kept by one chatbot', x: -38, y: -18 },
  { t: 'Rebuilding the kitchen in spring', s: 'a project in another', x: 30, y: -26 },
  { t: "Mum's birthday, 14 March", s: 'a notes app', x: -30, y: 14 },
  { t: 'Learning Slovenian, B1', s: 'an old thread', x: 36, y: 6 },
  { t: 'Runs Tuesday and Thursday', s: 'a fitness app', x: -14, y: -32 },
  { t: 'Works UK hours, travels in May', s: 'a calendar', x: 14, y: 28 },
  { t: 'Allergic to penicillin', s: 'said once, somewhere', x: -42, y: 30 },
  { t: 'Writing a book on tide tables', s: 'a third assistant', x: 42, y: -8 },
  { t: 'Partner is vegetarian', s: 'a recipe chat', x: 4, y: -40 },
  { t: 'Hates phone calls before ten', s: 'nowhere you can see', x: 22, y: 38 },
];

function Chip({ p, f, i }: { p: MotionValue<number>; f: (typeof FRAGS)[number]; i: number }) {
  const d = (i % 4) * 0.025;
  const x = useT(p, [0, 0.2 + d, 0.62 + d], [`${f.x * 1.25}vw`, `${f.x}vw`, '0vw']);
  const y = useT(p, [0, 0.2 + d, 0.62 + d], [`${f.y * 1.2}vh`, `${f.y}vh`, '0vh']);
  const o = useT(p, [0, 0.12, 0.5 + d, 0.64 + d], [0, 1, 1, 0]);
  const s = useT(p, [0.4, 0.64 + d], [1, 0.4]);
  return (
    <motion.div className="chip" style={{ x, y, opacity: o, scale: s }} data-testid={`chip-fragment-${i}`}>
      <b>{f.t}</b>
      <span>{f.s}</span>
    </motion.div>
  );
}

export function Fragmented({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const copyO = useT(p, [0, 0.05, 0.42, 0.52], [0, 1, 1, 0]);
  const cardO = useT(p, [0.46, 0.7], [0, 1]);
  const cardS = useT(p, [0.46, 0.8], [0.55, 1]);
  const endO = useT(p, [0.72, 0.84], [0, 1]);

  const copy = (
    <>
      <ChapterHead no="01" label="Fragmented" />
      <h2 className="display d-l">What AI knows about you is <span className="it metal">scattered.</span></h2>
      <p className="lede dim" style={{ marginTop: 22 }}>Every assistant keeps its own partial copy of you, on its own servers, under its own rules. Switch tools and you start again. None of those copies is yours.</p>
    </>
  );
  const end = (
    <>
      <h3 className="display d-m">One memory. <span className="it">Yours to carry.</span></h3>
      <p className="dim" style={{ marginTop: 12 }}>Mission gathers it into a single encrypted memory that lives on a device in your pocket, not in a provider's account.</p>
    </>
  );

  if (reduced) {
    return (
      <section className="frag" id="memory" data-theme="night" style={{ padding: '16vh var(--gutter)' }}>
        <div style={{ maxWidth: 640 }}>{copy}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '40px 0' }}>
          {FRAGS.map((f, i) => <div key={i} className="chip" style={{ position: 'static' }}><b>{f.t}</b><span>{f.s}</span></div>)}
        </div>
        <div style={{ maxWidth: 520 }}>{end}</div>
      </section>
    );
  }

  return (
    <section ref={ref} className="frag" id="memory" data-theme="night">
      <div className="stage">
        <motion.div className="frag-copy" style={{ opacity: copyO }}>{copy}</motion.div>
        <div className="frag-field">{FRAGS.map((f, i) => <Chip key={i} p={p} f={f} i={i} />)}</div>
        <motion.img className="frag-card" src={media('front.webp')} alt="The Mission card, front face" style={{ opacity: cardO, scale: cardS }} />
        <motion.div className="frag-end" style={{ opacity: endO }}>{end}</motion.div>
      </div>
    </section>
  );
}
