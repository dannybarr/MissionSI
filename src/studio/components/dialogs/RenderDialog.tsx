import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/studio/components/ui/dialog';
import { useStudio } from '@/studio/studio/store';
import { downloadDataUrl, nextFrames, renderStill, slug, type RenderResult } from '@/studio/studio/export';
import { Segmented, SwitchRow, TextBtn } from '../kit';

export function RenderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { project, variant, select, selectMark, compare, view } = useStudio();
  const [scale, setScale] = useState<'2' | '3' | '4'>('3');
  const [transparent, setTransparent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RenderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      select(null); // drop selection outlines before capture
      selectMark(null);
      await nextFrames(3);
      setResult(renderStill(Number(scale), transparent));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Render failed.');
    } finally {
      setBusy(false);
    }
  };

  const filename = `${slug(project.name)}-${slug(variant.name)}-${result?.width ?? 0}x${result?.height ?? 0}.png`;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setResult(null);
      }}
    >
      <DialogContent className="max-w-[560px] border-white/[0.08] bg-[#141517] text-[#e9e6df]">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-medium tracking-[-0.01em]">Render still</DialogTitle>
          <DialogDescription className="text-[12px] text-[#7d7a75]">
            {`Re-renders the current camera at elevated resolution and saves a PNG. Mode: ${view.shading === 'accurate' ? 'True colour (exact hex, unlit)' : 'Studio shading (PBR, lighting-dependent)'}. All visible front and back marks are included.`}
          </DialogDescription>
        </DialogHeader>
        {compare.on ? (
          <p className="text-[12px] text-[#f08b7c]">Exit compare mode to render the active variant.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11.5px] text-[#a9a6a0]">Resolution</span>
              <div className="w-[220px]">
                <Segmented
                  label="Render scale"
                  value={scale}
                  onChange={(v) => setScale(v as typeof scale)}
                  options={[
                    { value: '2', label: '2×' },
                    { value: '3', label: '3×' },
                    { value: '4', label: '4×' },
                  ]}
                  testId="segment-render-scale"
                />
              </div>
            </div>
            <SwitchRow label="Transparent background" hint="Alpha PNG for compositing" checked={transparent} onChange={setTransparent} testId="switch-render-transparent" />
            <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-[6px] border border-white/[0.06] bg-[repeating-conic-gradient(#1b1c1f_0_25%,#202125_0_50%)] bg-[length:16px_16px]">
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#8d8a85]" />
              ) : result ? (
                <img src={result.dataUrl} alt="Rendered Mission Card" className="h-full w-full object-contain" data-testid="img-render-result" />
              ) : (
                <span className="text-[11.5px] text-[#5d5b57]">No render yet</span>
              )}
            </div>
            {result && (
              <div className="mono text-[10.5px] text-[#7d7a75]" data-testid="text-render-size">
                {result.width} × {result.height} px · PNG
              </div>
            )}
            {error && <p role="alert" className="text-[11.5px] text-[#f08b7c]">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <TextBtn variant="outline" testId="button-run-render" onClick={run} disabled={busy}>
                {result ? 'Render again' : 'Render'}
              </TextBtn>
              <TextBtn variant="solid" testId="button-download-render" disabled={!result} onClick={() => result && downloadDataUrl(result.dataUrl, filename)}>
                <Download className="h-3.5 w-3.5" /> Download PNG
              </TextBtn>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
