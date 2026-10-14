import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Image as ImageIcon, Library, Lock, LockOpen, Trash2, Type, Upload } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/studio/components/ui/alert-dialog';
import { useStudio } from '@/studio/studio/store';
import { MAX_MARKS } from '@/studio/studio/presets';
import { FONT_ORDER, FONTS, nearestWeight } from '@/studio/studio/fonts';
import { newSvgMark, newTextMark, photoMarkFrom, PLACEMENTS, placementFor } from '@/studio/studio/marks';
import { ASSETS, assetUrl, photoReplacementFor } from '@/studio/studio/assets';
import { sanitizeSvg, SvgError } from '@/studio/studio/svg';
import type { BrandMark, FontId, MarkSide } from '@/studio/studio/types';
import { cn } from '@/studio/lib/utils';
import { ColorField, IconBtn, Note, ParamSlider, Section, Segmented, SelectField, TextBtn } from '../kit';
import { PlacementPad } from './PlacementPad';
import { ConceptLibrary } from '../dialogs/ConceptLibrary';

const WEIGHT_NAMES: Record<number, string> = { 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold' };

function MarkRow({ m, index, count }: { m: BrandMark; index: number; count: number }) {
  const { selectedMark, selectMark, updateMark, moveMark } = useStudio();
  const active = selectedMark === m.id;
  return (
    <li
      className={cn(
        'group flex h-8 items-center gap-1.5 rounded-[5px] pl-2 pr-0.5 transition-colors',
        active ? 'bg-white/[0.07] text-[#f3f1ec] shadow-[inset_2px_0_0_hsl(var(--signal))]' : 'text-[#a9a6a0] hover:bg-white/[0.035]',
        !m.visible && 'text-[#5d5b57]',
      )}
      data-testid={`row-mark-${m.id}`}
    >
      {m.kind === 'text' ? <Type className="h-3.5 w-3.5 shrink-0 opacity-70" /> : <ImageIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />}
      <button type="button" onClick={() => selectMark(active ? null : m.id)} className="min-w-0 flex-1 truncate text-left text-[11.5px]" data-testid={`button-select-mark-${m.id}`}>
        {m.name}
      </button>
      <span className={cn('mono rounded-[3px] px-1 text-[9.5px]', m.side === 'back' ? 'bg-[#d9b48f]/15 text-[#d9b48f]' : 'bg-white/[0.06] text-[#8d8a85]')}>{m.side === 'back' ? 'BACK' : 'FRONT'}</span>
      <div className={cn('flex items-center', !active && 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100', (m.locked || !m.visible) && 'opacity-100')}>
        <button type="button" aria-label={`Move ${m.name} up`} disabled={index === 0} onClick={() => moveMark(m.id, -1)} className="rounded p-1 text-[#6c6a66] hover:text-[#e9e6df] disabled:opacity-25" data-testid={`button-mark-up-${m.id}`}>
          <ArrowUp className="h-3 w-3" />
        </button>
        <button type="button" aria-label={`Move ${m.name} down`} disabled={index === count - 1} onClick={() => moveMark(m.id, 1)} className="rounded p-1 text-[#6c6a66] hover:text-[#e9e6df] disabled:opacity-25" data-testid={`button-mark-down-${m.id}`}>
          <ArrowDown className="h-3 w-3" />
        </button>
        <button type="button" aria-label={m.locked ? `Unlock ${m.name}` : `Lock ${m.name}`} aria-pressed={m.locked} onClick={() => updateMark(m.id, 'locked', { locked: !m.locked })} className={cn('rounded p-1 hover:text-[#e9e6df]', m.locked ? 'text-[#e9e6df]' : 'text-[#6c6a66]')} data-testid={`button-mark-lock-${m.id}`}>
          {m.locked ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
        </button>
        <button type="button" aria-label={m.visible ? `Hide ${m.name}` : `Show ${m.name}`} aria-pressed={!m.visible} onClick={() => updateMark(m.id, 'visible', { visible: !m.visible })} className="rounded p-1 text-[#6c6a66] hover:text-[#e9e6df]" data-testid={`button-mark-visibility-${m.id}`}>
          {m.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      </div>
    </li>
  );
}

export function BrandingPanel({ defaultSide }: { defaultSide?: MarkSide } = {}) {
  const { design, selectedMark, addMarks, updateMark, removeMark, duplicateMark } = useStudio();
  const groupLocked = design.components.logo.locked;
  const marks = design.marks;
  const m = marks.find((x) => x.id === selectedMark) ?? null;
  const locked = groupLocked || !!m?.locked;
  const full = marks.length >= MAX_MARKS;
  const newFileRef = useRef<HTMLInputElement>(null);
  const replaceFileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addSide, setAddSide] = useState<MarkSide>(defaultSide ?? 'front');

  const set = (patch: Partial<BrandMark>, key = Object.keys(patch)[0]) => m && updateMark(m.id, key, patch);

  const readSvg = async (f: File | undefined, input: HTMLInputElement | null): Promise<string | null> => {
    if (!f) return null;
    setError(null);
    try {
      if (!/svg/i.test(f.type) && !f.name.toLowerCase().endsWith('.svg')) throw new SvgError('Please choose an .svg file.');
      return sanitizeSvg(await f.text());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read SVG.');
      return null;
    } finally {
      if (input) input.value = '';
    }
  };

  return (
    <>
      <Section title="Marks" aside={<span className="mono text-[10px] text-[#5d5b57]">{marks.length}/{MAX_MARKS}</span>}>
        {groupLocked && <Note>The Branding layer is locked in the hierarchy. Unlock it to edit marks.</Note>}
        {marks.length === 0 ? (
          <div className="rounded-[6px] border border-dashed border-white/[0.1] px-3 py-4 text-center" data-testid="status-no-marks">
            <div className="text-[12px] text-[#c9c6c0]">No branding on this variant</div>
            <div className="mt-0.5 text-[10.5px] text-[#6c6a66]">Add a wordmark, upload SVG artwork or pick a planetary concept.</div>
          </div>
        ) : (
          <ul className="space-y-px" aria-label="Branding marks">
            {marks.map((x, i) => (
              <MarkRow key={x.id} m={x} index={i} count={marks.length} />
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#7d7a75]">Add to</span>
          <div className="flex-1">
            <Segmented
              label="Side for new marks"
              value={addSide}
              onChange={(v) => setAddSide(v as MarkSide)}
              options={[
                { value: 'front', label: 'Front' },
                { value: 'back', label: 'Back' },
              ]}
              testId="segment-add-side"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <TextBtn variant="outline" className="px-1.5" disabled={full || groupLocked} onClick={() => addMarks([newTextMark(addSide, design.geometry, marks.filter((x) => x.kind === 'text').length)])} testId="button-add-wordmark">
            <Type className="h-3.5 w-3.5" /> Text
          </TextBtn>
          <TextBtn variant="outline" className="px-1.5" disabled={full || groupLocked} onClick={() => newFileRef.current?.click()} testId="button-add-svg">
            <Upload className="h-3.5 w-3.5" /> SVG
          </TextBtn>
          <TextBtn variant="outline" className="px-1.5" disabled={full || groupLocked} onClick={() => setLibraryOpen(true)} testId="button-open-concepts">
            <Library className="h-3.5 w-3.5" /> Concepts
          </TextBtn>
        </div>
        <input
          ref={newFileRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            const clean = await readSvg(f, newFileRef.current);
            if (clean && f) addMarks([newSvgMark(clean, f.name, addSide, design.geometry)]);
          }}
          data-testid="input-svg-file"
        />
        {error && (
          <p role="alert" className="text-[11px] text-[#f08b7c]" data-testid="text-svg-error">
            {error}
          </p>
        )}
        {full && <Note>Layer limit reached ({MAX_MARKS}). Delete a mark to add another.</Note>}
      </Section>

      {m ? (
        <>
          <Section
            title="Selected mark"
            aside={
              <div className="flex items-center">
                <IconBtn label="Duplicate mark" onClick={() => duplicateMark(m.id)} disabled={full || groupLocked} testId="button-duplicate-mark">
                  <Copy className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label="Delete mark" onClick={() => setConfirmDelete(true)} disabled={locked} testId="button-delete-mark">
                  <Trash2 className="h-3.5 w-3.5" />
                </IconBtn>
              </div>
            }
          >
            <label className="block">
              <span className="text-[11.5px] text-[#a9a6a0]">Layer name</span>
              <input
                value={m.name}
                maxLength={60}
                disabled={groupLocked}
                onChange={(e) => set({ name: e.target.value })}
                onBlur={(e) => !e.target.value.trim() && set({ name: m.kind === 'text' ? 'Wordmark' : 'Logo' })}
                className="mt-1 h-7 w-full rounded-[5px] border border-white/[0.08] bg-black/20 px-2 text-[12px] text-[#f3f1ec] focus:border-[hsl(var(--signal))]/60 focus:outline-none disabled:opacity-40"
                data-testid="input-mark-name"
              />
            </label>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11.5px] text-[#a9a6a0]">Face</span>
              <div className="w-[170px]">
                <Segmented
                  label="Mark face"
                  value={m.side}
                  disabled={locked}
                  onChange={(v) => set({ side: v as MarkSide })}
                  options={[
                    { value: 'front', label: 'Front' },
                    { value: 'back', label: 'Back' },
                  ]}
                  testId="segment-mark-side"
                />
              </div>
            </div>

            {m.kind === 'text' ? (
              <>
                <label className="block">
                  <span className="text-[11.5px] text-[#a9a6a0]">Text</span>
                  <input
                    value={m.text}
                    maxLength={40}
                    disabled={locked}
                    onChange={(e) => set({ text: e.target.value })}
                    className="mt-1 h-8 w-full rounded-[5px] border border-white/[0.08] bg-black/20 px-2 text-[14px] text-[#f3f1ec] focus:border-[hsl(var(--signal))]/60 focus:outline-none disabled:opacity-40"
                    style={{ fontFamily: `"${FONTS[m.font].family}", ${FONTS[m.font].fallback}`, fontWeight: nearestWeight(m.font, m.weight) }}
                    data-testid="input-mark-text"
                  />
                </label>
                <SelectField
                  label="Typeface"
                  value={m.font}
                  disabled={locked}
                  onChange={(v: FontId) => set({ font: v, weight: nearestWeight(v, m.weight) }, 'font')}
                  options={FONT_ORDER.map((f) => ({ value: f, label: FONTS[f].label }))}
                  testId="select-mark-font"
                />
                <div className="text-right text-[10px] text-[#6c6a66]">{FONTS[m.font].note}</div>
                <SelectField
                  label="Weight"
                  value={String(nearestWeight(m.font, m.weight))}
                  disabled={locked || FONTS[m.font].weights.length < 2}
                  onChange={(v) => set({ weight: Number(v) })}
                  options={FONTS[m.font].weights.map((w) => ({ value: String(w), label: `${WEIGHT_NAMES[w] ?? w} ${w}` }))}
                  testId="select-mark-weight"
                />
                <ParamSlider label="Tracking" value={m.tracking} min={-8} max={36} step={0.5} unit="%" disabled={locked} onChange={(v) => set({ tracking: v })} testId="slider-tracking" />
              </>
            ) : m.kind === 'image' && m.asset ? (
              <div className="space-y-2" data-testid="panel-photo-mark">
                <div className="flex items-center gap-2 rounded-[5px] border border-white/[0.08] bg-black/20 p-2">
                  <img src={assetUrl(m.asset)} alt="" className="h-10 w-12 shrink-0 object-contain" draggable={false} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11.5px] text-[#e9e6df]" data-testid="text-photo-name">{ASSETS[m.asset].name} · NASA image</div>
                    <div className="text-[10px] text-[#6c6a66]">{ASSETS[m.asset].colour} · transparent cut-out</div>
                  </div>
                </div>
                <Note>
                  Credit:{' '}
                  <a href={ASSETS[m.asset].source} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[#e9e6df]">
                    {ASSETS[m.asset].credit}
                  </a>
                  . NASA imagery is generally not copyrighted; NASA does not endorse this design.
                </Note>
              </div>
            ) : (
              <div className="space-y-2">
                {photoReplacementFor(m.svgName) && (
                  <div className="flex items-start justify-between gap-2 rounded-[4px] border border-[hsl(var(--signal))]/25 bg-[hsl(var(--signal))]/[0.06] px-2 py-1.5" data-testid="status-photo-upgrade">
                    <p className="text-[10.5px] leading-[1.45] text-[#c9c6c0]">This is the earlier vector {ASSETS[photoReplacementFor(m.svgName)!].name}. A real NASA photograph is available.</p>
                    <TextBtn
                      variant="outline"
                      className="h-6 shrink-0 px-2 text-[10.5px]"
                      disabled={locked}
                      onClick={() => set(photoMarkFrom(m, photoReplacementFor(m.svgName)!), 'photo')}
                      testId="button-replace-with-photo"
                    >
                      Use photo
                    </TextBtn>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-[5px] border border-white/[0.08] bg-black/20 p-2">
                  {m.svg && (
                    <div
                      className="h-10 w-12 shrink-0 rounded-[3px] bg-[#e9e6df] p-1 [&>svg]:h-full [&>svg]:w-full"
                      // sanitised on upload and again on every load/import (schema.normalizeMarks)
                      dangerouslySetInnerHTML={{ __html: m.svg }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11.5px] text-[#e9e6df]" data-testid="text-svg-name">{m.svgName ?? 'artwork.svg'}</div>
                    <div className="text-[10px] text-[#6c6a66]">Sanitised · {((m.svg?.length ?? 0) / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <input
                  ref={replaceFileRef}
                  type="file"
                  accept=".svg,image/svg+xml"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    const clean = await readSvg(f, replaceFileRef.current);
                    if (clean && f) set({ svg: clean, svgName: f.name }, 'svg');
                  }}
                  data-testid="input-replace-svg"
                />
                <TextBtn variant="outline" className="w-full" disabled={locked} onClick={() => replaceFileRef.current?.click()} testId="button-replace-svg">
                  <Upload className="h-3.5 w-3.5" /> Replace artwork
                </TextBtn>
                <Note>Scripts, event handlers, external links and embedded images are stripped. Artwork is applied as a single fabrication colour.</Note>
              </div>
            )}
          </Section>

          {m.kind === 'image' ? (
            <Section title="Finish">
              <Note>Photographic marks print in full natural colour (no ink tint, laser or emboss). In Studio shading they take a satin printed-ink response.</Note>
            </Section>
          ) : (
          <Section title="Finish">
            <Segmented
              label="Mark finish"
              value={m.finish}
              disabled={locked}
              onChange={(v) => set({ finish: v as BrandMark['finish'] })}
              options={[
                { value: 'printed', label: 'Printed' },
                { value: 'engraved', label: 'Laser' },
                { value: 'embossed', label: 'Embossed' },
              ]}
              testId="segment-mark-finish"
            />
            {m.finish === 'engraved' && (
              <>
                <SelectField
                  label="Laser finish"
                  value={m.laser}
                  disabled={locked}
                  onChange={(v) => set({ laser: v as BrandMark['laser'] })}
                  options={[
                    { value: 'frost', label: 'Frosted ablation' },
                    { value: 'anneal', label: 'Black anneal' },
                    { value: 'polish', label: 'Polished mark' },
                  ]}
                  testId="select-laser-finish"
                />
                <Note>Laser marking is a visual effect only: tone and roughness change on the surface; no material is cut from the geometry. Its colour follows the body colour.</Note>
              </>
            )}
            {m.finish === 'embossed' && (
              <>
                <ParamSlider label="Emboss height" value={m.depth} min={0} max={0.5} step={0.01} unit="mm" disabled={locked} onChange={(v) => set({ depth: v })} testId="slider-emboss-depth" />
                <Note>Emboss is real raised relief geometry and is included in GLB export. Debossing is not supported.</Note>
              </>
            )}
            {m.finish !== 'engraved' && <ColorField label="Mark colour" value={m.color} disabled={locked} onChange={(v) => set({ color: v })} testId="color-mark" />}
          </Section>
          )}

          <Section title="Placement">
            <PlacementPad mark={m} disabled={locked} />
            <div className="grid grid-cols-3 gap-1" role="group" aria-label={`Placement presets on the ${m.side}`}>
              {PLACEMENTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={locked}
                  onClick={() => set(placementFor(m, design.geometry, p.id), 'place')}
                  className="h-6 rounded-[4px] border border-white/[0.07] text-[10.5px] text-[#a9a6a0] hover:border-white/[0.16] hover:text-[#e9e6df] disabled:opacity-40"
                  data-testid={`button-place-${p.id}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <ParamSlider label="Size" value={m.size} min={1} max={40} step={0.1} unit="mm" disabled={locked} onChange={(v) => set({ size: v })} testId="slider-mark-size" />
            <div className="flex gap-1.5">
              <TextBtn testId="button-mark-centre-x" className="h-6 flex-1 text-[10.5px]" disabled={locked} onClick={() => set({ x: 0 }, 'align')}>
                Centre horizontally
              </TextBtn>
              <TextBtn testId="button-mark-centre-y" className="h-6 flex-1 text-[10.5px]" disabled={locked} onClick={() => set({ y: 0 }, 'align')}>
                Centre vertically
              </TextBtn>
            </div>
            <ParamSlider label="Position X" value={m.x} min={-design.geometry.width / 2 + 3} max={design.geometry.width / 2 - 3} step={0.1} unit="mm" disabled={locked} onChange={(v) => set({ x: v })} testId="slider-mark-x" />
            <ParamSlider label="Position Y" value={m.y} min={-design.geometry.height / 2 + 3} max={design.geometry.height / 2 - 3} step={0.1} unit="mm" disabled={locked} onChange={(v) => set({ y: v })} testId="slider-mark-y" />
            <ParamSlider label="Rotation" value={m.rotation} min={-180} max={180} step={0.5} unit="deg" disabled={locked} onChange={(v) => set({ rotation: v })} testId="slider-mark-rotation" />
            {m.side === 'back' && <Note>Back coordinates are as seen with the card turned over: +X is to your right when looking at the back.</Note>}
          </Section>
        </>
      ) : (
        marks.length > 0 && (
          <div className="px-4 py-5 text-[11.5px] text-[#7d7a75]" data-testid="status-no-mark-selected">
            Select a mark in the list, the hierarchy or the viewport to edit it.
          </div>
        )
      )}

      <ConceptLibrary open={libraryOpen} onOpenChange={setLibraryOpen} />
      <AlertDialog open={confirmDelete && !!m} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="max-w-[420px] border-white/[0.08] bg-[#141517] text-[#e9e6df]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px] font-medium">Delete "{m?.name}"?</AlertDialogTitle>
            <AlertDialogDescription className="text-[12px] text-[#8d8a85]">Removes this mark from the active variant. Other marks are untouched, and you can undo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-7 border-white/[0.09] bg-transparent text-[11.5px] text-[#d7d4ce] hover:bg-white/5" data-testid="button-cancel-delete-mark">
              Cancel
            </AlertDialogCancel>
            <TextBtn
              variant="danger"
              testId="button-confirm-delete-mark"
              onClick={() => {
                if (m) removeMark(m.id);
                setConfirmDelete(false);
              }}
            >
              Delete
            </TextBtn>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
