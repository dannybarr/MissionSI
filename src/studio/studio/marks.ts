import { CONCEPTS, type BrandConcept } from './concepts';
import { FONTS, nearestWeight } from './fonts';
import { markDefaults } from './presets';
import { svgAspect } from './svg';
import { ASSETS, type AssetId } from './assets';
import type { BrandMark, GeometryParams, MarkSide } from './types';


/** Approximate rendered width (mm) of a mark, used for 2D pads and placement presets. */
export function estimateWidth(m: BrandMark): number {
  if (m.kind === 'image') return m.size * (m.asset ? ASSETS[m.asset].aspect : 1);
  if (m.kind === 'svg') return m.size * (m.svg ? svgAspect(m.svg) : 1);
  const t = m.text.trim() || ' ';
  const mono = m.font === 'geistMono' || m.font === 'jetbrainsMono';
  const wide = m.font === 'unbounded' || m.font === 'syne';
  const em = mono ? 0.6 : wide ? 0.72 : m.font === 'instrumentSerif' ? 0.44 : 0.56;
  return m.size * t.length * (em + m.tracking / 100) * 1.34;
}

/** Usable face rectangle (mm, viewer coords) for a side. Symmetric on both faces: the USB-C socket is hidden inside the card edge. */
export function faceBounds(g: GeometryParams, side: MarkSide) {
  const inset = g.border + g.trim + g.faceMargin + 1.6;
  let x0 = -g.width / 2 + inset;
  let x1 = g.width / 2 - inset;
  const y0 = -g.height / 2 + inset + g.contourDepth * 0.6;
  const y1 = g.height / 2 - inset - g.contourDepth * 0.6;
  return { x0, x1, y0, y1 };
}

export type PlacementPreset = 'center' | 'upperLeft' | 'upperRight' | 'lowerLeft' | 'lowerRight' | 'lowerCenter';

export const PLACEMENTS: { id: PlacementPreset; label: string }[] = [
  { id: 'upperLeft', label: 'Upper left' },
  { id: 'center', label: 'Centre' },
  { id: 'upperRight', label: 'Upper right' },
  { id: 'lowerLeft', label: 'Lower left' },
  { id: 'lowerCenter', label: 'Lower centre' },
  { id: 'lowerRight', label: 'Lower right' },
];

export function placementFor(m: BrandMark, g: GeometryParams, preset: PlacementPreset): { x: number; y: number } {
  const b = faceBounds(g, m.side);
  const hw = Math.min(estimateWidth(m), b.x1 - b.x0) / 2;
  const hh = m.size / 2;
  const r = (v: number) => Math.round(v * 10) / 10;
  const L = b.x0 + hw;
  const R = b.x1 - hw;
  const T = b.y1 - hh;
  const B = b.y0 + hh;
  const cx = (b.x0 + b.x1) / 2;
  switch (preset) {
    case 'center':
      return { x: r(cx), y: 0 };
    case 'upperLeft':
      return { x: r(L), y: r(T) };
    case 'upperRight':
      return { x: r(R), y: r(T) };
    case 'lowerLeft':
      return { x: r(L), y: r(B) };
    case 'lowerRight':
      return { x: r(R), y: r(B) };
    case 'lowerCenter':
      return { x: r(cx), y: r(B) };
  }
}

export function newTextMark(side: MarkSide, g: GeometryParams, existing: number): Omit<BrandMark, 'id'> {
  const base = { ...markDefaults(), name: `Wordmark ${existing + 1}`, side };
  const p = placementFor({ ...base, id: '' }, g, side === 'back' ? 'center' : 'lowerLeft');
  const { id: _id, ...rest } = { ...base, ...p, id: '' };
  void _id;
  return rest;
}

export function newSvgMark(svg: string, name: string, side: MarkSide, g: GeometryParams): Omit<BrandMark, 'id'> {
  const base: BrandMark = { ...markDefaults(), kind: 'svg', svg, svgName: name, name: name.replace(/\.svg$/i, '').slice(0, 60) || 'Logo', side, size: 10, text: '' };
  const p = placementFor(base, g, side === 'back' ? 'center' : 'upperLeft');
  const { id: _id, ...rest } = { ...base, ...p };
  void _id;
  return rest;
}

/** Concept → one symbol mark, or a symbol + wordmark lockup laid out for the chosen side. */
export function conceptMarks(c: BrandConcept, side: MarkSide, g: GeometryParams, withWordmark: boolean, color: string): Omit<BrandMark, 'id'>[] {
  const b = faceBounds(g, side);
  const aspect = c.asset ? ASSETS[c.asset].aspect : c.svg ? svgAspect(c.svg) : 1;
  const symbolSize = side === 'back' ? Math.min(20, (b.y1 - b.y0) * 0.5) : withWordmark ? 8 : 11;
  const symbol: BrandMark = {
    ...markDefaults(),
    id: '',
    kind: c.asset ? 'image' : 'svg',
    svg: c.asset ? null : (c.svg ?? null),
    svgName: c.asset ? null : `${c.id}.svg`,
    asset: c.asset ?? null,
    name: c.name,
    side,
    size: +symbolSize.toFixed(1),
    color,
    text: '',
  };
  const out: BrandMark[] = [symbol];
  if (withWordmark) {
    const word: BrandMark = {
      ...markDefaults(),
      id: '',
      name: `${c.name} wordmark`,
      side,
      text: c.lockup.text,
      font: c.lockup.font,
      weight: nearestWeight(c.lockup.font, c.lockup.weight),
      tracking: c.lockup.tracking,
      size: side === 'back' ? 3.2 : FONTS[c.lockup.font].family === 'Instrument Serif' ? 6.6 : 4.6,
      color,
    };
    out.push(word);
    if (side === 'back') {
      symbol.x = +((b.x0 + b.x1) / 2).toFixed(1);
      symbol.y = +(symbol.size * 0.25).toFixed(1);
      word.x = symbol.x;
      word.y = +(symbol.y - symbol.size / 2 - word.size * 1.4).toFixed(1);
    } else {
      symbol.x = +(b.x0 + (symbol.size * aspect) / 2).toFixed(1);
      symbol.y = +(b.y1 - symbol.size / 2).toFixed(1);
      word.x = +(symbol.x + (symbol.size * aspect) / 2 + 2 + estimateWidth(word) / 2).toFixed(1);
      word.y = symbol.y;
    }
  } else {
    const p = placementFor(symbol, g, side === 'back' ? 'center' : 'upperLeft');
    symbol.x = p.x;
    symbol.y = p.y;
  }
  return out.map(({ id: _id, ...rest }) => {
    void _id;
    return rest;
  });
}

export { CONCEPTS };

/** Photographic replacement for a built-in vector symbol: same id, face, position, rotation and size; natural colour. */
export function photoMarkFrom(m: BrandMark, asset: AssetId): Partial<BrandMark> {
  return { kind: 'image', asset, svg: null, svgName: null, name: m.name.replace(/^(Earth|Moon|Saturn)\b.*$/, ASSETS[asset].name + ' (NASA)'), finish: 'printed' };
}
