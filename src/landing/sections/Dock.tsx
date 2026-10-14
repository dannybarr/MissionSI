import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChapterHead, Reveal, media } from '@/landing/lib/motion';
import { MButton } from '@/landing/components/nova';

const SPECS = [
  ['Storage', '32–128 GB'],
  ['Secure element', 'NXP SE050'],
  ['Radio', 'Bluetooth, NFC'],
  ['Location', 'GPS'],
  ['Input', 'Push-to-talk mic, haptics'],
  ['Payments', 'Later: open banking, then contactless'],
];

export function Dock() {
  const [seated, setSeated] = useState(false);
  const [clamped, setClamped] = useState(false);
  const lit = seated && clamped;
  const spring = { type: 'spring' as const, stiffness: 90, damping: 16 };
  return (
    <section className="dock" id="hardware" data-theme="paper">
      <div className="wrap">
        <ChapterHead no="07" label="The planned hardware" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 24, flexWrap: 'wrap' }}>
          <Reveal><h2 className="display d-l" style={{ maxWidth: 820 }}>A bed for the card. <span className="it">A moon that tells you it’s home.</span></h2></Reveal>
          <span className="planned-tag">Concept · not built yet</span>
        </div>
        <div className="dock-grid">
          <div>
            <div className="dock-stage" data-testid="img-dock-concept">
              <svg viewBox="0 0 800 500" role="img" aria-label={`Dock concept. Card ${seated ? 'seated' : 'out'}, clamp ${clamped ? 'shut' : 'open'}, moon ${lit ? 'lit' : 'dark'}.`}>
                <defs>
                  <linearGradient id="bed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9d9a93" /><stop offset="1" stopColor="#7c7a74" /></linearGradient>
                  <linearGradient id="clampG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#b2afa8" /><stop offset="1" stopColor="#85827c" /></linearGradient>
                  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" /><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.22 0" /><feComposite in2="SourceGraphic" operator="in" /></filter>
                  <radialGradient id="glow"><stop offset="0" stopColor="#f3e3bf" stopOpacity="0.9" /><stop offset="1" stopColor="#f3e3bf" stopOpacity="0" /></radialGradient>
                  <filter id="soft" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#2a2a2a" floodOpacity="0.35" /></filter>
                </defs>
                <g filter="url(#soft)">
                  <rect x="130" y="120" width="540" height="310" rx="44" fill="url(#bed)" />
                  <rect x="130" y="120" width="540" height="310" rx="44" fill="#fff" filter="url(#grain)" />
                  <rect x="186" y="150" width="428" height="250" rx="22" fill="#6c6a65" opacity="0.55" />
                </g>
                {/* split semicircle moon */}
                <motion.circle cx="400" cy="112" r="120" fill="url(#glow)" animate={{ opacity: lit ? 1 : 0 }} transition={{ duration: 0.8 }} />
                <motion.path d="M394 50 A62 62 0 0 0 332 112 L394 112 Z" animate={{ fill: lit ? '#f4e6c4' : '#8f8c85' }} transition={{ duration: 0.6 }} stroke="#6b6963" strokeWidth="1.5" />
                <motion.path d="M406 50 A62 62 0 0 1 468 112 L406 112 Z" animate={{ fill: lit ? '#f4e6c4' : '#8f8c85' }} transition={{ duration: 0.6, delay: 0.12 }} stroke="#6b6963" strokeWidth="1.5" />
                {/* card */}
                <motion.image href={media('front.webp')} x="198" y="150" width="404" height="250" preserveAspectRatio="xMidYMid meet" animate={{ y: seated ? 0 : -330, opacity: seated ? 1 : 0 }} transition={spring} />
                {/* X clamp: one rigid assembly, two bars crossing at the centre, hinged along the left edge.
                    Opening folds the whole clamp sideways over the hinge (seen from above as a flip about x=160). */}
                <motion.g data-testid="svg-x-clamp" data-state={clamped ? 'closed' : 'open'} style={{ originX: 0, originY: 0.5 }} initial={false} animate={{ scaleX: clamped ? 1 : -0.3, opacity: clamped ? 1 : 0.92 }} transition={spring}>
                  <rect x="162" y="146" width="22" height="258" rx="11" fill="url(#clampG)" stroke="#6b6963" />
                  <path d="M176 146 L628 390 L612 412 L170 172 Z" fill="url(#clampG)" stroke="#6b6963" strokeWidth="1" />
                  <path d="M176 404 L628 160 L612 138 L170 378 Z" fill="url(#clampG)" stroke="#6b6963" strokeWidth="1" />
                  <circle cx="400" cy="275" r="15" fill="#a9a69f" stroke="#6b6963" />
                  <circle cx="400" cy="275" r="5" fill="#6b6963" />
                  <rect x="606" y="138" width="22" height="274" rx="11" fill="url(#clampG)" stroke="#6b6963" />
                </motion.g>
                {/* hinge knuckles fixed to the bed */}
                <rect x="150" y="160" width="20" height="40" rx="6" fill="#77756f" />
                <rect x="150" y="350" width="20" height="40" rx="6" fill="#77756f" />
                <line x1="160" y1="150" x2="160" y2="400" stroke="#55534e" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div className="dock-controls">
              <MButton className="chip-btn" pressed={seated} onClick={() => setSeated((s) => !s)} testId="button-seat-card">{seated ? 'Lift the card' : 'Seat the card'}</MButton>
              <MButton className="chip-btn" pressed={clamped} onClick={() => setClamped((c) => !c)} testId="button-clamp">{clamped ? 'Open the clamp' : 'Shut the clamp'}</MButton>
            </div>
            <p className="dock-read" data-testid="text-dock-state">CARD {seated ? 'SEATED' : 'OUT'} · CLAMP {clamped ? 'SHUT' : 'OPEN'} · MOON {lit ? 'LIT' : 'DARK'}{!lit && (seated || clamped) ? ' · needs both' : ''}</p>
          </div>
          <div>
            <p className="lede" style={{ color: '#2a2f45' }}>Matte grey, bead-blasted metal. An X-shaped clamp, hinged along one side, folds sideways over the card. The split moon lights only when the clamp is shut and the card is seated.</p>
            <ul className="spec-table" style={{ marginTop: 28 }}>
              {SPECS.map(([k, v]) => <li key={k}><span>{k}</span><span>{v}</span></li>)}
            </ul>
            <p className="footnote">Planned specification for the custom card. Subject to change; nothing here is manufactured yet.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
