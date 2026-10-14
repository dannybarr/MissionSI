import { Fragment, useEffect, useRef, useState } from 'react';
import { Box, ChevronDown, Eye, EyeOff, Lock, LockOpen, Pencil } from 'lucide-react';
import { useStudio } from '@/studio/studio/store';
import { COMPONENT_ORDER, DEFAULT_COMPONENT_NAMES } from '@/studio/studio/presets';
import type { CompId } from '@/studio/studio/types';
import { cn } from '@/studio/lib/utils';

function Row({ id }: { id: CompId }) {
  const { design, selected, select, updateDesign } = useStudio();
  const c = design.components[id];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.name);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);

  const patch = (key: string, p: Partial<typeof c>) =>
    updateDesign(`comp:${key}:${id}`, (d) => ({ ...d, components: { ...d.components, [id]: { ...d.components[id], ...p } } }));

  const commit = () => {
    setEditing(false);
    const name = draft.trim().slice(0, 60);
    if (name && name !== c.name) patch('name', { name });
    else setDraft(c.name);
  };
  const active = selected === id;

  return (
    <li
      className={cn(
        'group relative flex h-7 items-center gap-1 rounded-[5px] pl-6 pr-1 transition-colors',
        active ? 'bg-white/[0.07] text-[#f3f1ec]' : 'text-[#a9a6a0] hover:bg-white/[0.035]',
        !c.visible && 'text-[#5d5b57]',
      )}
      data-testid={`row-component-${id}`}
    >
      {active && <span className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[hsl(var(--signal))]" />}
      {editing ? (
        <input
          ref={input}
          value={draft}
          aria-label={`Rename ${c.name}`}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(c.name);
              setEditing(false);
            }
          }}
          className="h-5 min-w-0 flex-1 rounded-[3px] border border-[hsl(var(--signal))]/60 bg-black/40 px-1 text-[11.5px] text-white focus:outline-none"
          data-testid={`input-rename-${id}`}
        />
      ) : (
        <button
          type="button"
          onClick={() => select(active ? null : id)}
          onDoubleClick={() => {
            setDraft(c.name);
            setEditing(true);
          }}
          className="min-w-0 flex-1 truncate text-left text-[11.5px]"
          title={c.name !== DEFAULT_COMPONENT_NAMES[id] ? `${c.name} (${DEFAULT_COMPONENT_NAMES[id]})` : 'Double-click to rename'}
          data-testid={`button-select-${id}`}
        >
          {c.name}
        </button>
      )}
      <div className={cn('flex items-center', !active && 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100', (c.locked || !c.visible) && 'opacity-100')}>
        <button
          type="button"
          aria-label={`Rename ${c.name}`}
          onClick={() => {
            setDraft(c.name);
            setEditing(true);
          }}
          className="rounded p-1 text-[#6c6a66] hover:text-[#e9e6df]"
          data-testid={`button-rename-${id}`}
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          aria-label={c.locked ? `Unlock ${c.name}` : `Lock ${c.name}`}
          aria-pressed={c.locked}
          onClick={() => patch('locked', { locked: !c.locked })}
          className={cn('rounded p-1 hover:text-[#e9e6df]', c.locked ? 'text-[#e9e6df]' : 'text-[#6c6a66]')}
          data-testid={`button-lock-${id}`}
        >
          {c.locked ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
        </button>
        <button
          type="button"
          aria-label={c.visible ? `Hide ${c.name}` : `Show ${c.name}`}
          aria-pressed={!c.visible}
          onClick={() => patch('visible', { visible: !c.visible })}
          className="rounded p-1 text-[#6c6a66] hover:text-[#e9e6df]"
          data-testid={`button-visibility-${id}`}
        >
          {c.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      </div>
    </li>
  );
}

/** Branding marks nested under the Branding layer: select, show/hide, rename via inspector. */
function MarkChildren() {
  const { design, selectedMark, selectMark, updateMark } = useStudio();
  if (!design.marks.length) return null;
  return (
    <li>
      <ul className="space-y-px">
        {design.marks.map((m) => {
          const active = selectedMark === m.id;
          return (
            <li
              key={m.id}
              className={cn(
                'group relative flex h-6 items-center gap-1 rounded-[5px] pl-10 pr-1 transition-colors',
                active ? 'bg-white/[0.07] text-[#f3f1ec]' : 'text-[#8d8a85] hover:bg-white/[0.035]',
                (!m.visible || !design.components.logo.visible) && 'text-[#5d5b57]',
              )}
              data-testid={`row-tree-mark-${m.id}`}
            >
              {active && <span className="absolute left-[30px] top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[hsl(var(--signal))]" />}
              <button type="button" onClick={() => selectMark(active ? null : m.id)} className="min-w-0 flex-1 truncate text-left text-[11px]" data-testid={`button-tree-mark-${m.id}`}>
                {m.name}
              </button>
              <span className="mono text-[9px] text-[#5d5b57]">{m.side === 'back' ? 'B' : 'F'}</span>
              <button
                type="button"
                aria-label={m.visible ? `Hide ${m.name}` : `Show ${m.name}`}
                aria-pressed={!m.visible}
                onClick={() => updateMark(m.id, 'visible', { visible: !m.visible })}
                className={cn('rounded p-1 text-[#6c6a66] hover:text-[#e9e6df]', m.visible && !active && 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100')}
                data-testid={`button-tree-mark-visibility-${m.id}`}
              >
                {m.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

export function Hierarchy() {
  const { selected, select, variant } = useStudio();
  const [open, setOpen] = useState(true);
  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-white/[0.06] bg-[#121315]" aria-label="Layers and components">
      <div className="flex h-14 flex-col justify-center border-b border-white/[0.06] px-4">
        <div className="label-xs">Layers</div>
        <div className="truncate text-[13px] font-medium tracking-[-0.01em] text-[#f3f1ec]" data-testid="text-active-variant">
          {variant.name}
        </div>
      </div>
      <div className="studio-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div
          className={cn('flex h-7 items-center gap-1.5 rounded-[5px] px-1.5', selected === null ? 'bg-white/[0.05] text-[#f3f1ec]' : 'text-[#c9c6c0] hover:bg-white/[0.03]')}
        >
          <button type="button" aria-label={open ? 'Collapse' : 'Expand'} aria-expanded={open} onClick={() => setOpen(!open)} className="text-[#6c6a66]" data-testid="button-toggle-tree">
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !open && '-rotate-90')} />
          </button>
          <Box className="h-3.5 w-3.5 text-[#8d8a85]" />
          <button type="button" onClick={() => select(null)} className="flex-1 text-left text-[10.5px] font-semibold tracking-[0.1em]" data-testid="button-select-assembly">
            MISSION CARD
          </button>
          <span className="mono text-[10px] text-[#5d5b57]">{COMPONENT_ORDER.length}</span>
        </div>
        {open && (
          <ul className="relative mt-0.5 space-y-px before:absolute before:bottom-3 before:left-[13px] before:top-1 before:w-px before:bg-white/[0.06]">
            {COMPONENT_ORDER.map((id) => (
              <Fragment key={id}>
                <Row id={id} />
                {id === 'logo' && <MarkChildren />}
              </Fragment>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-white/[0.06] px-4 py-3 text-[10.5px] leading-relaxed text-[#6c6a66]">
        Click a layer or the model to select. Double-click to rename. Locked layers ignore edits and drags.
      </div>
    </aside>
  );
}
