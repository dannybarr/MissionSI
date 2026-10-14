import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import { useStudio } from '@/studio/studio/store';
import { MATERIALS } from '@/studio/studio/presets';
import { StudioCanvas } from '@/studio/three/StudioCanvas';
import { IconBtn } from './kit';
import { MissionMark } from './Toolbar';

export function Presentation() {
  const { project, variant, setActiveVariant, setPresentation, view } = useStudio();
  const [spin, setSpin] = useState(true);
  const idx = project.variants.findIndex((v) => v.id === variant.id);
  const go = (d: number) => setActiveVariant(project.variants[(idx + d + project.variants.length) % project.variants.length].id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPresentation(false);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === ' ') {
        e.preventDefault();
        setSpin((s) => !s);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const d = variant.design;
  const g = d.geometry;
  return (
    <div className="fixed inset-0 z-50 ms-enter" style={{ background: d.lighting.background }} data-testid="view-presentation">
      <StudioCanvas key={variant.id} design={d} view={{ ...view, grid: false, guides: false, axes: false, preset: 'iso' }} turntable={spin} />
      <div className="pointer-events-none absolute inset-x-10 top-8 flex items-start justify-between text-[#1b1c1f]">
        <div className="flex items-center gap-2">
          <MissionMark className="h-5 w-5" />
          <span className="text-[12px] font-semibold tracking-[0.18em]">MISSION</span>
        </div>
        <div className="mono text-right text-[10.5px] text-[#55534f]">
          {String(idx + 1).padStart(2, '0')} / {String(project.variants.length).padStart(2, '0')}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-10 left-10 max-w-[420px] text-[#1b1c1f]">
        <div className="text-[11px] tracking-[0.16em] text-[#6d6b66]">{project.name.toUpperCase()}</div>
        <h1 className="mt-1 text-[34px] font-light leading-[1.05] tracking-[-0.035em]" data-testid="text-presentation-variant">
          {variant.name}
        </h1>
        <div className="mono mt-3 space-y-0.5 text-[11px] text-[#55534f]">
          <div>{MATERIALS[d.body.preset].label} / {MATERIALS[d.trim.preset].label} rim</div>
          <div>
            {g.width.toFixed(1)} × {g.height.toFixed(1)} × {g.thickness.toFixed(2)} mm
          </div>
          {variant.note && <div className="font-sans text-[12px] text-[#6d6b66]">{variant.note}</div>}
        </div>
      </div>
      <div className="absolute bottom-10 right-10 flex items-center gap-1 rounded-[8px] bg-[#101113]/90 p-1 backdrop-blur">
        <IconBtn label="Previous variant" onClick={() => go(-1)} testId="button-present-prev" kbd="Left">
          <ChevronLeft className="h-4 w-4" />
        </IconBtn>
        <IconBtn label={spin ? 'Pause turntable' : 'Play turntable'} onClick={() => setSpin(!spin)} testId="button-present-spin" kbd="Space">
          {spin ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </IconBtn>
        <IconBtn label="Next variant" onClick={() => go(1)} testId="button-present-next" kbd="Right">
          <ChevronRight className="h-4 w-4" />
        </IconBtn>
        <div className="mx-1 h-4 w-px bg-white/10" />
        <IconBtn label="Exit presentation" onClick={() => setPresentation(false)} testId="button-present-exit" kbd="Esc">
          <X className="h-4 w-4" />
        </IconBtn>
      </div>
    </div>
  );
}
