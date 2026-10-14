import { useCallback, useState, type ReactNode } from 'react';
import { Axis3d, Columns2, Grid3x3, Ruler, Sparkles, X } from 'lucide-react';
import { useStudio } from '@/studio/studio/store';
import type { BrandMark, GeometryParams, ViewPreset } from '@/studio/studio/types';
import { geoHandleKind } from '@/studio/studio/resize';
import { StudioCanvas } from '@/studio/three/StudioCanvas';
import { cn } from '@/studio/lib/utils';
import { IconBtn } from './kit';

const PRESETS: { id: ViewPreset; label: string; key: string }[] = [
  { id: 'front', label: 'Front', key: '1' },
  { id: 'back', label: 'Back', key: '2' },
  { id: 'side', label: 'Right', key: '3' },
  { id: 'top', label: 'Top', key: '4' },
  { id: 'iso', label: 'Iso', key: '5' },
];

function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex items-center gap-0.5 rounded-[7px] border border-white/[0.06] bg-[#101113]/90 p-0.5 shadow-[0_8px_24px_-12px_rgba(16,17,19,0.6)] backdrop-blur', className)}>{children}</div>;
}

const HINT_KEY = 'mission-studio:first-use-v1';
function readHint() {
  try {
    return localStorage.getItem(HINT_KEY) !== 'dismissed';
  } catch {
    return true;
  }
}

