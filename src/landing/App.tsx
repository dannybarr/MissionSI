import { useEffect, useState } from 'react';
import { motion, useReducedMotion, useScroll } from 'framer-motion';
import { Mark } from '@/landing/lib/motion';
import { Hero } from '@/landing/sections/Hero';
import { Fragmented } from '@/landing/sections/Fragmented';
import { Carry } from '@/landing/sections/Carry';
import { Agents } from '@/landing/sections/Agents';
import { AccessDemo } from '@/landing/sections/AccessDemo';
import { Signals } from '@/landing/sections/Signals';
import { Custody } from '@/landing/sections/Custody';
import { Dock } from '@/landing/sections/Dock';
import { Status } from '@/landing/sections/Status';
import { Onboard, Footer } from '@/landing/sections/Closing';

const LINKS = [
  ['memory', 'Memory'],
  ['carry', 'Carry'],
  ['agents', 'Agents'],
  ['demo', 'Demo'],
  ['custody', 'Custody'],
  ['status', 'Status'],
];

function Nav() {
  const [solid, setSolid] = useState(false);
  const [paper, setPaper] = useState(false);
  const [active, setActive] = useState('');
  const { scrollYProgress } = useScroll();
  useEffect(() => {
    const on = () => {
      setSolid(window.scrollY > 40);
      const probe = document.elementFromPoint(window.innerWidth / 2, 40)?.closest('[data-theme]');
      setPaper(probe?.getAttribute('data-theme') === 'paper');
      let cur = '';
      for (const [id] of LINKS) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) cur = id; }
      setActive(cur);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <>
      <motion.div className="progress-rail" style={{ scaleX: scrollYProgress, width: '100%' }} />
      <header className={`nav ${solid ? 'solid' : ''} ${paper ? 'on-paper' : ''}`}>
        <a href="#top" className="brand" data-testid="link-home"><Mark />MISSION</a>
        <nav className="nav-links" aria-label="Sections">
          {LINKS.map(([id, label]) => <a key={id} href={`#${id}`} className={active === id ? 'active' : ''} data-testid={`link-nav-${id}`}>{label}</a>)}
        </nav>
        <a href="#demo" className="nav-cta" data-testid="link-nav-demo">Try the demo</a>
      </header>
    </>
  );
}

function Home() {
  const rm = useReducedMotion();
  const [forced, setForced] = useState(false);
  useEffect(() => { setForced(new URLSearchParams(window.location.search).has('reduced')); }, []);
  const reduced = !!rm || forced;
  useEffect(() => {
    document.documentElement.classList.toggle('reduced', reduced);
    document.documentElement.style.scrollBehavior = reduced ? 'auto' : 'smooth';
  }, [reduced]);
  return (
    <div className={reduced ? 'reduced' : ''}>
      <Nav />
      <main>
        <Hero reduced={reduced} />
        <Fragmented reduced={reduced} />
        <Carry reduced={reduced} />
        <Agents />
        <AccessDemo />
        <Signals />
        <Custody reduced={reduced} />
        <Dock />
        <Status />
        <Onboard />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return <Home />;
}

export default App;
