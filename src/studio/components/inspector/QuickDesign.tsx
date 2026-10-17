import { markDefaults } from '@/studio/studio/presets';
import { MATERIAL_ORDER, MATERIALS, materialFromPreset, trimFor } from '@/studio/studio/presets';
import type { BrandMark, MaterialPreset } from '@/studio/studio/types';
import { useStudio } from '@/studio/studio/store';
import { cn } from '@/studio/lib/utils';
import { ColorField, Note, ParamSlider, Section, Segmented } from '../kit';

const QUICK: MaterialPreset[] = ['missionBlue', 'matteGrey', 'satinAluminium', 'matteGraphite', 'champagne', 'blackTitanium'];

const MOON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M68 12a42 42 0 1 0 0 76 32 32 0 1 1 0-76z"/></svg>`;
const DIM = '#5e5c57';
const LIT = '#f4e6c4';

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpHex(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = (i: number) => Math.max(0, Math.min(255, Math.round(A[i] + (B[i] - A[i]) * t)))
    .toString(16)
    .padStart(2, '0');
  return `#${c(0)}${c(1)}${c(2)}`;
}

function glowOf(color: string) {
  const c = hexToRgb(color);
  const a = hexToRgb(DIM);
  const b = hexToRgb(LIT);
  let denom = 0;
  let dot = 0;
  for (let i = 0; i < 3; i++) {
    const d = b[i] - a[i];
    denom += d * d;
    dot += d * (c[i] - a[i]);
  }
  return denom ? Math.max(0, Math.min(1, dot / denom)) : 0;
}

function wordmarkOf(marks: BrandMark[]) {
  return marks.find((m) => m.id === 'm-wordmark' || m.name === 'Wordmark') ?? marks.find((m) => m.kind === 'text' && m.text.trim().length > 2);
}

function initialsOf(marks: BrandMark[], wordId?: string) {
  return (
    marks.find((m) => m.id === 'm-initials' || m.name === 'Initials') ??
    marks.find((m) => m.kind === 'text' && m.id !== wordId && m.text.trim().length > 0 && m.text.trim().length <= 4)
  );
}

function earthOf(marks: BrandMark[]) {
  return marks.find((m) => m.kind === 'image' && m.asset === 'nasa-earth');
}

function moonOf(marks: BrandMark[]) {
  return marks.find((m) => m.id === 'm-moon' || m.name === 'Moon' || m.svgName === 'moon.svg');
}

