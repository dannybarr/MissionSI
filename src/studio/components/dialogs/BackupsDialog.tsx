import { useEffect, useState } from 'react';
import { Download, RotateCcw, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/studio/components/ui/dialog';
import { useStudio } from '@/studio/studio/store';
import { deleteBackup, listBackups, storageStatus, type BackupEntry } from '@/studio/studio/storage';
import { downloadBlob } from '@/studio/studio/export';
import { useToast } from '@/studio/hooks/use-toast';
import { Note, TextBtn } from '../kit';

const fmt = (t: number | null) => (t ? new Date(t).toLocaleString() : 'unknown time');

export function BackupsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { replaceProject, select } = useStudio();
  const { toast } = useToast();
  const [items, setItems] = useState<BackupEntry[]>([]);
  const [confirm, setConfirm] = useState<string | null>(null);
  const refresh = () => setItems(listBackups());
  useEffect(() => {
    if (open) {
      refresh();
      setConfirm(null);
    }
  }, [open]);

  const restore = (b: BackupEntry) => {
    if (!b.project) return;
    replaceProject(b.project);
    select(null);
    onOpenChange(false);
    toast({ title: 'Backup restored', description: `${b.project.name} · ${b.project.variants.length} variants. Undo to revert.` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] border-white/[0.08] bg-[#141517] text-[#e9e6df]" data-testid="dialog-backups">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-medium">Local backups</DialogTitle>
          <DialogDescription className="text-[12px] text-[#8d8a85]">
            Copies kept in this browser: the project as it was before your last import, and any saved project that failed to load. Restoring is undoable.
          </DialogDescription>
        </DialogHeader>
        {storageStatus() !== 'available' ? (
          <Note>Browser storage is unavailable, so no backups can exist here. Use Export, Project file to keep your work.</Note>
        ) : items.length === 0 ? (
          <div className="rounded-[6px] border border-dashed border-white/[0.08] px-4 py-6 text-center text-[11.5px] text-[#7d7a75]" data-testid="status-no-backups">
            No backups yet. One is created automatically before every import.
          </div>
        ) : (
          <ul className="max-h-[50dvh] space-y-1.5 overflow-y-auto" aria-label="Backups">
            {items.map((b) => (
              <li key={b.key} className="rounded-[6px] border border-white/[0.07] px-3 py-2" data-testid={`row-backup-${b.kind}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] text-[#f3f1ec]">{b.kind === 'pre-import' ? 'Before last import' : 'Unloadable save (set aside)'}</span>
                  <span className="mono text-[10px] text-[#6c6a66]">{(b.bytes / 1024).toFixed(0)} KB</span>
                </div>
                <div className="mt-0.5 text-[11px] text-[#85827d]">
                  {fmt(b.at)}
                  {b.project ? ` · ${b.project.name} · ${b.project.variants.length} variants` : ''}
                </div>
                {b.error && <p className="mt-1 text-[10.5px] text-[#d9805f]">Cannot restore directly: {b.error} Download the raw file to repair it.</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <TextBtn variant="outline" className="h-6 text-[10.5px]" disabled={!b.project} onClick={() => restore(b)} testId={`button-restore-backup-${b.kind}`}>
                    <RotateCcw className="h-3 w-3" /> Restore
                  </TextBtn>
                  <TextBtn
                    className="h-6 text-[10.5px]"
                    onClick={() => downloadBlob(new Blob([b.raw], { type: 'application/json' }), `mission-backup-${b.kind}-${b.at ?? 'unknown'}.json`)}
                    testId={`button-download-backup-${b.kind}`}
                  >
                    <Download className="h-3 w-3" /> Download
                  </TextBtn>
                  {confirm === b.key ? (
                    <TextBtn
                      variant="danger"
                      className="h-6 text-[10.5px]"
                      onClick={() => {
                        deleteBackup(b.key);
                        setConfirm(null);
                        refresh();
                      }}
                      testId={`button-confirm-delete-backup-${b.kind}`}
                    >
                      Confirm delete
                    </TextBtn>
                  ) : (
                    <TextBtn className="h-6 text-[10.5px]" onClick={() => setConfirm(b.key)} testId={`button-delete-backup-${b.kind}`}>
                      <Trash2 className="h-3 w-3" /> Delete
                    </TextBtn>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
