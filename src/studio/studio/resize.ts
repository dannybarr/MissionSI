import type { CompId, GeometryParams } from './types';

/** Limits shared with the Geometry inspector sliders (same min/max), so a drag can never exceed what the panel allows. */
export const GEO_LIMITS = {
  width: [50, 130],
  height: [30, 90],
  contourDepth: [0, 3.5],
  contourLength: [3, 26],
  contourOffset: [-20, 20],
  sideDepth: [0, 3.5],
  sideLength: [2, 20],
} as const;
export const MARK_SIZE: [number, number] = [1, 40]; // same range as the Branding Size slider

const clamp = (v: number, [a, b]: readonly [number, number]) => Math.max(a, Math.min(b, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

export type Corner = { sx: 1 | -1; sy: 1 | -1 };

/** Which kind of corner handles a selected card component gets, or why it gets none. */
export type GeoHandleKind = 'outline' | 'contourTop' | 'contourBottom' | 'side';
export function geoHandleKind(id: CompId): GeoHandleKind | { reason: string } {
  switch (id) {
    case 'chassis':
    case 'perimeter':
    case 'chamfer':
    case 'recess':
    case 'face':
    case 'back':
      return 'outline';
    case 'topContour':
      return 'contourTop';
    case 'bottomContour':
      return 'contourBottom';
    case 'sideContours':
      return 'side';
    case 'connector':
      return { reason: 'Fixed-size USB-C socket: it stays centred on the right edge when the card is resized.' };
    case 'details':
      return { reason: 'Micro-text and the indicator ring are fixed-size details.' };
    case 'logo':
      return { reason: 'Select an individual mark to get its corner handles.' };
  }
}

/**
 * Proportional corner resize of a mark. All coordinates are face mm as seen by a viewer of that side.
 * The opposite corner stays where it is (rotation respected). hw0/hh0 = half plane extents at size0.
 */
export function resizeMark(
  m0: { x: number; y: number; rotation: number; size: number },
  hw0: number,
  hh0: number,
  c: Corner,
  p: { x: number; y: number },
  bounds: { w: number; h: number },
): { x: number; y: number; size: number } {
  const t = (m0.rotation * Math.PI) / 180;
  const cs = Math.cos(t);
  const sn = Math.sin(t);
  const rot = (vx: number, vy: number) => ({ x: cs * vx - sn * vy, y: sn * vx + cs * vy });
  const a = rot(-c.sx * hw0, -c.sy * hh0);
  const ax = m0.x + a.x;
  const ay = m0.y + a.y;
  const dx = p.x - ax;
  const dy = p.y - ay;
  const lx = cs * dx + sn * dy;
  const ly = -sn * dx + cs * dy;
  const gx = 2 * c.sx * hw0;
  const gy = 2 * c.sy * hh0;
  let k = (lx * gx + ly * gy) / (gx * gx + gy * gy);
  // size limits, and never wider/taller than the card itself
  const kMax = Math.min(MARK_SIZE[1] / m0.size, bounds.w / (2 * hw0), bounds.h / (2 * hh0));
  k = Math.max(MARK_SIZE[0] / m0.size, Math.min(kMax, k));
  const size = Math.max(MARK_SIZE[0], r1(m0.size * k));
  k = size / m0.size;
  const cOff = rot((gx * k) / 2, (gy * k) / 2);
  return { size, x: r1(ax + cOff.x), y: r1(ay + cOff.y) };
}

/** Card outline: the card is modelled about its centre, so a corner drag resizes symmetrically. p is model mm. */
export function resizeOutline(p: { x: number; y: number }): Pick<GeometryParams, 'width' | 'height'> {
  return { width: r1(clamp(2 * Math.abs(p.x), GEO_LIMITS.width)), height: r1(clamp(2 * Math.abs(p.y), GEO_LIMITS.height)) };
}

/** Top/bottom contour notch (linked): far end stays put, depth follows the pointer. p is model mm (front coords). */
export function resizeContour(
  g: GeometryParams,
  which: 'top' | 'bottom',
  c: Corner,
  start: { off: number; half: number },
  p: { x: number; y: number },
): Pick<GeometryParams, 'contourLength' | 'contourOffset' | 'contourDepth'> {
  const fixed = start.off - c.sx * start.half;
  const half = r1(clamp(Math.abs(p.x - fixed) / 2, GEO_LIMITS.contourLength));
  const off = r1(clamp(fixed + c.sx * half, GEO_LIMITS.contourOffset));
  const depth = which === 'top' ? g.height / 2 - p.y : p.y + g.height / 2;
  return { contourLength: half, contourOffset: off, contourDepth: r1(clamp(depth, GEO_LIMITS.contourDepth) * 20) / 20 };
}

/** Side cuts: mirrored about both axes, so length = |y| and depth = distance in from the side edge. */
export function resizeSide(g: GeometryParams, p: { x: number; y: number }): Pick<GeometryParams, 'sideLength' | 'sideDepth'> {
  return {
    sideLength: r1(clamp(Math.abs(p.y), GEO_LIMITS.sideLength)),
    sideDepth: r1(clamp(g.width / 2 - Math.abs(p.x), GEO_LIMITS.sideDepth) * 20) / 20,
  };
}