export function QuickDesign() {
  const { design, updateDesign, updateMark, addMarks } = useStudio();
  const marks = design.marks;
  const word = wordmarkOf(marks);
  const initials = initialsOf(marks, word?.id);
  const earth = earthOf(marks);
  const moon = moonOf(marks);
  const finishes = MATERIAL_ORDER.filter((id) => QUICK.includes(id));

  const place = (partial: Omit<BrandMark, 'id'>) => addMarks([partial]);

  return (
    <div data-testid="panel-quick-design">
      <Section title="Finish">
        <div className="grid grid-cols-3 gap-2">
          {finishes.map((id) => {
            const p = materialFromPreset(id);
            const on = design.body.preset === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  updateDesign('quick:finish', (d) => ({
                    ...d,
                    body: materialFromPreset(id),
                    trim: trimFor(id === 'missionBlue' ? 'matteGrey' : id),
                  }))
                }
                className="flex flex-col items-center gap-1"
                data-testid={`button-quick-finish-${id}`}
              >
                <span
                  className={cn('h-9 w-full rounded-[5px] ring-1 ring-white/10', on && 'ring-2 ring-[hsl(var(--signal))] ring-offset-2 ring-offset-[#121315]')}
                  style={{ background: p.color }}
                />
                <span className="w-full truncate text-center text-[10px] text-[#8d8a85]">{MATERIALS[id].label}</span>
              </button>
            );
          })}
        </div>
        <ColorField label="Face colour" value={design.body.color} onChange={(v) => updateDesign('quick:color', (d) => ({ ...d, body: { ...d.body, color: v } }))} testId="color-quick-face" />
        <Note>Mission blue is the anodised card face. Matte grey matches the dock metal.</Note>
      </Section>
      <Section title="Wordmark">
        {word ? (
          <>
            <label className="block text-[11.5px] text-[#a9a6a0]">
              Text
              <input
                value={word.text}
                maxLength={32}
                onChange={(e) => updateMark(word.id, 'text', { text: e.target.value })}
                className="mt-1 h-8 w-full rounded-[5px] border border-white/[0.08] bg-black/30 px-2 text-[13px] text-[#f3f1ec] focus:border-[hsl(var(--signal))]/50 focus:outline-none"
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
          <button
            type="button"
            className="text-[12px] text-[#e9e6df] underline-offset-2 hover:underline"
            onClick={() => place({ ...markDefaults(), name: 'Wordmark', text: 'Mission', x: -22, y: 14, color: '#f4f3ef' })}
            data-testid="button-add-wordmark"
          >
            Add the Mission wordmark
          </button>
        )}
      </Section>
      <Section title="Moon glow">
        <ParamSlider
          label="Glow"
          value={moon ? glowOf(moon.color) : 0}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => {
            const color = lerpHex(DIM, LIT, v);
            if (moon) updateMark(moon.id, 'glow', { color, finish: 'printed' });
            else
              place({
                ...markDefaults(),
                name: 'Moon',
                kind: 'svg',
                svg: MOON_SVG,
                svgName: 'moon.svg',
                text: '',
                size: 8,
                x: 28,
                y: -12,
                color,
                finish: 'printed',
              });
          }}
          testId="slider-moon-glow"
        />
        <Note>The crescent warms from graphite to a seated glow. Photographs are not recoloured.</Note>
      </Section>
      <Section title="Placement">
        <Note>Millimetres from the face centre. Right is positive x, up is positive y.</Note>
        <PlaceRow label="Wordmark" mark={word} testId="wordmark" onAdd={() => place({ ...markDefaults(), name: 'Wordmark', text: 'Mission', x: -22, y: 14, color: '#f4f3ef' })} />
        <PlaceRow
          label="Earth"
          mark={earth}
          testId="earth"
          onAdd={() =>
            place({
              ...markDefaults(),
              name: 'Earth',
              kind: 'image',
              asset: 'nasa-earth',
              text: '',
              svg: null,
              finish: 'printed',
              size: 14,
              x: 22,
              y: 12,
            })
          }
        />
        <PlaceRow
          label="Initials"
          mark={initials}
          testId="initials"
          onAdd={() => place({ ...markDefaults(), name: 'Initials', text: 'DB', weight: 500, size: 7.2, color: '#d5d3cc', x: 26, y: -14 })}
        />
      </Section>
    </div>
  );
}

function PlaceRow({ label, mark, testId, onAdd }: { label: string; mark: BrandMark | undefined; testId: string; onAdd: () => void }) {
  const { updateMark } = useStudio();
  if (!mark) {
    return (
      <button type="button" className="block text-left text-[12px] text-[#e9e6df] underline-offset-2 hover:underline" onClick={onAdd} data-testid={`button-add-${testId}`}>
        Place {label}
      </button>
    );
  }
  return (
    <div className="space-y-1.5">
      <div className="text-[11.5px] text-[#e9e6df]">{label}</div>
      <ParamSlider label="X" value={mark.x} min={-36} max={36} step={0.5} unit="mm" digits={1} onChange={(v) => updateMark(mark.id, 'x', { x: v })} testId={`slider-${testId}-x`} />
      <ParamSlider label="Y" value={mark.y} min={-22} max={22} step={0.5} unit="mm" digits={1} onChange={(v) => updateMark(mark.id, 'y', { y: v })} testId={`slider-${testId}-y`} />
    </div>
  );
}
