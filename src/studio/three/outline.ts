import * as THREE from 'three';
import type { GeometryParams } from '@/studio/studio/types';

export interface OutlineSpec {
  w: number;
  h: number;
  r: number;
  top: number; // top notch depth
  bottom: number;
  notchOffset: number;
  notchHalf: number;
  side: number; // side notch depth (left and right, mirrored)
  sideHalf: number;
  ramp: number;
}

/**
 * Concept USB-C receptacle (female, for a cable): opening about 8.4 x 2.6 mm, centred on the right edge
 * and on the card thickness. Not a certified mechanical drawing.
 */
export const USBC = { w: 8.4, h: 2.6, r: 1.3, depth: 6.8, wall: 0.9 } as const;
/** Solid material kept between the socket opening and each recessed face. */
export const USBC_MIN_WALL = 0.4;
/**
 * The socket sits under both recessed faces (no rim boss), so thickness >= opening + 2 x wall + 2 x recess.
 * With the 0.5 mm default recess that is 4.4 mm: the thinnest feasible card for a 2.6 mm opening.
 */
export const MIN_THICKNESS = 4.4;
/** Deepest recess that still keeps USBC_MIN_WALL above/below the opening at thickness t. */
export const maxRecessFor = (t: number) => Math.max(0.1, (t - USBC.h - 2 * USBC_MIN_WALL) / 2);

export interface Insets {
  l: number;
  r: number;
  t: number;
  b: number;
}

export function specFrom(g: GeometryParams, flags: { top: boolean; bottom: boolean; side: boolean }): OutlineSpec {
  const maxNotch = g.width / 2 - g.cornerRadius - 4;
  const notchHalf = Math.min(g.contourLength, maxNotch);
  const off = Math.max(-maxNotch + notchHalf, Math.min(maxNotch - notchHalf, g.contourOffset));
  const sideHalf = Math.min(g.sideLength, g.height / 2 - g.cornerRadius - 3);
  return {
    w: g.width,
    h: g.height,
    r: Math.min(g.cornerRadius, g.height / 2 - 1),
    top: flags.top ? Math.min(g.contourDepth, g.height * 0.12) : 0,
    bottom: flags.bottom ? Math.min(g.contourDepth, g.height * 0.12) : 0,
    notchOffset: off,
    notchHalf,
    side: flags.side ? Math.min(g.sideDepth, g.width * 0.06) : 0,
    sideHalf: Math.max(1.5, sideHalf),
    ramp: 2.1 + Math.max(g.contourDepth, g.sideDepth) * 0.55,
  };
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * t * (t * (t * 6 - 15) + 10); // smootherstep for sculpted transitions
};

function bump(x: number, c: number, half: number, ramp: number) {
  return smooth(c - half - ramp, c - half, x) * (1 - smooth(c + half, c + half + ramp, x));
}

function norm(i: number | Insets): Insets {
  return typeof i === 'number' ? { l: i, r: i, t: i, b: i } : i;
}

/** Counter-clockwise closed outline of the sculpted card silhouette, offset by per-side insets. */
export function outlinePoints(s: OutlineSpec, insetIn: number | Insets, step = 0.45): THREE.Vector2[] {
  const ins = norm(insetIn);
  const x0 = -s.w / 2 + ins.l;
  const x1 = s.w / 2 - ins.r;
  const y0 = -s.h / 2 + ins.b;
  const y1 = s.h / 2 - ins.t;
  const minIn = Math.min(ins.l, ins.r, ins.t, ins.b);
  const R = Math.max(0.25, Math.min(s.r - minIn, (x1 - x0) / 2 - 0.1, (y1 - y0) / 2 - 0.1));
  const pts: THREE.Vector2[] = [];
  const arc = (cx: number, cy: number, a0: number, a1: number) => {
    const n = Math.max(6, Math.ceil(R * 4));
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push(new THREE.Vector2(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
    }
  };
  const edge = (from: number, to: number, f: (t: number) => THREE.Vector2) => {
    const n = Math.max(2, Math.ceil(Math.abs(to - from) / step));
    for (let i = 1; i < n; i++) pts.push(f(from + ((to - from) * i) / n));
  };

  // bottom (left -> right), notch pushes upward
  edge(x0 + R, x1 - R, (x) => new THREE.Vector2(x, y0 + s.bottom * bump(x, s.notchOffset, s.notchHalf, s.ramp)));
  arc(x1 - R, y0 + R, -Math.PI / 2, 0);
  edge(y0 + R, y1 - R, (y) => new THREE.Vector2(x1 - s.side * bump(y, 0, s.sideHalf, s.ramp), y));
  arc(x1 - R, y1 - R, 0, Math.PI / 2);
  edge(x1 - R, x0 + R, (x) => new THREE.Vector2(x, y1 - s.top * bump(x, s.notchOffset, s.notchHalf, s.ramp)));
  arc(x0 + R, y1 - R, Math.PI / 2, Math.PI);
  edge(y1 - R, y0 + R, (y) => new THREE.Vector2(x0 + s.side * bump(y, 0, s.sideHalf, s.ramp), y));
  arc(x0 + R, y0 + R, Math.PI, Math.PI * 1.5);
  return pts;
}

export function shapeFrom(pts: THREE.Vector2[], hole?: THREE.Vector2[]): THREE.Shape {
  const shape = new THREE.Shape(pts);
  if (hole) shape.holes.push(new THREE.Path([...hole].reverse()));
  return shape;
}

/** Points along a contour region (for selection highlights), lifted to z. */
export function contourPath(s: OutlineSpec, inset: number, which: 'top' | 'bottom' | 'side' | 'right', z: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  const span = s.notchHalf + s.ramp + 1.5;
  if (which === 'side') {
    const sp = s.sideHalf + s.ramp + 1.5;
    for (let y = -sp; y <= sp; y += 0.4) out.push(new THREE.Vector3(-s.w / 2 + inset + s.side * bump(y, 0, s.sideHalf, s.ramp), y, z));
    return out;
  }
  if (which === 'right') {
    const sp = s.sideHalf + s.ramp + 1.5;
    for (let y = -sp; y <= sp; y += 0.4) out.push(new THREE.Vector3(s.w / 2 - inset - s.side * bump(y, 0, s.sideHalf, s.ramp), y, z));
    return out;
  }
  for (let x = s.notchOffset - span; x <= s.notchOffset + span; x += 0.4) {
    const d = (which === 'top' ? s.top : s.bottom) * bump(x, s.notchOffset, s.notchHalf, s.ramp);
    out.push(new THREE.Vector3(x, which === 'top' ? s.h / 2 - inset - d : -s.h / 2 + inset + d, z));
  }
  return out;
}

export function outlineToSvgPath(pts: THREE.Vector2[], scale: number, ox: number, oy: number): string {
  return (
    pts.map((p, i) => `${i ? 'L' : 'M'}${(ox + p.x * scale).toFixed(2)} ${(oy - p.y * scale).toFixed(2)}`).join(' ') + ' Z'
  );
}
