import { useId, useMemo } from 'react';
import { outlinePoints, outlineToSvgPath, specFrom } from '@/studio/three/outline';
import { faceMaterial, shade } from '@/studio/studio/presets';
import { useStudio } from '@/studio/studio/store';
import type { Design, MarkSide } from '@/studio/studio/types';
import { MarkPreview } from './MarkPreview';

/**
 * Vector schematic of a design, generated from the same parametric outline as the 3D model.
 * In True colour mode surfaces are flat exact swatches (no gradient), matching the unlit viewport.
 */
export function CardThumb({ design, width = 132, side = 'front' }: { design: Design; width?: number; side?: MarkSide }) {
  const { view } = useStudio();
  const exact = view.shading === 'accurate';
  const g = design.geometry;
  const C = design.components;
  const pad = 6;
  const scale = (width - pad * 2) / g.width;
  const height = g.height * scale + pad * 2;
  const back = side === 'back';
  const faceCol = faceMaterial(design, side).color;
  const paths = useMemo(() => {
    const s = specFrom(g, { top: C.topContour.visible, bottom: C.bottomContour.visible, side: C.sideContours.visible });
    const o = (i: number) => outlineToSvgPath(outlinePoints(s, i, 1.2), scale, width / 2, height / 2);
    return { outer: o(0), trim: o(g.border), face: o(g.border + g.trim + g.faceMargin) };
  }, [g, C.topContour.visible, C.bottomContour.visible, C.sideContours.visible, scale, width, height]);
  const uid = 't' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const marks = C.logo.visible ? design.marks.filter((m) => m.side === side && m.visible) : [];
  const edge = shade(design.trim.color, -0.35);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      {!exact && (
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor={shade(faceCol, 0.18)} />
            <stop offset="1" stopColor={shade(faceCol, -0.12)} />
          </linearGradient>
        </defs>
      )}
      <g transform={back ? `translate(${width} 0) scale(-1 1)` : undefined}>
        {/* back mirrors the front build (rims, trim, face) */}
        <path d={paths.outer} fill={exact ? design.trim.color : shade(design.trim.color, -0.1)} stroke={exact ? edge : 'none'} strokeWidth={0.6} />
        <path d={paths.trim} fill={exact ? design.trim.color : shade(design.trim.color, 0.15)} stroke={exact ? edge : 'none'} strokeWidth={0.5} />
        <path d={paths.face} fill={exact ? faceCol : `url(#${uid})`} stroke={exact ? shade(faceCol, -0.3) : 'none'} strokeWidth={0.5} />
      </g>
      {marks.map((m) => (
        <g key={m.id} transform={`translate(${width / 2 + m.x * scale} ${height / 2 - m.y * scale}) rotate(${-m.rotation})`}>
          <MarkPreview mark={m} body={faceMaterial(design, side)} scale={scale} uid={uid} />
        </g>
      ))}
    </svg>
  );
}
