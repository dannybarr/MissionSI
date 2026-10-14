import { useStudio } from '@/studio/studio/store';
import { DEFAULT_LIGHTING, ENV_PRESETS } from '@/studio/studio/presets';
import type { EnvPreset, LightingParams } from '@/studio/studio/types';
import { cn } from '@/studio/lib/utils';
import { ColorField, Note, ParamSlider, Section, Segmented, SwitchRow, TextBtn } from '../kit';

const BACKDROPS = ['#eeeeec', '#f4f1ea', '#e3e5e6', '#d9d6cf', '#bfc1c3', '#2a2b2e', '#141517'];

export function LightingPanel() {
  const { design, updateDesign, view, setView } = useStudio();
  const accurate = view.shading === 'accurate';
  const l = design.lighting;
  const set = <K extends keyof LightingParams>(k: K, v: LightingParams[K]) =>
    updateDesign(`light:${k}`, (d) => ({ ...d, lighting: { ...d.lighting, [k]: v } }));

  return (
    <>
      <Section title="Colour mode">
        <Segmented
          label="Shading mode"
          value={view.shading}
          onChange={(v) => setView({ shading: v as typeof view.shading })}
          options={[
            { value: 'accurate', label: 'True colour' },
            { value: 'studio', label: 'Studio shading' },
          ]}
          testId="segment-shading"
        />
        {accurate ? (
          <Note>
            Colour-accurate (default). Surfaces are unlit sRGB with tone mapping off, so every pixel shows the exact hex you picked, at any angle, in the viewport, compare,
            presentation and PNG render. Form is read from drawn creases; lighting, metalness and roughness are not shown.
          </Note>
        ) : (
          <Note>
            Studio shading is physically based. Metals have no flat colour: you see the chosen tint multiplied by reflected light, so apparent colour changes with the
            environment, exposure and viewing angle. Use True colour to judge the exact colour.
          </Note>
        )}
      </Section>
      <Section
        title="Environment"
        aside={
          <TextBtn testId="button-reset-lighting" className="h-5 px-1.5 text-[10.5px]" onClick={() => updateDesign('light:reset', (d) => ({ ...d, lighting: { ...DEFAULT_LIGHTING } }))}>
            Reset
          </TextBtn>
        }
      >
        {accurate && <Note>Environment and light settings apply in Studio shading. Shadows and backdrop apply in both modes.</Note>}
        <div className={cn('grid grid-cols-2 gap-1.5', accurate && 'opacity-50')}>
          {(Object.keys(ENV_PRESETS) as EnvPreset[]).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={l.env === id}
              onClick={() => set('env', id)}
              className={cn(
                'rounded-[5px] border px-2 py-1.5 text-left transition-colors',
                l.env === id ? 'border-[hsl(var(--signal))]/70 bg-white/[0.04]' : 'border-white/[0.07] hover:border-white/[0.16]',
              )}
              data-testid={`button-env-${id}`}
            >
              <div className="text-[11.5px] text-[#e9e6df]">{ENV_PRESETS[id].label}</div>
              <div className="text-[10px] leading-tight text-[#6c6a66]">{ENV_PRESETS[id].note}</div>
            </button>
          ))}
        </div>
        <ParamSlider label="Main light intensity" value={l.intensity} min={0} max={5} disabled={accurate} onChange={(v) => set('intensity', v)} testId="slider-light-intensity" />
        <ParamSlider label="Reflection strength" value={l.reflection} min={0} max={2.5} disabled={accurate} onChange={(v) => set('reflection', v)} testId="slider-reflection" />
        <ParamSlider label="Exposure" value={l.exposure} min={0.3} max={2.5} disabled={accurate} onChange={(v) => set('exposure', v)} testId="slider-exposure" />
        <SwitchRow label="Shadows" hint="Key-light shadow + contact shadow" checked={l.shadows} onChange={(v) => set('shadows', v)} testId="switch-shadows" />
      </Section>
      <Section title="Backdrop">
        <ColorField label="Background colour" value={l.background} onChange={(v) => set('background', v)} testId="color-background" />
        <div className="flex gap-1.5">
          {BACKDROPS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Backdrop ${c}`}
              onClick={() => set('background', c)}
              className={cn('h-5 flex-1 rounded-[3px] ring-1 ring-white/10', l.background === c && 'ring-2 ring-[hsl(var(--signal))]')}
              style={{ background: c }}
              data-testid={`button-backdrop-${c.slice(1)}`}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
