import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/studio/components/ui/dialog';
import { useStudio } from '@/studio/studio/store';
import { CONCEPTS, conceptMarks } from '@/studio/studio/marks';
import { MAX_MARKS } from '@/studio/studio/presets';
import type { MarkSide } from '@/studio/studio/types';
import { cn } from '@/studio/lib/utils';
import { ASSETS, assetUrl } from '@/studio/studio/assets';
import { Segmented, TextBtn } from '../kit';

const FAMILIES = ['All', 'Sun', 'Earth', 'Moon', 'Saturn', 'Orbit'] as const;

/** Library of original planetary Mission marks. Adding always appends new layers; nothing is replaced. */
export function ConceptLibrary({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { design, addMarks } = useStudio();
  const [family, setFamily] = useState<(typeof FAMILIES)[number]>('All');
  const [side, setSide] = useState<MarkSide>('front');
  const [added, setAdded] = useState<string | null>(null);
  const room = MAX_MARKS - design.marks.length;
  const ink = design.marks[0]?.color ?? '#f4f3ef';

  const add = (id: string, withWord: boolean) => {
    const c = CONCEPTS.find((x) => x.id === id);
    if (!c) return;
    const marks = conceptMarks(c, side, design.geometry, withWord, ink);
    if (marks.length > room) return;
    addMarks(marks);
    setAdded(`${c.name}${withWord ? ' lockup' : ''} added to the ${side}`);
  };

  const list = CONCEPTS.filter((c) => family === 'All' || c.family === family);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setAdded(null);
      }}
    >
      <DialogContent className="max-h-[88dvh] max-w-[760px] overflow-hidden border-white/[0.08] bg-[#141517] p-0 text-[#e9e6df]">
        <div className="border-b border-white/[0.06] px-5 pb-4 pt-5">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-medium tracking-[-0.01em]">Mission concept library</DialogTitle>
            <DialogDescription className="text-[12px] text-[#7d7a75]">
              Sun, Earth, Moon and Saturn are NASA images (colour processing noted on each); orbit marks are single-colour diagrams, not photographs. Each is added as a new editable layer, so your existing marks stay as they are.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="w-[360px]">
              <Segmented label="Concept family" value={family} onChange={(v) => setFamily(v as (typeof FAMILIES)[number])} options={FAMILIES.map((f) => ({ value: f, label: f }))} testId="segment-concept-family" />
            </div>
            <div className="w-[160px]">
              <Segmented
                label="Add to side"
                value={side}
                onChange={(v) => setSide(v as MarkSide)}
                options={[
                  { value: 'front', label: 'Front' },
                  { value: 'back', label: 'Back' },
                ]}
                testId="segment-concept-side"
              />
            </div>
            <span className="mono text-[10.5px] text-[#6c6a66]">{room} of {MAX_MARKS} layers free</span>
          </div>
          {added && (
            <p role="status" className="mt-2 text-[11.5px] text-[#d9b48f]" data-testid="text-concept-added">
              {added}. You can keep adding or close this panel.
            </p>
          )}
        </div>
        <ul className="studio-scroll grid max-h-[58dvh] grid-cols-1 gap-3 overflow-y-auto p-5 sm:grid-cols-2">
          {list.map((c) => (
            <li key={c.id} className="flex gap-3 rounded-[7px] border border-white/[0.07] bg-white/[0.015] p-3" data-testid={`card-concept-${c.id}`}>
              {c.asset ? (
                <div className="flex h-[92px] w-[108px] shrink-0 items-center justify-center rounded-[5px] bg-[#e9e7e1] p-1.5" title={`Photo: ${ASSETS[c.asset].credit}`}>
                  <img src={assetUrl(c.asset)} alt="" className="h-full w-full object-contain" draggable={false} />
                </div>
              ) : (
                <div
                  className={cn('flex h-[92px] w-[108px] shrink-0 items-center justify-center rounded-[5px] bg-[#e9e7e1] p-2.5', '[&>svg]:h-full [&>svg]:w-full')}
                  aria-hidden="true"
                  // trusted, bundled artwork (not user input)
                  dangerouslySetInnerHTML={{ __html: c.svg ?? '' }}
                />
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="truncate text-[12.5px] font-medium">{c.name}</h3>
                  <span className="label-xs shrink-0">{c.family}</span>
                </div>
                <p className="mt-1 text-[11px] leading-[1.45] text-[#8d8a85]">{c.idea}</p>
                {c.asset && (
                  <a href={ASSETS[c.asset].source} target="_blank" rel="noreferrer" className="mt-1 text-[10px] leading-[1.4] text-[#6c6a66] underline-offset-2 hover:underline">
                    Credit: {ASSETS[c.asset].credit}
                  </a>
                )}
                {c.asset ? (
                  <span className="mt-0.5 text-[10px] text-[#8d8a85]" data-testid={`text-concept-colour-${c.id}`}>Photo · {ASSETS[c.asset].colour}</span>
                ) : (
                  <span className="mt-0.5 text-[10px] text-[#8d8a85]">Diagram · single-colour vector, not a photograph</span>
                )}
                <div className="mt-auto flex gap-1.5 pt-2">
                  <TextBtn variant="outline" className="h-6 px-2 text-[11px]" disabled={room < 1} onClick={() => add(c.id, false)} testId={`button-add-concept-${c.id}`}>
                    <Plus className="h-3 w-3" /> Symbol
                  </TextBtn>
                  <TextBtn variant="ghost" className="h-6 px-2 text-[11px]" disabled={room < 2} onClick={() => add(c.id, true)} testId={`button-add-lockup-${c.id}`}>
                    <Plus className="h-3 w-3" /> With wordmark
                  </TextBtn>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
