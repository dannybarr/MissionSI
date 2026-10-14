import { useEffect, useRef, useState, type ReactNode } from 'react';
import { transform, useTransform, type MotionValue } from 'framer-motion';

export const BASE = import.meta.env.BASE_URL;
export const media = (f: string) => `${BASE}media/${f}`;
export const FRAME_COUNT = 40;

const frames: HTMLImageElement[] = [];
function loadFrames() {
  if (frames.length || typeof window === 'undefined') return;
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.decoding = 'async';
    img.src = media(`seq/f${String(i).padStart(2, '0')}.webp`);
    frames.push(img);
  }
}

/** Scroll-scrubbed turntable of real Mission Studio renders, drawn to a 2D canvas (no WebGL needed). */
export function SeqCanvas({ frame, label }: { frame: MotionValue<any>; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    loadFrames();
    const c = ref.current;
    if (!c) return;
    c.width = 1280;
    c.height = 1010;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let last = -1;
    const draw = (v: number) => {
      const i = ((Math.round(v) % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
      const img = frames[i];
      if (!img.complete || !img.naturalWidth) {
        img.addEventListener('load', () => { last = -1; draw(frame.get()); }, { once: true });
        return;
      }
      if (i === last) return;
      last = i;
      ctx.clearRect(0, 0, 1280, 1010);
      ctx.drawImage(img, 0, 0, 1280, 1010);
    };
    draw(frame.get());
    return frame.on('change', draw);
  }, [frame]);
  return <canvas ref={ref} role="img" aria-label={label} data-testid="canvas-card-sequence" />;
}

export function Reveal({ children, className = '', as = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'li' }) {
  const ref = useRef<HTMLDivElement & HTMLLIElement>(null);
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIn(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as;
  return <Tag ref={ref} className={`rv ${inView ? 'in' : ''} ${className}`}>{children}</Tag>;
}

export function ChapterHead({ no, label }: { no: string; label: string }) {
  return (
    <div className="chapter-head">
      <span className="chapter-no">{no}</span>
      <span className="mono">{label}</span>
      <span className="chapter-rule" />
    </div>
  );
}

export function Mark({ className = 'brand-mark' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
      <path d="M15 6a10 10 0 0 0 0 20z" fill="currentColor" />
      <path d="M17 6a10 10 0 0 1 0 20" fill="none" stroke="#c9ad84" strokeWidth="1.6" />
    </svg>
  );
}

/**
 * Scroll-linked transform via a JS mapper. Framer would otherwise hand opacity to a native
 * scroll-driven animation, which we measured drifting from the real scroll position in Chromium.
 */
export function useT<T extends number | string>(p: MotionValue<number>, input: number[], output: T[]) {
  return useTransform(p, (v: number) => transform(v, input, output) as T);
}
