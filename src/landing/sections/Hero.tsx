import { useRef } from 'react';
import { motion, useScroll } from 'framer-motion';
import { SeqCanvas, media, useT } from '@/landing/lib/motion';

export function Hero({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const frame = useT(p, [0.02, 0.6], [0, 10]);
  const bigO = useT(p, [0, 0.16, 0.3], [1, 1, 0]);
  const bigY = useT(p, [0, 0.3], ['0vh', '-10vh']);
  const smallO = useT(p, [0.14, 0.26, 0.48, 0.58], [0, 1, 1, 0]);
  const smallY = useT(p, [0.14, 0.3], ['6vh', '0vh']);
  const portO = useT(p, [0, 0.08, 0.14], [1, 1, 0]);
  const cueO = useT(p, [0, 0.05], [1, 0]);
  const finO = useT(p, [0.62, 0.76], [0, 1]);
  const finY = useT(p, [0.62, 0.8], ['5vh', '0vh']);
  const canvasScale = useT(p, [0, 0.6, 0.85], [0.94, 1, 0.6]);
  const canvasY = useT(p, [0.6, 0.85], ['0vh', '-19vh']);

  const final = (
    <>
      <div>
        <span className="status-pill mono" data-testid="status-prototype"><i className="status-dot" />In development · not taking orders</span>
        <h1 style={{ marginTop: 18 }}>A personal AI memory, <span className="it metal">encrypted on a card you own.</span></h1>
      </div>
      <div>
        <p>Mission keeps what AI should know about you on your device, not on someone else's server. Bring it to the agents you choose. Share only what a conversation needs. Unplug, and future access stops.</p>
        <div className="hero-actions">
          <a href="#demo" className="btn btn-metal" data-testid="link-hero-demo">Try the access demo <span className="arrow">→</span></a>
          <a href="#memory" className="btn btn-ghost" data-testid="link-hero-story">Read the story</a>
        </div>
      </div>
    </>
  );

  if (reduced) {
    return (
      <section className="hero" id="top" data-theme="night">
        <div className="stage" style={{ paddingTop: '16vh', paddingBottom: '8vh' }}>
          <h2 className="hero-word big" style={{ position: 'relative', top: 0 }}>Your memory.</h2>
          <img src={media('hero.webp')} alt="The Mission card: deep-blue anodised body, champagne metal rim with inward-cut edges, and NASA Moon photograph" style={{ width: 'min(80vw, 860px)', margin: '2vh auto' }} />
          <div className="hero-final" style={{ position: 'relative', bottom: 0, left: 0, right: 0, padding: '0 var(--gutter)' }}>{final}</div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="hero" id="top" data-theme="night">
      <div className="stage">
        <div className="hero-glow" />
        <motion.h2 className="hero-word big" style={{ opacity: bigO, y: bigY }}>Your memory.</motion.h2>
        <motion.div className="seq-canvas" style={{ scale: canvasScale, y: canvasY }}>
          <SeqCanvas frame={frame} label="The Mission card turning from its USB-C edge to its front face" />
        </motion.div>
        <motion.div className="port-callout" style={{ opacity: portO, left: '56%' }}>
          <span className="line" />
          <span className="mono metal">USB-C · plug in to use, pull out to stop</span>
        </motion.div>
        <motion.h2 className="hero-word small" style={{ opacity: smallO, y: smallY }}>on you.</motion.h2>
        <motion.div className="hero-meta" style={{ opacity: cueO }}>
          <div className="hero-desc">
            <p data-testid="text-hero-descriptor">Personal AI memory. Stored locally. <span className="metal">Yours across agents.</span></p>
            <span className="scroll-cue mono dim"><i />Scroll</span>
          </div>
          <span className="mono dim">Mission · amission.si</span>
        </motion.div>
        <motion.div className="hero-final" style={{ opacity: finO, y: finY }}>{final}</motion.div>
      </div>
    </section>
  );
}
