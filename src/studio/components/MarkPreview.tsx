import { useMemo } from 'react';
import type { BrandMark, MaterialParams } from '@/studio/studio/types';
import { FONTS, nearestWeight } from '@/studio/studio/fonts';
import { svgAspect } from '@/studio/studio/svg';
import { SVG_H_RATIO } from '@/studio/three/logoRaster';
import { markColor } from '@/studio/three/MarkMesh';
import { ASSETS, assetUrl } from '@/studio/studio/assets';

/** Mark artwork in face-viewer millimetres scaled by `scale`, centred on 0,0 (caller applies translate/rotate). */
export function markBox(m: BrandMark, scale: number) {
  if (m.kind === 'image' && m.asset) {
    const h = m.size * SVG_H_RATIO * scale;
    return { w: h * ASSETS[m.asset].aspect, h };
  }
  if (m.kind === 'svg' && m.svg) {
    const h = m.size * SVG_H_RATIO * scale;
    return { w: h * svgAspect(m.svg), h };
  }
  return null;
}

/**
 * Real artwork for 2D previews. SVG marks are the sanitised source used as an alpha mask and filled with the
 * mark's actual ink (same rule as the 3D mark), so proportions, rotation and colour match the model.
 */
export function MarkPreview({ mark: m, body, scale, uid, opacity = 1 }: { mark: BrandMark; body: MaterialParams; scale: number; uid: string; opacity?: number }) {
  const color = markColor(m, body);
  const href = useMemo(() => (m.kind === 'svg' && m.svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(m.svg)}` : null), [m.kind, m.svg]);
  if (m.kind === 'image' && m.asset) {
    // photo marks: the real natural-colour picture (image padding matches the 3D raster)
    const b = markBox(m, scale)!;
    const inner = b.h / SVG_H_RATIO;
    return <image href={assetUrl(m.asset)} x={-inner / 2} y={-inner / 2} width={inner * ASSETS[m.asset].aspect} height={inner} opacity={opacity} preserveAspectRatio="xMidYMid meet" />;
  }
  if (href) {
    const b = markBox(m, scale)!;
    const id = `${uid}-${m.id}`.replace(/[^a-zA-Z0-9_-]/g, '');
    return (
      <g opacity={opacity}>
        <mask id={id} maskUnits="userSpaceOnUse" x={-b.w / 2} y={-b.h / 2} width={b.w} height={b.h} style={{ maskType: 'alpha' }}>
          <image href={href} x={-b.w / 2} y={-b.h / 2} width={b.w} height={b.h} preserveAspectRatio="xMidYMid meet" />
        </mask>
        <rect x={-b.w / 2} y={-b.h / 2} width={b.w} height={b.h} fill={color} mask={`url(#${id})`} />
      </g>
    );
  }
  return (
    <text
      y={m.size * scale * 0.35}
      fontSize={m.size * scale}
      fontFamily={`"${FONTS[m.font].family}", ${FONTS[m.font].fallback}`}
      fontWeight={nearestWeight(m.font, m.weight)}
      letterSpacing={(m.tracking / 100) * m.size * scale}
      textAnchor="middle"
      fill={color}
      opacity={opacity}
    >
      {m.text}
    </text>
  );
}
