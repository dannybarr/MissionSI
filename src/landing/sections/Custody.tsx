import { useRef } from 'react';
import { motion, useScroll } from 'framer-motion';
import { ChapterHead, Reveal, media, useT } from '@/landing/lib/motion';

const ITEMS = [
  { h: 'Held by you.', p: 'The encrypted source of truth sits on your device. There is no Mission server holding a copy.' },
  { h: 'Shared on purpose.', p: 'An agent sees only the memory you grant, packed into that session. Minimal sharing is the default.' },
  { h: 'Logged.', p: 'Every grant, refusal and share is written to a local audit log you can read.' },
  { h: 'Honest about the rest.', p: 'What a remote agent receives, it receives; its provider may retain it. This is not zero exposure. Temporary chats and narrow grants keep it small.' },
];

export function Custody({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const lx = useT(p, [0.1, 0.6], ['3%', '-1.5%']);
  const rx = useT(p, [0.1, 0.6], ['-3%', '1.5%']);
  const rot = useT(p, [0, 1], [-8, 8]);
  return (
    <section ref={ref} className="custody" id="custody" data-theme="night">
      <motion.div className="split-moon" style={reduced ? undefined : { rotate: rot }} aria-hidden="true">
        <motion.div className="half l" style={reduced ? undefined : { x: lx }}><img src={media('moon.webp')} alt="" loading="lazy" /></motion.div>
        <motion.div className="half r" style={reduced ? undefined : { x: rx }}><img src={media('moon.webp')} alt="" loading="lazy" /></motion.div>
      </motion.div>
      <div className="wrap">
        <ChapterHead no="06" label="Custody" />
        <Reveal><h2 className="display d-l" style={{ maxWidth: 760 }}>Security, <span className="it metal">in four lines.</span></h2></Reveal>
        <ol className="custody-list">
          {ITEMS.map((it, i) => (
            <Reveal as="li" key={i} className={`d${i % 3}`}>
              <div><h3>{it.h}</h3><p>{it.p}</p></div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