function FirstUseHint() {
  const [open, setOpen] = useState(readHint);
  if (!open) return null;
  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(HINT_KEY, 'dismissed');
    } catch {
      /* storage blocked: hint simply reappears next visit */
    }
  };
  const rows: [string, string][] = [
    ['Click a part', 'edit only what it supports'],
    ['Drag a mark', 'snaps to centre and other marks; Shift = free'],
    ['Arrows', 'nudge mark 0.5 mm (Shift 2 mm)'],
    ['Del / Ctrl+D', 'remove / duplicate mark'],
    ['1-5, F', 'views, reframe'],
    ['Ctrl+S, Ctrl+Z', 'save, undo'],
  ];
  return (
    <div role="note" aria-label="Getting started" className="absolute max-md:hidden bottom-12 left-4 z-10 w-[290px] max-w-[calc(100%-2rem)] rounded-[8px] border border-white/[0.07] bg-[#101113]/95 p-3 text-[#e9e6df] shadow-[0_12px_32px_-16px_rgba(16,17,19,0.7)] backdrop-blur" data-testid="panel-first-use">
      <div className="mb-2 flex items-center justify-between">
        <span className="label-xs">Getting started</span>
        <button type="button" onClick={close} className="rounded-[4px] p-0.5 text-[#7d7a75] hover:text-[#f3f1ec] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[hsl(var(--signal))]" aria-label="Dismiss getting started" data-testid="button-dismiss-first-use">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-mono text-[10.5px] text-[hsl(var(--signal))]">{k}</dt>
            <dd className="text-[#a9a6a0]">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Says what the corner handles of the current selection do, why there are none, and the exact-value equivalent. */
function ResizeHint() {
  const { design, selected, selectedMark } = useStudio();
  const mark = selectedMark ? design.marks.find((m) => m.id === selectedMark) : null;
  let text: string | null = null;
  let muted = false;
  if (mark && (selected === 'logo' || selected === 'face' || selected === 'back' || !selected)) {
    if (mark.locked || design.components.logo.locked) {
      text = `${mark.name} is locked: no resize handles.`;
      muted = true;
    } else text = 'Drag a corner to scale this mark proportionally; the opposite corner stays put. Esc cancels. Exact value: Size in Branding.';
  } else if (selected) {
    const k = geoHandleKind(selected);
    const C = design.components;
    if (typeof k !== 'string') {
      text = k.reason;
      muted = true;
    } else if (C[selected].locked || (k === 'outline' && C.chassis.locked)) {
      text = `${C[k === 'outline' && C.chassis.locked ? 'chassis' : selected].name} is locked: no resize handles.`;
      muted = true;
    } else if (!C[selected].visible) {
      text = null;
    } else if (k === 'outline') text = 'Corners resize the card width and height, symmetrically about its centre. Esc cancels. Exact values: Width and Height in Geometry.';
    else if (k === 'side') text = 'Corners set the side-cut length and depth; both cuts mirror. Esc cancels.';
    else text = 'Corners set the notch length (far end stays put) and depth; top and bottom are linked. Esc cancels.';
  }
  if (!text) return null;
  return (
    <div className="pointer-events-none absolute bottom-16 left-1/2 z-10 max-w-[min(92%,560px)] -translate-x-1/2" role="status" data-testid="text-resize-hint">
      <div className={cn('rounded-[6px] border px-2.5 py-1.5 text-center text-[11px] leading-[1.4] backdrop-blur', muted ? 'border-black/10 bg-[#17181b]/70 text-[#a9a6a0]' : 'border-[hsl(var(--signal))]/30 bg-[#17181b]/80 text-[#e9e6df]')}>{text}</div>
    </div>
  );
}

export function ViewportArea({ presetSignal, requestPreset }: { presetSignal: number; requestPreset: (p: ViewPreset) => void }) {
  const { design, view, setView, selected, select, selectedMark, selectMark, updateMark, updateDesign, gesture, compare, setCompare, project, variant } = useStudio();

  const onMarkMove = useCallback((id: string, x: number, y: number) => updateMark(id, 'drag', { x, y }), [updateMark]);
  const onMarkPatch = useCallback((id: string, patch: Partial<BrandMark>) => updateMark(id, 'resize', patch), [updateMark]);
  const onGeoPatch = useCallback(
    (patch: Partial<GeometryParams>) => updateDesign('geo:resize', (d) => ({ ...d, geometry: { ...d.geometry, ...patch } })),
    [updateDesign],
  );

  const a = project.variants.find((v) => v.id === compare.a) ?? variant;
  const b = project.variants.find((v) => v.id === compare.b) ?? variant;
  const g = design.geometry;

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden" style={{ background: design.lighting.background }}>
      {compare.on ? (
        <div className="grid h-full grid-cols-2">
          {[
            { side: 'a' as const, v: a },
            { side: 'b' as const, v: b },
          ].map(({ side, v }) => (
            <div key={side} className={cn('relative h-full', side === 'b' && 'border-l border-black/10')} style={{ background: v.design.lighting.background }}>
              <StudioCanvas design={v.design} view={{ ...view, guides: false }} presetSignal={presetSignal} />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <Pill>
                  <span className="label-xs px-2">{side.toUpperCase()}</span>
                  <select
                    aria-label={`Compare variant ${side.toUpperCase()}`}
                    value={v.id}
                    onChange={(e) => setCompare({ [side]: e.target.value })}
                    className="h-6 rounded-[5px] bg-transparent px-1 text-[11.5px] text-[#e9e6df] focus:outline-none"
                    data-testid={`select-compare-${side}`}
                  >
                    {project.variants.map((o) => (
                      <option key={o.id} value={o.id} className="bg-[#17181b]">
                        {o.name}
                      </option>
                    ))}
                  </select>
                </Pill>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <StudioCanvas
          design={design}
          view={view}
          primary
          interactive
          selected={selected}
          onSelect={select}
          selectedMark={selectedMark}
          onSelectMark={selectMark}
          onMarkMove={onMarkMove}
          onMarkPatch={onMarkPatch}
          onGeoPatch={onGeoPatch}
          onGesture={gesture}
          presetSignal={presetSignal}
        />
      )}
      {!compare.on && <ResizeHint />}
      {!compare.on && <FirstUseHint />}

      {/* top chrome */}
      {/* narrow screens: one horizontally scrollable strip so no control is clipped off-screen */}
      <div className="studio-scroll absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 max-md:overflow-x-auto md:flex-wrap px-3 py-3 max-md:pointer-events-auto md:pointer-events-none" data-testid="viewport-controls">
        <div className="pointer-events-auto flex max-md:shrink-0 items-center gap-2 md:flex-wrap">
          <Pill>
            {(['perspective', 'orthographic'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={view.camera === m}
                onClick={() => setView({ camera: m })}
                className={cn('h-6 rounded-[5px] px-2 text-[11px] transition-colors', view.camera === m ? 'bg-white/[0.1] text-[#f3f1ec]' : 'text-[#8d8a85] hover:text-[#e9e6df]')}
                data-testid={`button-camera-${m}`}
              >
                {m === 'perspective' ? 'Persp' : 'Ortho'}
              </button>
            ))}
          </Pill>
          <Pill>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                title={`${p.label} view (${p.key})`}
                aria-pressed={view.preset === p.id}
                onClick={() => requestPreset(p.id)}
                className={cn('h-6 rounded-[5px] px-2 text-[11px] transition-colors', view.preset === p.id ? 'bg-white/[0.1] text-[#f3f1ec]' : 'text-[#8d8a85] hover:text-[#e9e6df]')}
                data-testid={`button-view-${p.id}`}
              >
                {p.label}
              </button>
            ))}
          </Pill>
        </div>
        <Pill className="pointer-events-auto shrink-0">
          <div role="radiogroup" aria-label="Shading mode" className="flex items-center">
            {(
              [
                ['accurate', 'True colour', 'Colour-accurate: unlit surfaces show the exact chosen hex'],
                ['studio', 'Studio', 'Studio shading: physically based lighting; apparent colour varies with light and angle'],
              ] as const
            ).map(([m, label, title]) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={view.shading === m}
                title={title}
                onClick={() => setView({ shading: m })}
                className={cn('h-6 rounded-[5px] px-2 text-[11px] transition-colors', view.shading === m ? 'bg-white/[0.1] text-[#f3f1ec]' : 'text-[#8d8a85] hover:text-[#e9e6df]')}
                data-testid={`button-shading-${m}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mx-0.5 h-4 w-px bg-white/10" />
          <IconBtn label="Grid" active={view.grid} onClick={() => setView({ grid: !view.grid })} testId="button-toggle-grid">
            <Grid3x3 className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn label="Dimension guides" active={view.guides} onClick={() => setView({ guides: !view.guides })} testId="button-toggle-guides">
            <Ruler className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn label="Axes" active={view.axes} onClick={() => setView({ axes: !view.axes })} testId="button-toggle-axes">
            <Axis3d className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn
            label={view.shading === 'studio' ? 'Ambient occlusion and SMAA' : 'Ambient occlusion (studio shading only)'}
            active={view.ao && view.shading === 'studio'}
            disabled={view.shading !== 'studio'}
            onClick={() => setView({ ao: !view.ao })}
            testId="button-toggle-ao"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </IconBtn>
          <div className="mx-0.5 h-4 w-px bg-white/10" />
          {compare.on ? (
            <IconBtn label="Exit compare" onClick={() => setCompare({ on: false })} active testId="button-exit-compare">
              <X className="h-3.5 w-3.5" />
              <span className="text-[11px]">Compare</span>
            </IconBtn>
          ) : (
            <IconBtn
              label="Compare two variants side by side"
              onClick={() => setCompare({ on: true, a: project.activeVariantId, b: project.variants.find((v) => v.id !== project.activeVariantId)?.id ?? project.activeVariantId })}
              testId="button-compare"
              disabled={project.variants.length < 2}
            >
              <Columns2 className="h-3.5 w-3.5" />
            </IconBtn>
          )}
        </Pill>
      </div>

      {/* bottom readouts */}
      {!compare.on && (
        <div className="pointer-events-none absolute inset-x-4 bottom-3 flex items-end justify-between text-[#55534f]">
          <div className="mono text-[10.5px]" data-testid="text-dimensions">
            {g.width.toFixed(1)} × {g.height.toFixed(1)} × {g.thickness.toFixed(2)} mm
            <span className="mx-2 text-[#9a9893]">/</span>
            {view.camera === 'perspective' ? 'PERSP 22°' : 'ORTHO'} · {view.preset.toUpperCase()} · {view.shading === 'accurate' ? 'TRUE COLOUR (UNLIT sRGB)' : 'STUDIO PBR'}
          </div>
          <div className="text-[10.5px]">Drag orbit · Right-drag pan · Scroll zoom{selectedMark ? ' · Drag mark to place' : ''}</div>
        </div>
      )}
    </div>
  );
}
