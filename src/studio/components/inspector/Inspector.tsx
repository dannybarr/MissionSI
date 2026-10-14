import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, LockOpen } from 'lucide-react';
import { COMPONENT_ORDER } from '@/studio/studio/presets';
import type { CompId } from '@/studio/studio/types';
import { CAPS, resolveTab, tabsFor } from '@/studio/studio/capabilities';
import { useStudio, type InspectorTab } from '@/studio/studio/store';
import type { MaterialSlot } from '@/studio/studio/types';
import { cn } from '@/studio/lib/utils';
import { IconBtn, Note } from '../kit';
import { GeometryPanel } from './GeometryPanel';
import { MaterialPanel } from './MaterialPanel';
import { BrandingPanel } from './BrandingPanel';
import { LightingPanel } from './LightingPanel';

const TABS: { id: InspectorTab; label: string }[] = [
  { id: 'geometry', label: 'Geometry' },
  { id: 'material', label: 'Material' },
  { id: 'branding', label: 'Branding' },
  { id: 'lighting', label: 'Lighting' },
];

export function Inspector() {
  const { selected, design, tab, setTab, updateDesign, select } = useStudio();
  const [assemblySlot, setSlot] = useState<MaterialSlot>('body');
  const comp = selected ? design.components[selected] : null;
  const cap = selected ? CAPS[selected] : null;
  // component views are pinned to the mesh's real slot; assembly view may switch freely
  const slot: MaterialSlot = cap?.slot ?? assemblySlot;
  const tabs = tabsFor(selected);
  // resolved during render, so an unsupported panel never paints; store is synced after
  const active = resolveTab(selected, tab);
  useEffect(() => {
    if (active && active !== tab) setTab(active);
  }, [active, tab, setTab]);

  const toggle = (field: 'visible' | 'locked') =>
    selected &&
    updateDesign(`comp:${field}:${selected}`, (d) => ({
      ...d,
      components: { ...d.components, [selected]: { ...d.components[selected], [field]: !d.components[selected][field] } },
    }));

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-white/[0.06] bg-[#121315]" aria-label="Inspector">
      <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4">
        <div className="min-w-0">
          <div className="label-xs">{comp ? 'Component' : 'Assembly'}</div>
          <div className="truncate text-[13px] font-medium tracking-[-0.01em] text-[#f3f1ec]" data-testid="text-inspector-target">
            {comp ? comp.name : 'Mission Card'}
          </div>
        </div>
        {comp && (
          <div className="flex items-center gap-0.5">
            <IconBtn label="Back to assembly" onClick={() => select(null)} testId="button-inspector-assembly">
              <ArrowLeft className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn label={comp.visible ? 'Hide component' : 'Show component'} onClick={() => toggle('visible')} testId="button-inspector-visibility">
              {comp.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </IconBtn>
            <IconBtn label={comp.locked ? 'Unlock component' : 'Lock component'} active={comp.locked} onClick={() => toggle('locked')} testId="button-inspector-lock">
              {comp.locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
            </IconBtn>
          </div>
        )}
      </div>
      {tabs.length > 0 && (
      <div role="tablist" aria-label="Inspector sections" className="flex border-b border-white/[0.06] px-2">
        {TABS.filter((t) => tabs.includes(t.id)).map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'relative h-9 flex-1 text-[11.5px] transition-colors',
              active === t.id ? 'text-[#f3f1ec]' : 'text-[#7d7a75] hover:text-[#c9c6c0]',
            )}
            data-testid={`tab-${t.id}`}
          >
            {t.label}
            {active === t.id && <span className="absolute inset-x-3 bottom-[-1px] h-px bg-[#f3f1ec]" />}
          </button>
        ))}
      </div>
      )}
      {comp?.locked && (
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2 text-[11px] text-[#a9a6a0]" data-testid="status-locked">
          <Lock className="h-3 w-3" /> Locked. Controls are read-only.
        </div>
      )}
      <div className="studio-scroll min-h-0 flex-1 overflow-y-auto" role="tabpanel">
        {active === 'geometry' && <GeometryPanel comp={selected} />}
        {active === 'material' && <MaterialPanel slot={slot} setSlot={setSlot} comp={selected} />}
        {active === 'branding' && <BrandingPanel key={selected ?? 'assembly'} defaultSide={cap?.side} />}
        {active === 'lighting' && <LightingPanel />}
        {active === null && cap?.note && (
          <div className="space-y-2 px-4 py-4" data-testid="status-no-parameters">
            <div className="text-[11.5px] text-[#e9e6df]">No adjustable parameters</div>
            <Note>{cap.note}</Note>
          </div>
        )}
        {comp && (
          <div className="px-4 py-3 text-[10.5px] text-[#6c6a66]">
            Lighting and global settings live on the{' '}
            <button type="button" className="text-[#c9c6c0] underline-offset-2 hover:underline" onClick={() => select(null)} data-testid="link-inspector-assembly">
              assembly
            </button>
            .
          </div>
        )}
      </div>
    </aside>
  );
}
