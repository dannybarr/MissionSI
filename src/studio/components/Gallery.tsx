import { useState } from 'react';
import { ChevronDown, Columns2, Copy, Plus, Trash2, Pencil } from 'lucide-react';
import { useStudio } from '@/studio/studio/store';
import { MATERIALS } from '@/studio/studio/presets';
import type { Variant } from '@/studio/studio/types';
import { cn } from '@/studio/lib/utils';
import { CardThumb } from './CardThumb';
import { TextBtn } from './kit';

function VariantCard({ v }: { v: Variant }) {
  const { project, setActiveVariant, duplicateVariant, deleteVariant, renameVariant, setCompare } = useStudio();
  const active = v.id === project.activeVariantId;
  const [confirmDel, setConfirmDel] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(v.name);
  const commit = () => {
    setEditing(false);
    const n = draft.trim().slice(0, 60);
    if (n && n !== v.name) renameVariant(v.id, n);
    else setDraft(v.name);
  };
  return (
    <div
      className={cn(
        'group relative flex w-[188px] shrink-0 flex-col rounded-[7px] border p-2 transition-[border-color,background,transform] duration-200',
        active ? 'border-[hsl(var(--signal))]/60 bg-white/[0.04]' : 'border-white/[0.06] hover:-translate-y-0.5 hover:border-white/[0.14]',
      )}
      data-testid={`card-variant-${v.id}`}
    >
      <button type="button" onClick={() => setActiveVariant(v.id)} className="flex h-[74px] items-center justify-center rounded-[5px] bg-[#e9e8e5]" aria-label={`Open ${v.name}`} data-testid={`button-open-variant-${v.id}`}>
        <CardThumb design={v.design} width={120} />
      </button>
      <div className="mt-1.5 flex items-center gap-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            aria-label="Variant name"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            className="h-5 min-w-0 flex-1 rounded-[3px] border border-[hsl(var(--signal))]/60 bg-black/40 px-1 text-[11px] text-white focus:outline-none"
            data-testid={`input-rename-variant-${v.id}`}
          />
        ) : (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11.5px] text-[#e9e6df]">{v.name}</div>
            <div className="truncate text-[10px] text-[#6c6a66]">{MATERIALS[v.design.body.preset].label}</div>
          </div>
        )}
      </div>
      <div className="absolute right-2 top-2 flex gap-0.5 rounded-[5px] bg-[#101113]/85 p-0.5 opacity-0 backdrop-blur transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <button type="button" aria-label="Rename variant" onClick={() => setEditing(true)} className="rounded p-1 text-[#a9a6a0] hover:text-white" data-testid={`button-rename-variant-${v.id}`}>
          <Pencil className="h-3 w-3" />
        </button>
        <button type="button" aria-label="Duplicate variant" onClick={() => duplicateVariant(v.id)} className="rounded p-1 text-[#a9a6a0] hover:text-white" data-testid={`button-duplicate-variant-${v.id}`}>
          <Copy className="h-3 w-3" />
        </button>
        <button
          type="button"
          aria-label="Compare with active variant"
          onClick={() => setCompare({ on: true, a: project.activeVariantId, b: v.id })}
          className="rounded p-1 text-[#a9a6a0] hover:text-white"
          data-testid={`button-compare-variant-${v.id}`}
        >
          <Columns2 className="h-3 w-3" />
        </button>
        {project.variants.length > 1 &&
          (confirmDel ? (
            <button
              type="button"
              onClick={() => deleteVariant(v.id)}
              onBlur={() => setConfirmDel(false)}
              className="rounded px-1 text-[10px] text-[#f08b7c] hover:bg-[#e2523f]/15"
              data-testid={`button-confirm-delete-variant-${v.id}`}
            >
              Delete?
            </button>
          ) : (
            <button type="button" aria-label="Delete variant" onClick={() => setConfirmDel(true)} className="rounded p-1 text-[#a9a6a0] hover:text-[#f08b7c]" data-testid={`button-delete-variant-${v.id}`}>
              <Trash2 className="h-3 w-3" />
            </button>
          ))}
      </div>
    </div>
  );
}

export function Gallery({ onSaveVariant }: { onSaveVariant: () => void }) {
  const { project, galleryOpen, setGalleryOpen, duplicateVariant } = useStudio();
  return (
    <div className="shrink-0 border-t border-white/[0.06] bg-[#121315]">
      <div className="flex h-9 items-center gap-2 px-3">
        <button
          type="button"
          onClick={() => setGalleryOpen(!galleryOpen)}
          aria-expanded={galleryOpen}
          className="label-xs flex items-center gap-1.5 hover:text-[#d8d5cf]"
          data-testid="button-toggle-gallery"
        >
          <ChevronDown className={cn('h-3 w-3 transition-transform', !galleryOpen && '-rotate-90')} />
          Concept gallery
          <span className="mono normal-case tracking-normal text-[#5d5b57]">{project.variants.length}</span>
        </button>
        <div className="ml-auto flex items-center gap-1">
          <TextBtn testId="button-duplicate-active" className="h-6 text-[11px]" onClick={() => duplicateVariant(project.activeVariantId)}>
            <Copy className="h-3 w-3" /> Duplicate
          </TextBtn>
          <TextBtn testId="button-save-variant" variant="outline" className="h-6 text-[11px]" onClick={onSaveVariant}>
            <Plus className="h-3 w-3" /> Save variant
          </TextBtn>
        </div>
      </div>
      {galleryOpen && (
        <div className="studio-scroll flex gap-2 overflow-x-auto px-3 pb-3">
          {project.variants.map((v) => (
            <VariantCard key={v.id} v={v} />
          ))}
        </div>
      )}
    </div>
  );
}
