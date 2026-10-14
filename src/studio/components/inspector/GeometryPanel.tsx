import { Eye, EyeOff, Lock } from 'lucide-react';
import { maxRecessFor, MIN_THICKNESS, USBC, USBC_MIN_WALL } from '@/studio/three/outline';
import { useStudio } from '@/studio/studio/store';
import { COMPONENT_ORDER, DEFAULT_GEOMETRY } from '@/studio/studio/presets';
import type { CompId, GeometryParams } from '@/studio/studio/types';
import { CAPS } from '@/studio/studio/capabilities';
import { Note, ParamSlider, Section, Segmented, TextBtn } from '../kit';

type NumKey = { [K in keyof GeometryParams]: GeometryParams[K] extends number ? K : never }[keyof GeometryParams];

interface Ctl {
  key: NumKey;
  label: string;
  min: number;
  max: number;
  step: number;
  owner: CompId[];
}

const DIMENSIONS: Ctl[] = [
  { key: 'width', label: 'Width', min: 50, max: 130, step: 0.1, owner: ['chassis'] },
  { key: 'height', label: 'Height', min: 30, max: 90, step: 0.1, owner: ['chassis'] },
  { key: 'thickness', label: 'Thickness', min: MIN_THICKNESS, max: 8, step: 0.05, owner: ['chassis'] },
  { key: 'cornerRadius', label: 'Corner radius', min: 0.8, max: 12, step: 0.1, owner: ['chassis'] },
];
const PERIMETER: Ctl[] = [
  { key: 'border', label: 'Border thickness', min: 0.5, max: 3.5, step: 0.05, owner: ['perimeter'] },
  { key: 'trim', label: 'Inner trim step', min: 0.25, max: 2.5, step: 0.05, owner: ['chamfer'] },
  { key: 'chamfer', label: 'Chamfer radius', min: 0.08, max: 1.1, step: 0.01, owner: ['chamfer', 'chassis'] },
];
const FACE: Ctl[] = [
  { key: 'recessDepth', label: 'Recess depth', min: 0.1, max: 1.4, step: 0.01, owner: ['recess', 'face'] },
  { key: 'faceMargin', label: 'Face margin', min: 0.15, max: 1.8, step: 0.01, owner: ['face'] },
];
const CONTOURS: Ctl[] = [
  { key: 'contourDepth', label: 'Contour depth', min: 0, max: 3.5, step: 0.05, owner: ['topContour', 'bottomContour'] },
  { key: 'contourLength', label: 'Contour half-length', min: 3, max: 26, step: 0.1, owner: ['topContour', 'bottomContour'] },
  { key: 'contourOffset', label: 'Contour offset X', min: -20, max: 20, step: 0.1, owner: ['topContour', 'bottomContour'] },
  { key: 'sideDepth', label: 'Side cut depth', min: 0, max: 3.5, step: 0.05, owner: ['sideContours'] },
  { key: 'sideLength', label: 'Side cut half-length', min: 2, max: 20, step: 0.1, owner: ['sideContours'] },
];

const ALL_CTLS: Ctl[] = [...DIMENSIONS, ...PERIMETER, ...FACE, ...CONTOURS];

