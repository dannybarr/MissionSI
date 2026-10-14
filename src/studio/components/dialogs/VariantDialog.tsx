import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/studio/components/ui/dialog';
import { useStudio } from '@/studio/studio/store';
import { TextBtn } from '../kit';

export function VariantDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { project, saveAsVariant } = useStudio();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => {
    if (open) {
      setName(`Mission / Direction ${String(project.variants.length + 1).padStart(2, '0')}`);
      setNote('');
    }
  }, [open, project.variants.length]);
  const valid = name.trim().length > 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] border-white/[0.08] bg-[#141517] text-[#e9e6df]">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-medium">Save named variant</DialogTitle>
          <DialogDescription className="text-[12px] text-[#7d7a75]">Snapshots the current design as a new direction in the concept gallery.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            saveAsVariant(name.trim().slice(0, 60), note.trim().slice(0, 120));
            onOpenChange(false);
          }}
        >
          <label className="block">
            <span className="label-xs">Name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className="mt-1 h-8 w-full rounded-[5px] border border-white/[0.08] bg-black/25 px-2 text-[13px] focus:border-[hsl(var(--signal))]/60 focus:outline-none"
              data-testid="input-variant-name"
            />
          </label>
          <label className="block">
            <span className="label-xs">Note (optional)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
              placeholder="e.g. Deeper contours, laser frosted mark"
              className="mt-1 h-8 w-full rounded-[5px] border border-white/[0.08] bg-black/25 px-2 text-[12px] placeholder:text-[#4d4b48] focus:border-[hsl(var(--signal))]/60 focus:outline-none"
              data-testid="input-variant-note"
            />
          </label>
          <div className="flex justify-end gap-2">
            <TextBtn testId="button-cancel-variant" onClick={() => onOpenChange(false)}>
              Cancel
            </TextBtn>
            <TextBtn type="submit" variant="solid" disabled={!valid} testId="button-confirm-variant">
              Save variant
            </TextBtn>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
