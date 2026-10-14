import { useEffect, useState } from 'react';
import { Aperture, History, Download, FileJson, FolderOpen, MonitorPlay, Redo2, RotateCcw, Save, Box as BoxIcon, Image as ImageIcon, Undo2 } from 'lucide-react';
import { useStudio } from '@/studio/studio/store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/studio/components/ui/dropdown-menu';
import { IconBtn, TextBtn } from './kit';
import { SaveIndicator } from './SaveIndicator';

export function MissionMark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1.5" y="5" width="21" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 5.6 10.4 7h3.2L15 5.6M9 18.4l1.4-1.4h3.2l1.4 1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="19" y="9" width="1.4" height="6" rx=".4" fill="#ff6a2b" />
    </svg>
  );
}

interface Props {
  onRender: () => void;
  onExportGLB: () => void;
  onExportJSON: () => void;
  onImport: () => void;
  onRestore: () => void;
  onBackups: () => void;
}

export function Toolbar({ onRender, onExportGLB, onExportJSON, onImport, onRestore, onBackups }: Props) {
  const { project, updateProject, undo, redo, canUndo, canRedo, save, setPresentation } = useStudio();
  const [name, setName] = useState(project.name);
  useEffect(() => setName(project.name), [project.name]);
  const commitName = () => {
    const n = name.trim().slice(0, 80);
    if (n && n !== project.name) updateProject('project:name', (p) => ({ ...p, name: n }));
    else setName(project.name);
  };

  return (
    <header className="relative z-20 flex h-12 shrink-0 items-center gap-3 overflow-x-auto overflow-y-hidden border-b border-white/[0.06] bg-[#101113] px-3">
      <div className="flex w-[232px] items-center gap-2 text-[#ebe8e1]">
        <MissionMark />
        <span className="text-[12.5px] font-semibold tracking-[0.14em]">MISSION</span>
        <span className="text-[12.5px] font-light tracking-[0.14em] text-[#7d7a75]">STUDIO</span>
      </div>
      <div className="h-5 w-px bg-white/[0.07]" />
      <input
        value={name}
        aria-label="Project name"
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="h-7 w-[220px] rounded-[5px] border border-transparent bg-transparent px-2 text-[12.5px] tracking-[-0.01em] text-[#e9e6df] hover:border-white/[0.08] focus:border-[hsl(var(--signal))]/50 focus:bg-black/30 focus:outline-none"
        data-testid="input-project-name"
      />
      <div className="flex items-center gap-0.5">
        <IconBtn label="Undo" kbd="Ctrl Z" onClick={undo} disabled={!canUndo} testId="button-undo">
          <Undo2 className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn label="Redo" kbd="Ctrl Shift Z" onClick={redo} disabled={!canRedo} testId="button-redo">
          <Redo2 className="h-3.5 w-3.5" />
        </IconBtn>
      </div>
      <SaveIndicator />

      <div className="ml-auto flex items-center gap-1">
        <IconBtn label="Restore defaults" onClick={onRestore} testId="button-restore-defaults">
          <RotateCcw className="h-3.5 w-3.5" />
        </IconBtn>
        <TextBtn testId="button-save" onClick={() => save()} title="Save locally (Ctrl S)">
          <Save className="h-3.5 w-3.5" /> Save
        </TextBtn>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-[11.5px] font-medium text-[#b9b6b0] hover:bg-white/[0.06] hover:text-[#f3f1ec] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[hsl(var(--signal))]"
              data-testid="button-export-menu"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 border-white/[0.08] bg-[#17181b] text-[#e9e6df]">
            <DropdownMenuLabel className="label-xs">Export</DropdownMenuLabel>
            <DropdownMenuItem onSelect={onRender} data-testid="menu-export-png">
              <ImageIcon className="h-3.5 w-3.5" /> PNG render…
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onExportGLB} data-testid="menu-export-glb">
              <BoxIcon className="h-3.5 w-3.5" /> GLB geometry (.glb)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onExportJSON} data-testid="menu-export-json">
              <FileJson className="h-3.5 w-3.5" /> Project file (.json)
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem onSelect={onImport} data-testid="menu-import-json">
              <FolderOpen className="h-3.5 w-3.5" /> Import project…
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onBackups} data-testid="menu-backups">
              <History className="h-3.5 w-3.5" /> Local backups…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TextBtn testId="button-presentation" onClick={() => setPresentation(true)} title="Presentation mode">
          <MonitorPlay className="h-3.5 w-3.5" /> Present
        </TextBtn>
        <TextBtn testId="button-render" variant="solid" onClick={onRender} className="ml-1">
          <Aperture className="h-3.5 w-3.5" /> Render
        </TextBtn>
      </div>
    </header>
  );
}