export function GeometryPanel({ comp }: { comp?: CompId | null }) {
  const { design, updateDesign } = useStudio();
  const g = design.geometry;
  const C = design.components;
  const scoped = comp ? CAPS[comp] : null;
  // component view: the selected component's own lock governs everything shown
  const locked = (owners: CompId[]) => (comp ? C[comp].locked : owners.every((o) => C[o].locked));

  const set = (key: keyof GeometryParams, v: GeometryParams[keyof GeometryParams]) =>
    updateDesign(`geo:${key}`, (d) => {
      const next = { ...d.geometry, [key]: v };
      // a thinner card shrinks the allowed recess so the USB-C opening stays hidden under both faces
      if (key === 'thickness') next.recessDepth = Math.min(next.recessDepth, maxRecessFor(next.thickness));
      return { ...d, geometry: next };
    });

  const render = (list: Ctl[]) =>
    list.map((c) => (
      <ParamSlider
        key={c.key}
        label={c.label}
        value={g[c.key]}
        min={c.min}
        max={c.key === 'recessDepth' ? Math.min(c.max, +maxRecessFor(g.thickness).toFixed(2)) : c.max}
        step={c.step}
        unit="mm"
        disabled={locked(c.owner)}
        onChange={(v) => set(c.key, v)}
        testId={`slider-${c.key}`}
      />
    ));

  const profileRow = (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11.5px] text-[#a9a6a0]">Edge profile</span>
      <div className="w-[150px]">
        <Segmented
          label="Edge profile"
          value={g.chamferProfile}
          disabled={locked(['chamfer'])}
          options={[
            { value: 'rounded', label: 'Rounded' },
            { value: 'chamfer', label: 'Chamfer' },
          ]}
          onChange={(v) => set('chamferProfile', v)}
          testId="segment-edge-profile"
        />
      </div>
    </div>
  );

  if (comp && scoped) {
    const ctls = scoped.geo.map((k) => ALL_CTLS.find((c) => c.key === k)).filter((c): c is Ctl => !!c);
    const isLocked = C[comp].locked;
    const resetScoped = () =>
      updateDesign(`geo:reset:${comp}`, (d) => {
        const next = { ...d.geometry };
        for (const c of ctls) (next as Record<string, unknown>)[c.key] = DEFAULT_GEOMETRY[c.key];
        if (scoped.profile) next.chamferProfile = DEFAULT_GEOMETRY.chamferProfile;
        return { ...d, geometry: next };
      });
    return (
      <Section
        title="Shape"
        aside={
          <TextBtn testId="button-reset-geometry" className="h-5 px-1.5 text-[10.5px]" disabled={isLocked} onClick={resetScoped}>
            Reset
          </TextBtn>
        }
      >
        {render(ctls)}
        {scoped.profile && profileRow}
        {(scoped.geo.includes('thickness') || scoped.geo.includes('recessDepth')) && (
          <Note>
            Thickness is at least {MIN_THICKNESS} mm and recess at most {maxRecessFor(g.thickness).toFixed(2)} mm here, so the {USBC.h} mm USB-C opening fits
            under both recessed faces with {USBC_MIN_WALL} mm of wall. Width and height are unchanged.
          </Note>
        )}
        {scoped.geo.includes('chamfer') && comp !== 'chamfer' && <Note>Chamfer radius and edge profile are shared by the chassis, perimeter and chamfered edges.</Note>}
        {scoped.note && <Note>{scoped.note}</Note>}
      </Section>
    );
  }

  return (
    <>
      <Section
        title="Dimensions"
        aside={
          <TextBtn testId="button-reset-geometry" className="h-5 px-1.5 text-[10.5px]" onClick={() => updateDesign('geo:reset', (d) => ({ ...d, geometry: { ...DEFAULT_GEOMETRY } }))}>
            Reset
          </TextBtn>
        }
      >
        {render(DIMENSIONS)}
      </Section>
      <Section title="Perimeter & edges">
        {render(PERIMETER)}
        {profileRow}
      </Section>
      <Section title="Recessed face">{render(FACE)}</Section>
      <Section title="Sculpted contours">
        {render(CONTOURS)}
        <Note>Contours are real silhouette geometry. Hiding a contour layer flattens that edge of every ring.</Note>
      </Section>
      <Section title="USB-C port">
        <Note>
          Female USB-C socket centred on the right edge and on the card thickness: capsule opening about 8.4 x 2.6 mm, {USBC.depth} mm deep, with a
          centre tongue and 12 contacts per side. Fixed size. Minimum card thickness is {MIN_THICKNESS} mm (was 3.4) so the opening sits inside the card under both
          recessed faces, invisible face-on. Concept geometry, not a certified USB-IF mechanical drawing.
        </Note>
      </Section>
      <Section title="Component visibility" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-0.5">
          {COMPONENT_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() =>
                updateDesign(`vis:${id}`, (d) => ({ ...d, components: { ...d.components, [id]: { ...d.components[id], visible: !d.components[id].visible } } }))
              }
              className="flex h-6 items-center justify-between rounded-[4px] px-1.5 text-left text-[11.5px] text-[#a9a6a0] hover:bg-white/[0.04]"
              data-testid={`toggle-visibility-panel-${id}`}
            >
              <span className={C[id].visible ? '' : 'text-[#5d5b57] line-through'}>{C[id].name}</span>
              <span className="flex items-center gap-1.5 text-[#6c6a66]">
                {C[id].locked && <Lock className="h-3 w-3" />}
                {C[id].visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </span>
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}
