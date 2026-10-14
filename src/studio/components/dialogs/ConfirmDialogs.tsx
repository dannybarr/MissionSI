import { useState } from 'react';
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
import { Segmented, TextBtn } from '../kit';

const content = 'max-w-[440px] border-white/[0.08] bg-[#141517] text-[#e9e6df]';

export function RestoreDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { restoreDefaults, variant } = useStudio();
  const [scope, setScope] = useState<'variant' | 'project'>('variant');
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={content}>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[15px] font-medium">Restore defaults?</AlertDialogTitle>
          <AlertDialogDescription className="text-[12px] text-[#8d8a85]">
            {scope === 'variant'
              ? `Resets geometry, materials, branding, lighting and layers of "${variant.name}".`
              : 'Replaces every variant with the three starting directions (Silver, Graphite, Champagne).'}{' '}
            You can still undo this.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Segmented
          label="Restore scope"
          value={scope}
          onChange={(v) => setScope(v as typeof scope)}
          options={[
            { value: 'variant', label: 'Active variant' },
            { value: 'project', label: 'Whole project' },
          ]}
          testId="segment-restore-scope"
        />
        <AlertDialogFooter>
          <AlertDialogCancel className="h-7 border-white/[0.09] bg-transparent text-[11.5px] text-[#d7d4ce] hover:bg-white/5" data-testid="button-cancel-restore">
            Cancel
          </AlertDialogCancel>
          <TextBtn
            variant="danger"
            testId="button-confirm-restore"
            onClick={() => {
              restoreDefaults(scope);
              onOpenChange(false);
            }}
          >
            Restore
          </TextBtn>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ErrorDialog({ title, message, onClose }: { title: string; message: string | null; onClose: () => void }) {
  return (
    <AlertDialog open={!!message} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className={content}>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[15px] font-medium">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[12px] leading-relaxed text-[#a9a6a0]" data-testid="text-error-message">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <TextBtn variant="solid" testId="button-dismiss-error" onClick={onClose}>
            OK
          </TextBtn>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
