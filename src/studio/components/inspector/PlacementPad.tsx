import { useMemo, useRef } from 'react';
import { useStudio } from '@/studio/studio/store';
import { estimateWidth } from '@/studio/studio/marks';
import { MarkPreview, markBox } from '../MarkPreview';
import type { BrandMark } from '@/studio/studio/types';
import { faceMaterial } from '@/studio/studio/presets';
import { outlinePoints, outlineToSvgPath, specFrom } from '@/studio/three/outline';

/**
 * 2D placement pad for one mark, drawn as the viewer sees that side.
 * The back view is the model outline mirrored horizontally, so dragging right on the pad
 * moves the mark to the right as seen when the card is turned over.
 */
export function PlacementPad({ mark, disabled }: { mark: BrandMark; disabled: boolean }) {
  const { design, updateMark, selectMark } = useStudio();
  const g = design.geometry;
  const ref = useRef<SVGSVGElement>(null);
  const W = 252;
  const scale = (W - 16) / g.width;
  const H = g.height * scale + 16;
  const back = mark.side === 'back';
  const paths = useMemo(() => {
    const s = specFrom(g, { top: design.components.topContour.visible, bottom: design.components.bottomContour.visible, side: design.components.sideContours.visible });
    return {
      outer: outlineToSvgPath(outlinePoints(s, 0, 1), scale, W / 2, H / 2),
      inner: outlineToSvgPath(outlinePoints(s, g.border + g.trim, 1), scale, W / 2, H / 2),
    };
  }, [g, scale, H, design.components.topContour.visible, design.components.bottomContour.visible, design.components.sideContours.visible]);

  const lim = (v: number, m: number) => Math.round(Math.max(-m, Math.min(m, v)) * 10) / 10;
  const toMm = (cx: number, cy: number) => {
    const r = ref.current!.getBoundingClientRect();
    const x = ((cx - r.left) / r.width) * W;
    const y = ((cy - r.top) / r.height) * H;
    return { x: lim((x - W / 2) / scale, g.width / 2 - 3), y: lim(-(y - H / 2) / scale, g.height / 2 - 3) };
  };
  const move = (cx: number, cy: number) => updateMark(mark.id, 'drag', toMm(cx, cy));

  const sameSide = design.marks.filter((m) => m.side === mark.side && m.visible);

  return (
    <div className={disabled ? 'pointer-events-none opacity-40' : ''}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair touch-none select-none rounded-[5px] bg-black/25 focus:outline focus:outline-1 focus:outline-[hsl(var(--signal))]/60"
        role="application"
        aria-label={`${mark.name} placement on the ${mark.side} face, viewed from the ${mark.side}. Drag to position; arrow keys nudge 0.5 mm, Shift for 2 mm.`}
        tabIndex={0}
        onPointerDown={(e) => {
          (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
          move(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => e.buttons === 1 && move(e.clientX, e.clientY)}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 2 : 0.5;
          const d = ({ ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] } as Record<string, number[]>)[e.key];
          if (!d) return;
          e.preventDefault();
          updateMark(mark.id, 'nudge', { x: lim(mark.x + d[0], g.width / 2 - 3), y: lim(mark.y + d[1], g.height / 2 - 3) });
        }}
        data-testid="pad-mark-placement"
      >
        <g transform={back ? `translate(${W} 0) scale(-1 1)` : undefined}>
          <path d={paths.outer} fill="none" stroke="rgba(233,230,223,0.35)" strokeWidth={1} />
          {/* face drawn in the exact body colour so mark ink reads true */}
          <path d={paths.inner} fill={faceMaterial(design, mark.side).color} stroke="rgba(233,230,223,0.15)" strokeWidth={0.75} />
        </g>
        <line x1={W / 2} x2={W / 2} y1={8} y2={H - 8} stroke="rgba(255,255,255,0.06)" />
        <line y1={H / 2} y2={H / 2} x1={8} x2={W - 8} stroke="rgba(255,255,255,0.06)" />
        {sameSide.map((m) => {
          const mx = W / 2 + m.x * scale;
          const my = H / 2 - m.y * scale;
          const box = markBox(m, scale);
          const bw = (box?.w ?? estimateWidth(m) * scale) + 3;
          const bh = (box?.h ?? m.size * scale) + 3;
          const me = m.id === mark.id;
          return (
            <g
              key={m.id}
              transform={`translate(${mx} ${my}) rotate(${-m.rotation})`}
              onPointerDown={(e) => {
                if (me) return;
                e.stopPropagation();
                selectMark(m.id);
              }}
              className={me ? undefined : 'cursor-pointer'}
            >
              <MarkPreview mark={m} body={faceMaterial(design, mark.side)} scale={scale} uid="pad" opacity={me ? 1 : 0.55} />
              <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={1.5} fill="transparent" stroke={me ? '#ff6a2b' : 'rgba(233,230,223,0.35)'} strokeWidth={1} strokeDasharray={me ? undefined : '2 2'} />
            </g>
          );
        })}
        <circle cx={W / 2 + mark.x * scale} cy={H / 2 - mark.y * scale} r={2.5} fill="#ff6a2b" />
        <text x={8} y={14} fill="rgba(233,230,223,0.45)" fontSize={8} fontFamily="Geist Mono, monospace" letterSpacing={1}>
          {back ? 'BACK · VIEWED FROM BEHIND' : 'FRONT'}
        </text>
      </svg>
      <div className="mono mt-1 flex justify-between text-[10px] text-[#6c6a66]">
        <span>x {mark.x.toFixed(1)}</span>
        <span>drag here or on the 3D {mark.side}</span>
        <span>y {mark.y.toFixed(1)}</span>
      </div>
    </div>
  );
}
