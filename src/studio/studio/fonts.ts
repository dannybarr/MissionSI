import type { FontId } from './types';

export interface FontDef {
  label: string;
  family: string; // exact CSS family name loaded in index.css
  fallback: string;
  weights: number[];
  note: string;
}

/** Every family here is loaded by the Google Fonts import at the top of index.css. */
export const FONTS: Record<FontId, FontDef> = {
  geist: { label: 'Geist', family: 'Geist', fallback: "'Helvetica Neue', sans-serif", weights: [300, 400, 500, 600, 700], note: 'Neutral grotesk' },
  spaceGrotesk: { label: 'Space Grotesk', family: 'Space Grotesk', fallback: 'sans-serif', weights: [300, 400, 500, 600, 700], note: 'Technical grotesk' },
  syne: { label: 'Syne', family: 'Syne', fallback: 'sans-serif', weights: [400, 500, 600, 700], note: 'Wide display' },
  bricolage: { label: 'Bricolage Grotesque', family: 'Bricolage Grotesque', fallback: 'sans-serif', weights: [300, 400, 500, 600, 700], note: 'Characterful grotesk' },
  unbounded: { label: 'Unbounded', family: 'Unbounded', fallback: 'sans-serif', weights: [300, 400, 500, 600, 700], note: 'Extended, spacefaring' },
  instrumentSerif: { label: 'Instrument Serif', family: 'Instrument Serif', fallback: 'Georgia, serif', weights: [400], note: 'Condensed editorial serif' },
  fraunces: { label: 'Fraunces', family: 'Fraunces', fallback: 'Georgia, serif', weights: [300, 400, 500, 600, 700], note: 'Soft old-style serif' },
  playfair: { label: 'Playfair Display', family: 'Playfair Display', fallback: 'Georgia, serif', weights: [400, 500, 600, 700], note: 'High-contrast serif' },
  cormorant: { label: 'Cormorant Garamond', family: 'Cormorant Garamond', fallback: 'Georgia, serif', weights: [300, 400, 500, 600, 700], note: 'Classical Garamond' },
  geistMono: { label: 'Geist Mono', family: 'Geist Mono', fallback: 'ui-monospace, monospace', weights: [400, 500], note: 'Instrument mono' },
  jetbrainsMono: { label: 'JetBrains Mono', family: 'JetBrains Mono', fallback: 'ui-monospace, monospace', weights: [300, 400, 500, 600, 700], note: 'Engineering mono' },
};

export const FONT_ORDER = Object.keys(FONTS) as FontId[];

export function nearestWeight(font: FontId, w: number): number {
  const ws = FONTS[font].weights;
  return ws.reduce((best, x) => (Math.abs(x - w) < Math.abs(best - w) ? x : best), ws[0]);
}

export function cssFont(font: FontId, weight: number, px: number): string {
  const f = FONTS[font];
  return `${nearestWeight(font, weight)} ${px}px "${f.family}", ${f.fallback}`;
}

const loads = new Map<string, Promise<boolean>>();

/** Resolves true once the exact face is usable by canvas; false if it could not load (offline). */
export function loadFont(font: FontId, weight: number): Promise<boolean> {
  const key = `${font}:${nearestWeight(font, weight)}`;
  const hit = loads.get(key);
  if (hit) return hit;
  const p = (async () => {
    if (typeof document === 'undefined' || !('fonts' in document)) return false;
    const spec = cssFont(font, weight, 64);
    try {
      await Promise.race([document.fonts.load(spec, 'Mission'), new Promise((r) => setTimeout(r, 4000))]);
      return document.fonts.check(spec, 'Mission');
    } catch {
      return false;
    }
  })();
  loads.set(key, p);
  return p;
}
