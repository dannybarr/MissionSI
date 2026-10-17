import { useStudio } from '@/studio/studio/store';
import { MATERIAL_ORDER, MATERIALS, materialFromPreset, trimFor, uid } from '@/studio/studio/presets';
import type { CompId, MaterialParams, MaterialSlot } from '@/studio/studio/types';
import { SLOT_USERS } from '@/studio/studio/capabilities';
import { cn } from '@/studio/lib/utils';
import { ColorField, Note, ParamSlider, Section, Segmented, SwitchRow, TextBtn } from '../kit';

function swatchStyle(p: MaterialParams, exact = false) {
  if (exact) return { background: p.color }; // True colour: the exact swatch, no simulated sheen
  const hi = p.metalness > 0.5 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)';
  const spread = 20 + p.roughness * 60;
  return {
    background: `radial-gradient(circle at 32% 28%, ${hi} 0%, ${p.color} ${spread}%, color-mix(in srgb, ${p.color} 55%, #000) 100%)`,
  };
}

export function MaterialPanel({ slot, setSlot, comp }: { slot: MaterialSlot; setSlot: (s: MaterialSlot) => void; comp?: CompId | null }) {
  const { design, updateDesign, view, setView } = useStudio();
  const exact = view.shading === 'accurate';
  const m = design[slot];
  const locked = comp
    ? design.components[comp].locked
    : slot === 'body'
      ? design.components.face.locked
      : design.components.perimeter.locked && design.components.chamfer.locked;

  const bf = design.backFace;
  // the back has its own colour only when unlinked; every other body parameter stays shared
  const separate = slot === 'body' && !bf.linked && !!bf.color;
  const onBack = comp === 'back';
  const setLinked = (linked: boolean) =>
    updateDesign(`mat:back:link:${uid()}`, (d) => ({
      ...d,
      backFace: linked ? { ...d.backFace, linked: true } : { linked: false, color: d.backFace.color ?? d.body.color },
    }));
  const setBackColor = (v: string) => updateDesign('mat:back:color', (d) => ({ ...d, backFace: { linked: false, color: v } }));

  const set = <K extends keyof MaterialParams>(k: K, v: MaterialParams[K]) =>
    updateDesign(`mat:${slot}:${k}`, (d) => ({ ...d, [slot]: { ...d[slot], [k]: v } }));

  const studioOnly = exact && (
    <div className="flex flex-col items-start gap-2 rounded-[7px] border border-[hsl(var(--signal))]/30 bg-[hsl(var(--signal))]/[0.07] px-3 py-2.5" data-testid="status-studio-only">
      <p className="text-[11px] leading-[1.5] text-[#d9d6cf]">
        True colour shows the exact hex with no lighting, so metal, roughness and texture have nothing to change. Switch to Studio shading to edit them.
      </p>
      <TextBtn variant="outline" className="h-7 shrink-0 px-2.5 text-[11px]" onClick={() => setView({ shading: 'studio' })} testId="button-switch-studio">
        Switch to Studio shading
      </TextBtn>
    </div>
  );

  return (
    <>
      {comp ? (
        <div className="border-b border-white/[0.06] px-4 py-3" data-testid="status-shared-material">
          <div className="mb-1.5 text-[11.5px] text-[#e9e6df]">{slot === 'body' ? 'Face & body' : 'Rims & chassis'} material</div>
          <Note>
            {separate
              ? onBack
                ? 'Finish, metal and texture are shared with the Front face. Only the colour below is the back\u2019s own.'
                : 'Finish, metal and texture also apply to the Back face, which has its own colour.'
              : `Shared: changes also apply to ${SLOT_USERS[slot]}.`}
          </Note>
        </div>
      ) : (
      <div className="border-b border-white/[0.06] px-4 py-3">
          <Segmented
            label="Material slot"
            value={slot}
            onChange={setSlot}
            options={[
              { value: 'body', label: 'Face & body' },
              { value: 'trim', label: 'Rims & chassis' },
            ]}
            testId="segment-material-slot"
          />
        </div>
      )}
      {onBack && (
        <Section title="Back face colour">
          <div className="space-y-2.5" data-testid="section-back-colour">
            <SwitchRow
              label="Match front colour"
              hint={bf.linked ? 'The back uses the front colour.' : 'The back has its own colour.'}
              checked={bf.linked}
              onChange={setLinked}
              disabled={locked}
              testId="switch-back-match-front"
            />
            {!bf.linked && <ColorField label="Back colour" value={bf.color ?? design.body.color} onChange={setBackColor} disabled={locked} testId="color-back-face" />}
            {bf.linked && bf.color && bf.color.toLowerCase() !== design.body.color.toLowerCase() && (
              <Note>Your back colour {bf.color.toUpperCase()} is kept for when you turn matching off.</Note>
            )}
          </div>
        </Section>
      )}
      <Section title="Material library">
        <div className="grid grid-cols-4 gap-2">
          {MATERIAL_ORDER.map((id) => {
            const p = materialFromPreset(id);
            return (
              <button
                key={id}
                type="button"
                disabled={locked}
                title={`${MATERIALS[id].label} — ${MATERIALS[id].note}`}
                aria-pressed={m.preset === id}
                onClick={() => updateDesign(`mat:${slot}:preset`, (d) => ({ ...d, [slot]: slot === 'body' ? materialFromPreset(id) : trimFor(id) }))}
                className="group flex flex-col items-center gap-1 disabled:opacity-40"
                data-testid={`button-material-${id}`}
              >
                <span
                  className={cn(
                    'h-10 w-full rounded-[5px] ring-1 ring-white/10 transition-transform group-hover:-translate-y-0.5',
                    m.preset === id && 'ring-2 ring-[hsl(var(--signal))] ring-offset-2 ring-offset-[#121315]',
                  )}
                  style={swatchStyle(p, exact)}
                />
                <span className="w-full truncate text-center text-[9.5px] leading-tight text-[#8d8a85]">{MATERIALS[id].label.replace(' stainless steel', ' steel')}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-[11.5px] text-[#e9e6df]">{MATERIALS[m.preset].label}</span>
          <span className="text-[10.5px] text-[#6c6a66]">{MATERIALS[m.preset].note}</span>
        </div>
      </Section>
      <Section
        title="Surface"
        aside={
          <TextBtn
            testId="button-reset-material"
            className="h-5 px-1.5 text-[10.5px]"
            disabled={locked}
            onClick={() => updateDesign(`mat:${slot}:reset`, (d) => ({ ...d, [slot]: slot === 'body' ? materialFromPreset(m.preset) : trimFor(m.preset) }))}
          >
            Reset
          </TextBtn>
        }
      >
        {onBack && separate ? (
          <div className="flex items-center justify-between gap-2" data-testid="status-front-colour">
            <span className="text-[11.5px] text-[#a9a6a0]">Front colour</span>
            <span className="mono flex items-center gap-1.5 text-[11px] uppercase text-[#8d8a84]">
              <span className="h-3.5 w-3.5 rounded-[3px] ring-1 ring-white/15" style={{ background: m.color }} />
              {m.color} · from Front face
            </span>
          </div>
        ) : (
          <ColorField label={separate ? 'Front colour' : 'Base colour'} value={m.color} onChange={(v) => set('color', v)} disabled={locked} testId="color-material-base" />
        )}
        {exact && <Note>Base colour is shown exactly in True colour.</Note>}
        {studioOnly}
        <ParamSlider label="Metallic intensity" value={m.metalness} min={0} max={1} onChange={(v) => set('metalness', v)} disabled={locked || exact} testId="slider-metalness" />
        <ParamSlider label="Surface roughness" value={m.roughness} min={0.02} max={1} onChange={(v) => set('roughness', v)} disabled={locked || exact} testId="slider-roughness" />
        <ParamSlider label="Reflectivity" value={m.reflectivity} min={0} max={2.5} onChange={(v) => set('reflectivity', v)} disabled={locked || exact} testId="slider-reflectivity" />
        <ParamSlider label="Clear coat" value={m.clearcoat} min={0} max={1} onChange={(v) => set('clearcoat', v)} disabled={locked || exact} testId="slider-clearcoat" />
      </Section>
      <Section title="Procedural finish">
        {studioOnly && <Note>Also Studio shading only.</Note>}
        <ParamSlider label="Brushed finish" value={m.brush} min={0} max={1} step={0.05} onChange={(v) => set('brush', v)} disabled={locked || exact} testId="slider-brush" />
        <ParamSlider label="Bead-blast grain" value={m.grain} min={0} max={1} step={0.05} onChange={(v) => set('grain', v)} disabled={locked || exact} testId="slider-grain" />
        <ParamSlider label="Texture direction" value={m.direction} min={0} max={180} step={1} unit="deg" onChange={(v) => set('direction', v)} disabled={locked || exact} testId="slider-direction" />
        <Note>Brushing and grain are generated procedurally and drive both micro-roughness and bump, so highlights stretch along the grain.</Note>
      </Section>
    </>
  );
}
