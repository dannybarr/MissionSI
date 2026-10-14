import { useEffect, useState } from 'react';
import type { BrandMark } from '@/studio/studio/types';
import { svgAspect } from '@/studio/studio/svg';
import { cssFont, loadFont } from '@/studio/studio/fonts';
import { ASSETS, assetUrl, type AssetId } from '@/studio/studio/assets';

export interface LogoRaster {
  canvas: HTMLCanvasElement;
  aspect: number; // width / height of plane
  key: string;
  /** true: RGB is real artwork colour (photo marks); false: white alpha mask tinted by the mark ink. */
  color?: boolean;
}

export const FONT_PX = 220;
export const TEXT_H_RATIO = 294 / 220; // canvas height / cap-ish glyph height
export const SVG_H_RATIO = 560 / 512;

function textRaster(m: BrandMark): LogoRaster | null {
  const t = m.text.trim();
  if (!t) return null;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  const font = cssFont(m.font, m.weight, FONT_PX);
  const spacing = (m.tracking / 100) * FONT_PX;
  const ls = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  ctx.font = font;
  ls.letterSpacing = `${spacing}px`;
  const w = ctx.measureText(t).width;
  const pad = 24;
  const h = Math.round(FONT_PX * 1.12);
  c.width = Math.min(8192, Math.ceil(Math.max(8, w) + pad * 2 + Math.abs(spacing)));
  c.height = h + pad * 2;
  ctx.font = font; // resizing a canvas resets its state
  ls.letterSpacing = `${spacing}px`;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(t, pad, pad + FONT_PX * 0.86);
  return { canvas: c, aspect: c.width / c.height, key: `t:${t}:${font}:${m.tracking}` };
}

const svgCache = new Map<string, Promise<LogoRaster>>();

function svgRaster(svg: string): Promise<LogoRaster> {
  const hit = svgCache.get(svg);
  if (hit) return hit;
  const p = new Promise<LogoRaster>((resolve, reject) => {
    const aspect = svgAspect(svg);
    const H = 512;
    const W = Math.round(Math.min(2048, H * aspect));
    const sized = svg.replace(/<svg\b/i, `<svg width="${W}" height="${H}" preserveAspectRatio="xMidYMid meet"`);
    const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => {
      const pad = 24;
      const c = document.createElement('canvas');
      c.width = W + pad * 2;
      c.height = H + pad * 2;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, pad, pad, W, H);
      // single fabrication colour: keep alpha coverage, force RGB to white
      const d = ctx.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < d.data.length; i += 4) d.data[i] = d.data[i + 1] = d.data[i + 2] = 255;
      ctx.putImageData(d, 0, 0);
      URL.revokeObjectURL(url);
      resolve({ canvas: c, aspect: c.width / c.height, key: `s:${svg.length}:${svg.slice(-48)}` });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      svgCache.delete(svg);
      reject(new Error('SVG could not be rasterised'));
    };
    img.src = url;
  });
  svgCache.set(svg, p);
  return p;
}

const imgCache = new Map<AssetId, Promise<LogoRaster>>();

/** Built-in photo at 1024 px with the same proportional padding as SVG rasters (so SVG_H_RATIO applies). */
function imageRaster(id: AssetId): Promise<LogoRaster> {
  const hit = imgCache.get(id);
  if (hit) return hit;
  const p = new Promise<LogoRaster>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const H = 1024;
      const W = Math.round(H * ASSETS[id].aspect);
      const pad = 48;
      const c = document.createElement('canvas');
      c.width = W + pad * 2;
      c.height = H + pad * 2;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, pad, pad, W, H);
      resolve({ canvas: c, aspect: c.width / c.height, key: `i:${id}`, color: true });
    };
    img.onerror = () => {
      imgCache.delete(id);
      reject(new Error('Image asset could not be loaded'));
    };
    img.src = assetUrl(id);
  });
  imgCache.set(id, p);
  return p;
}

/**
 * Rasterises a mark into a white alpha mask. Text waits for its exact web font face
 * (falls back to the CSS stack only if the font cannot load) and re-rasterises once ready.
 */
export function useMarkRaster(m: BrandMark): LogoRaster | null {
  const [r, setR] = useState<LogoRaster | null>(null);
  useEffect(() => {
    let live = true;
    if (m.kind === 'text') {
      // draw immediately (may use fallback), then redraw with the real face
      setR(textRaster(m));
      loadFont(m.font, m.weight).then(() => live && setR(textRaster(m)));
    } else if (m.kind === 'image' && m.asset) {
      imageRaster(m.asset)
        .then((x) => live && setR(x))
        .catch(() => live && setR(null));
    } else if (m.svg) {
      svgRaster(m.svg)
        .then((x) => live && setR(x))
        .catch(() => live && setR(null));
    } else setR(null);
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.kind, m.text, m.font, m.weight, m.tracking, m.svg, m.asset]);
  return r;
}

export function microTextRaster(text: string): LogoRaster {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  const px = 64;
  const font = `500 ${px}px 'Geist Mono', ui-monospace, monospace`;
  ctx.font = font;
  const w = ctx.measureText(text).width;
  c.width = Math.ceil(w + 16);
  c.height = Math.round(px * 1.3);
  ctx.font = font;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 8, c.height / 2 + 2);
  return { canvas: c, aspect: c.width / c.height, key: text };
}
