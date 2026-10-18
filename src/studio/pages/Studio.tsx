import { BackupsDialog } from '@/studio/components/dialogs/BackupsDialog';
import { backupBeforeImport } from '@/studio/studio/storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStudio } from '@/studio/studio/store';
import { exportGLB, exportProjectJSON, nextFrames } from '@/studio/studio/export';
import { normalizeProject, ProjectImportError } from '@/studio/studio/schema';
import type { ViewPreset } from '@/studio/studio/types';
import { useToast } from '@/studio/hooks/use-toast';
import { Toolbar } from '@/studio/components/Toolbar';
import { Hierarchy } from '@/studio/components/Hierarchy';
import { Inspector } from '@/studio/components/inspector/Inspector';
import { ViewportArea } from '@/studio/components/ViewportArea';
import { Gallery } from '@/studio/components/Gallery';
import { Presentation } from '@/studio/components/Presentation';
import { RenderDialog } from '@/studio/components/dialogs/RenderDialog';
import { VariantDialog } from '@/studio/components/dialogs/VariantDialog';
import { ErrorDialog, RestoreDialog } from '@/studio/components/dialogs/ConfirmDialogs';
import { ReserveDialog } from '@/studio/components/dialogs/ReserveDialog';
import { clearTeaserPlacement, readTeaserPlacement } from '@/landing/lib/placement';

const PRESET_KEYS: Record<string, ViewPreset> = { '1': 'front', '2': 'back', '3': 'side', '4': 'top', '5': 'iso' };

