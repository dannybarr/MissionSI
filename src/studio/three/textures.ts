import * as THREE from 'three';

const cache = new Map<string, HTMLCanvasElement>();

/** Seeded PRNG so the procedural surface is stable across reloads and exports. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Procedural surface map: linear brushing streaks plus bead-blast grain.
 * Used as both roughness modulation and bump, so highlights break up like real machined metal.
 */
function surfaceCanvas(brush: number, grain: number): HTMLCanvasElement {
  const key = `${brush.toFixed(2)}:${grain.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const rand = rng(1337);
  const img = ctx.createImageData(size, size);
  // grain
  for (let i = 0; i < size * size; i++) {
    const n = 200 + (rand() - 0.5) * 110 * grain;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = n;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // brushing streaks (horizontal, wrap-around for seamless tiling)
  const lines = Math.round(2600 * brush);
  for (let i = 0; i < lines; i++) {
    const y = rand() * size;
    const len = size * (0.15 + rand() * 0.9);
    const x = rand() * size;
    const v = rand() > 0.5 ? 255 : 120;
    ctx.strokeStyle = `rgba(${v},${v},${v},${0.05 + rand() * 0.16 * brush})`;
    ctx.lineWidth = 0.6 + rand() * 0.9;
    for (const dx of [0, -size]) {
      ctx.beginPath();
      ctx.moveTo(x + dx, y);
      ctx.lineTo(x + dx + len, y);
      ctx.stroke();
    }
  }
  cache.set(key, c);
  return c;
}

export function makeSurfaceTexture(brush: number, grain: number, directionDeg: number, mmPerTile = 34): THREE.CanvasTexture {
  const q = (v: number) => Math.round(v * 20) / 20;
  const tex = new THREE.CanvasTexture(surfaceCanvas(q(brush), q(grain)));
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / mmPerTile, 1 / mmPerTile);
  tex.rotation = (directionDeg * Math.PI) / 180;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}
