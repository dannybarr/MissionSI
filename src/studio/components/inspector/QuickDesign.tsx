import type { ReactNode } from 'react';
import { Bluetooth, CircleDot, Cpu, MapPin, Mic, Nfc, Plus, Vibrate, X } from 'lucide-react';
import { MATERIAL_ORDER, MATERIALS, materialFromPreset, trimFor } from '@/studio/studio/presets';
import { earthMark, FEATURE_BY_ID, FEATURES, featureMark, featureOf, initialsMark, STATUS_DIM, STATUS_LIT, wordmarkMark } from '@/studio/studio/features';
import { indicativeTotal, type FeatureId } from '@/shared/card-features';
import type { BrandMark, MaterialPreset } from '@/studio/studio/types';
import { useStudio } from '@/studio/studio/store';
import { cn } from '@/studio/lib/utils';
import { ColorField, Note, ParamSlider, Section, Segmented } from '../kit';

const QUICK: MaterialPreset[] = ['matteGraphite', 'missionBlue', 'matteGrey', 'satinAluminium', 'blackTitanium', 'champagne'];

const ICONS: Record<FeatureId, ReactNode> = {
  nfc: <Nfc className="h-3.5 w-3.5" />,
  gps: <MapPin className="h-3.5 w-3.5" />,
  mic: <Mic className="h-3.5 w-3.5" />,
  haptics: <Vibrate className="h-3.5 w-3.5" />,
  secure: <Cpu className="h-3.5 w-3.5" />,
  bluetooth: <Bluetooth className="h-3.5 w-3.5" />,
  status: <CircleDot className="h-3.5 w-3.5" />,
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpHex(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = (i: number) =>
    Math.max(0, Math.min(255, Math.round(A[i] + (B[i] - A[i]) * t)))
      .toString(16)
      .padStart(2, '0');
  return `#${c(0)}${c(1)}${c(2)}`;
}

function glowOf(color: string) {
  const c = hexToRgb(color);
  const a = hexToRgb(STATUS_DIM);
  const b = hexToRgb(STATUS_LIT);
  let denom = 0;
  let dot = 0;
  for (let i = 0; i < 3; i++) {
    const d = b[i] - a[i];
    denom += d * d;
    dot += d * (c[i] - a[i]);
  }
  return denom ? Math.max(0, Math.min(1, dot / denom)) : 0;
}

const isText = (m: BrandMark) => m.kind === 'text' && m.text.trim().length > 0;

function wordmarkOf(marks: BrandMark[]) {
  return marks.find((m) => m.id === 'm-wordmark' && m.kind === 'text') ?? marks.find((m) => isText(m) && m.text.trim().length > 4);
}

function initialsOf(marks: BrandMark[], wordId?: string) {
  return marks.find((m) => m.id === 'm-initials' && m.kind === 'text') ?? marks.find((m) => isText(m) && m.id !== wordId && m.text.trim().length <= 4);
}

const earthOf = (marks: BrandMark[]) => marks.find((m) => m.kind === 'image' && m.asset === 'nasa-earth');

export function QuickDesign() {
  const { design, updateDesign, updateMark, addMarks, removeMark, selectMark, selectedMark } = useStudio();
  const marks = design.marks;
  const word = wordmarkOf(marks);
  const initials = initialsOf(marks, word?.id);
  const earth = earthOf(marks);
  const featureMarks = marks.flatMap((m) => {
    const id = featureOf(m);
    return id ? [{ id, mark: m }] : [];
  });
  const byFeature = new Map(featureMarks.map((f) => [f.id, f.mark]));
  const statusLight = byFeature.get('status');
  const total = indicativeTotal([...byFeature.keys()]);
  const locked = design.components.logo.locked;

  const add = (m: Omit<BrandMark, 'id'>) => addMarks([m]);

  return (
    <div data-testid="panel-quick-design">
      <Section title="Finish">
        <div className="grid grid-cols-3 gap-2.5">
          {MATERIAL_ORDER.filter((id) => QUICK.includes(id)).map((id) => {
            const p = materialFromPreset(id);
            const on = design.body.preset === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => updateDesign('quick:finish', (d) => ({ ...d, body: materialFromPreset(id), trim: trimFor(id === 'matteGraphite' ? 'blackTitanium' : id) }))}
                className="group flex flex-col items-center gap-1.5"
                data-testid={`button-quick-finish-${id}`}
              >
                <span
                  className={cn(
                    'h-10 w-full rounded-[6px] ring-1 ring-white/10 transition-transform duration-300 group-hover:-translate-y-0.5',
                    on && 'ring-2 ring-[hsl(var(--signal))] ring-offset-2 ring-offset-[#121315]',
                  )}
                  style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${p.color} 78%, white), ${p.color} 45%, color-mix(in srgb, ${p.color} 70%, black))` }}
                />
                <span className="w-full truncate text-center text-[10.5px] text-[#a9a6a0]">{MATERIALS[id].label}</span>
              </button>
            );
          })}
        </div>
        <ColorField label="Face colour" value={design.body.color} onChange={(v) => updateDesign('quick:color', (d) => ({ ...d, body: { ...d.body, color: v } }))} testId="color-quick-face" />
        <Note>Matte graphite is the card in the reference design. Mission blue and matte grey are the other brand finishes.</Note>
      </Section>

      <Section title="Wordmark">
        {word ? (
          <>
            <label className="block text-[11.5px] text-[#a9a6a0]">
              Text
              <input
                value={word.text}
                maxLength={32}
                disabled={locked || word.locked}
                onChange={(e) => updateMark(word.id, 'text', { text: e.target.value })}
                className="mt-1.5 h-9 w-full rounded-[6px] border border-white/[0.08] bg-black/30 px-2.5 text-[13px] text-[#f3f1ec] focus:border-[hsl(var(--signal))]/50 focus:outline-none"
                data-testid="input-quick-wordmark"
              />
            </label>
            <Segmented
              label="Engraving"
              value={word.finish}
              onChange={(v) => updateMark(word.id, 'finish', { finish: v as BrandMark['finish'] })}
              options={[
                { value: 'printed', label: 'Printed' },
                { value: 'engraved', label: 'Engraved' },
                { value: 'embossed', label: 'Embossed' },
              ]}
              testId="segment-quick-finish"
            />
          </>
        ) : (
          <AddLink onClick={() => add(wordmarkMark(-25, 16))} testId="button-add-wordmark">
            Add the Mission wordmark
          </AddLink>
        )}
      </Section>

      <Section title="Hardware modules">
        <Note>Concepts we’re exploring. Each one is drawn on the card where it would sit. Drag it in the viewport to move it.</Note>
        <ul className="space-y-1" data-testid="list-quick-features">
          {FEATURES.map((f) => {
            const m = byFeature.get(f.id);
            return (
              <li
                key={f.id}
                className={cn('flex items-center gap-2.5 rounded-[7px] px-2 py-2 transition-colors', m ? 'bg-white/[0.045]' : 'hover:bg-white/[0.025]', m && selectedMark === m.id && 'ring-1 ring-[hsl(var(--signal))]/50')}
              >
                <button
                  type="button"
                  disabled={!m}
                  onClick={() => m && selectMark(m.id)}
                  className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full', m ? 'bg-[#f3f1ec] text-[#141416]' : 'bg-white/[0.06] text-[#8d8a85]')}
                  aria-label={m ? `Select ${f.label}` : undefined}
                  tabIndex={m ? 0 : -1}
                >
                  {ICONS[f.id]}
                </button>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] text-[#ece9e2]">{f.label}</span>
                  <span className="block text-[10.5px] leading-snug text-[#7d7a75]">{f.benefit}</span>
                </span>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => (m ? removeMark(m.id) : add(featureMark(f.id)))}
                  aria-pressed={!!m}
                  aria-label={m ? `Remove ${f.label}` : `Add ${f.label}`}
                  className={cn(
                    'inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[11px] font-medium transition-colors disabled:opacity-40',
                    m ? 'text-[#c9c6c0] hover:bg-white/[0.06]' : 'bg-white/[0.08] text-[#f3f1ec] hover:bg-white/[0.14]',
                  )}
                  data-testid={`button-quick-feature-${f.id}`}
                >
                  {m ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  {m ? 'Remove' : 'Add'}
                </button>
              </li>
            );
          })}
        </ul>
        {total > 0 && (
          <div className="flex items-baseline justify-between rounded-[7px] border border-white/[0.07] px-3 py-2.5" data-testid="text-quick-indicative">
            <span className="text-[11px] text-[#a9a6a0]">Est. add-ons, indicative only</span>
            <span className="mono text-[12.5px] text-[#f3f1ec]">+£{total}</span>
          </div>
        )}
        <Note>Founding target £249 for the base card. Module figures are rough concept estimates, not prices or quotes.</Note>
      </Section>

      <Section title="Status light">
        {statusLight ? (
          <ParamSlider
            label="Brightness"
            value={glowOf(statusLight.color)}
            min={0}
            max={1}
            step={0.01}
            disabled={locked || statusLight.locked}
            onChange={(v) => updateMark(statusLight.id, 'glow', { color: lerpHex(STATUS_DIM, STATUS_LIT, v), finish: 'printed' })}
            testId="slider-status-light"
          />
        ) : (
          <AddLink onClick={() => add(featureMark('status'))} testId="button-add-status">
            Add the status light
          </AddLink>
        )}
        <Note>How brightly the light glows while an agent has access. It stays dark when the card is idle.</Note>
      </Section>

      <Section title="Placement">
        <Note>Millimetres from the face centre. Right and up are positive. You can also drag pieces in the viewport.</Note>
        <PlaceRow label="Wordmark" mark={word} testId="wordmark" onAdd={() => add(wordmarkMark(-25, 16))} />
        <PlaceRow label="Earth" mark={earth} testId="earth" onAdd={() => add(earthMark(28, 17))} />
        <PlaceRow label="Initials" mark={initials} testId="initials" onAdd={() => add(initialsMark(31, -14))} />
        {featureMarks.map(({ id, mark }) => (
          <PlaceRow key={mark.id} label={FEATURE_BY_ID[id].short} mark={mark} testId={id} onAdd={() => undefined} />
        ))}
      </Section>
    </div>
  );
}

function AddLink({ onClick, testId, children }: { onClick: () => void; testId: string; children: ReactNode }) {
  return (
    <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5 text-[11.5px] text-[#ece9e2] hover:bg-white/[0.12]" onClick={onClick} data-testid={testId}>
      <Plus className="h-3 w-3" /> {children}
    </button>
  );
}

function PlaceRow({ label, mark, testId, onAdd }: { label: string; mark: BrandMark | undefined; testId: string; onAdd: () => void }) {
  const { updateMark, design } = useStudio();
  if (!mark) {
    return (
      <AddLink onClick={onAdd} testId={`button-add-${testId}`}>
        Place {label}
      </AddLink>
    );
  }
  const g = design.geometry;
  const disabled = mark.locked || design.components.logo.locked;
  return (
    <div className="space-y-2 rounded-[7px] bg-white/[0.025] px-3 py-2.5">
      <div className="text-[11.5px] font-medium text-[#e9e6df]">{label}</div>
      <ParamSlider label="Across" value={mark.x} min={-g.width / 2 + 3} max={g.width / 2 - 3} step={0.5} unit="mm" digits={1} disabled={disabled} onChange={(v) => updateMark(mark.id, 'x', { x: v })} testId={`slider-${testId}-x`} />
      <ParamSlider label="Up" value={mark.y} min={-g.height / 2 + 3} max={g.height / 2 - 3} step={0.5} unit="mm" digits={1} disabled={disabled} onChange={(v) => updateMark(mark.id, 'y', { y: v })} testId={`slider-${testId}-y`} />
    </div>
  );
}