export default function Studio() {
  const studio = useStudio();
  const { toast } = useToast();
  const [renderOpen, setRenderOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const [backupsOpen, setBackupsOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [presetSignal, setPresetSignal] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const requestPreset = useCallback(
    (p: ViewPreset) => {
      studio.setView({ preset: p });
      setPresetSignal((n) => n + 1);
    },
    [studio],
  );

  // boot notices
  const bootShown = useRef(false);
  useEffect(() => {
    if (bootShown.current) return;
    bootShown.current = true;
    const b = studio.bootNotice;
    if (b.kind === 'unavailable')
      toast({ title: 'Local storage unavailable', description: 'Autosave is off in this browser. Use Export > Project file to keep your work.', variant: 'destructive' });
    if (b.kind === 'corrupt')
      toast({ title: 'Saved project could not be restored', description: `${b.reason} A copy was set aside: Export menu, Local backups.`, variant: 'destructive' });
    if (b.kind === 'loaded') toast({ title: 'Project restored', description: `${b.project.name} · ${b.project.variants.length} variants` });
  }, [studio.bootNotice, toast]);

  // layout carried over from the homepage teaser: applied once as a new variant, then forgotten
  const teaserApplied = useRef(false);
  useEffect(() => {
    if (teaserApplied.current) return;
    teaserApplied.current = true;
    const url = new URL(window.location.href);
    if (url.searchParams.get('from') !== 'teaser') return;
    url.searchParams.delete('from');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    const placement = readTeaserPlacement();
    clearTeaserPlacement();
    if (!placement) return;
    studio.applyTeaser(placement);
    const n = placement.features?.length ?? 0;
    toast({ title: 'Your homepage layout is in', description: `Saved as “Landing design”${n ? ` with ${n} hardware module${n > 1 ? 's' : ''}` : ''}. The presets are unchanged.` });
  }, [studio, toast]);

  const handleSave = useCallback(() => {
    const s = studio.save();
    if (s.status === 'saved') toast({ title: 'Saved locally', description: studio.project.name });
    else if (s.status === 'unavailable') toast({ title: 'Cannot save in this browser', description: 'Local storage is blocked. Export a project file instead.', variant: 'destructive' });
    else if (s.status === 'error') toast({ title: 'Save failed', description: s.reason, variant: 'destructive' });
  }, [studio, toast]);

  const handleGLB = useCallback(async () => {
    try {
      studio.select(null);
      studio.selectMark(null);
      await nextFrames(2);
      const bytes = await exportGLB(`${studio.project.name}-${studio.variant.name}`);
      toast({ title: 'GLB exported', description: `${(bytes / 1024).toFixed(0)} KB · ${studio.variant.design.marks.filter((m) => m.visible).length} marks, back face · ${studio.view.shading === 'accurate' ? 'unlit exact-colour materials (KHR_materials_unlit)' : 'PBR materials'}` });
    } catch (e) {
      toast({ title: 'GLB export failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    }
  }, [studio, toast]);

  const handleImportFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      if (f.size > 5_000_000) throw new ProjectImportError('File is larger than 5 MB — not a Mission Studio project.');
      const text = await f.text();
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        throw new ProjectImportError('The file is not valid JSON.');
      }
      const p = normalizeProject(raw);
      backupBeforeImport(studio.project);
      studio.replaceProject(p);
      studio.select(null);
      toast({ title: 'Project imported', description: `${p.name} · ${p.variants.length} variants. Undo, or Export menu > Local backups, to revert.` });
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Unknown import error.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
        return;
      }
      if (typing || studio.presentation) return;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) studio.redo();
        else studio.undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        studio.redo();
      } else if (studio.selectedMark && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        const mk = studio.design.marks.find((m) => m.id === studio.selectedMark);
        if (mk && !mk.locked && !studio.design.components.logo.locked) {
          studio.removeMark(mk.id);
          toast({ title: `Removed "${mk.name}"`, description: 'Ctrl/Cmd+Z to undo.' });
        }
      } else if (studio.selectedMark && mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        studio.duplicateMark(studio.selectedMark);
      } else if (studio.selectedMark && !mod && e.key.startsWith('Arrow')) {
        const mk = studio.design.marks.find((m) => m.id === studio.selectedMark);
        if (!mk || mk.locked || studio.design.components.logo.locked) return;
        e.preventDefault();
        const st = e.shiftKey ? 2 : 0.5;
        const g = studio.design.geometry;
        const d = ({ ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, st], ArrowDown: [0, -st] } as Record<string, number[]>)[e.key];
        if (!d) return;
        const cl = (v: number, m: number) => Math.round(Math.max(-m, Math.min(m, v)) * 10) / 10;
        studio.updateMark(mk.id, 'nudge', { x: cl(mk.x + d[0], g.width / 2 - 3), y: cl(mk.y + d[1], g.height / 2 - 3) });
      } else if (!mod && PRESET_KEYS[e.key]) {
        requestPreset(PRESET_KEYS[e.key]);
      } else if (!mod && e.key.toLowerCase() === 'f') {
        requestPreset(studio.view.preset);
      } else if (e.key === 'Escape') {
        studio.select(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [studio, handleSave, requestPreset, toast]);

  if (studio.presentation) return <Presentation />;

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-[#101113] text-[#e9e6df]">
      <Toolbar
        onRender={() => setRenderOpen(true)}
        onExportGLB={handleGLB}
        onExportJSON={() => {
          exportProjectJSON(studio.project);
          toast({ title: 'Project file exported', description: `${studio.project.variants.length} variants` });
        }}
        onImport={() => fileRef.current?.click()}
        onRestore={() => setRestoreOpen(true)}
        onBackups={() => setBackupsOpen(true)}
        onReserve={() => setReserveOpen(true)}
      />
      <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => handleImportFile(e.target.files?.[0])} data-testid="input-import-file" />
      {/* Original three-column studio, always: narrower windows scroll horizontally instead of restyling. */}
      <div className="studio-scroll min-h-0 flex-1 overflow-x-auto overflow-y-hidden" data-testid="studio-columns">
      <div className="flex h-full min-w-[1000px]">
        <Hierarchy />
        <main className="flex min-w-0 flex-1 flex-col">
          <ViewportArea presetSignal={presetSignal} requestPreset={requestPreset} />
          <Gallery onSaveVariant={() => setVariantOpen(true)} />
        </main>
        <Inspector />
      </div>
      </div>
      <RenderDialog open={renderOpen} onOpenChange={setRenderOpen} />
      <VariantDialog open={variantOpen} onOpenChange={setVariantOpen} />
      <RestoreDialog open={restoreOpen} onOpenChange={setRestoreOpen} />
      <BackupsDialog open={backupsOpen} onOpenChange={setBackupsOpen} />
      <ReserveDialog open={reserveOpen} onOpenChange={setReserveOpen} />
      <ErrorDialog title="Import failed" message={importError} onClose={() => setImportError(null)} />
    </div>
  );
}
