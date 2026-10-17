import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/studio/components/ui/dialog';
import { useStudio } from '@/studio/studio/store';
import { nextFrames, renderStill } from '@/studio/studio/export';
import { submitWaitlist } from '@/landing/api/waitlist.functions';
import { placedFeatures } from '@/studio/studio/features';
import { TextBtn } from '../kit';

export function ReserveDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { variant, select, selectMark, compare } = useStudio();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [use, setUse] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'warn' | 'bad'; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      select(null);
      selectMark(null);
      await nextFrames(2);
      let png: string | undefined;
      try {
        const still = renderStill(1, false);
        if (still.dataUrl.length <= 900_000) png = still.dataUrl;
      } catch {
        png = undefined;
      }
      const result = await submitWaitlist({
        data: {
          email: email.trim(),
          name: name.trim() || undefined,
          use: use.trim() || undefined,
          source: 'studio',
          design: { variant, features: placedFeatures(variant.design.marks).map(({ id, x, y }) => ({ id, x, y })) },
          png,
        },
      });
      if (result.ok) {
        setNotice({ tone: 'ok', text: 'Saved with this design. It records interest only: no order, deposit or ship date.' });
      } else if (result.error === 'not_configured') {
        setNotice({
          tone: 'warn',
          text: 'Nothing was stored. The reservation inbox is not connected yet. TODO: set KV_REST_API_URL and KV_REST_API_TOKEN, or RESEND_API_KEY and RESEND_TO.',
        });
      } else {
        setNotice({ tone: 'bad', text: 'That did not go through. Check the email address and try again.' });
      }
    } catch (err) {
      setNotice({ tone: 'bad', text: err instanceof Error ? err.message : 'That did not go through.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] border-white/[0.08] bg-[#141517] text-[#e9e6df]">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-medium tracking-[-0.01em]">Reserve this design</DialogTitle>
          <DialogDescription className="text-[12px] leading-relaxed text-[#7d7a75]">
            Sends this design, its hardware modules and a PNG of the viewport with your email. Founding target £249. This is not an order and nothing is charged.
          </DialogDescription>
        </DialogHeader>
        {compare.on ? (
          <p className="text-[12px] text-[#f08b7c]">Exit compare mode so the render is a single card.</p>
        ) : (
          <form className="space-y-3" onSubmit={submit}>
            <Field label="Email" value={email} onChange={setEmail} type="email" required testId="input-reserve-email" />
            <Field label="Name, optional" value={name} onChange={setName} testId="input-reserve-name" />
            <label className="block text-[11.5px] text-[#a9a6a0]">
              What would you use it for?
              <textarea
                value={use}
                maxLength={500}
                onChange={(e) => setUse(e.target.value)}
                className="mt-1 min-h-[72px] w-full rounded-[5px] border border-white/[0.08] bg-black/30 px-2 py-1.5 text-[13px] text-[#f3f1ec] focus:border-[hsl(var(--signal))]/50 focus:outline-none"
                data-testid="input-reserve-use"
              />
            </label>
            <TextBtn testId="button-reserve-submit" variant="solid" type="submit" disabled={busy || !email.trim()}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save reservation
            </TextBtn>
            {notice && (
              <p
                className={notice.tone === 'ok' ? 'text-[12px] text-[#c9d7c4]' : notice.tone === 'warn' ? 'text-[12px] text-[#e6d3a4]' : 'text-[12px] text-[#f08b7c]'}
                data-testid="status-reserve"
              >
                {notice.text}
              </p>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  testId: string;
}) {
  return (
    <label className="block text-[11.5px] text-[#a9a6a0]">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-8 w-full rounded-[5px] border border-white/[0.08] bg-black/30 px-2 text-[13px] text-[#f3f1ec] focus:border-[hsl(var(--signal))]/50 focus:outline-none"
        data-testid={testId}
      />
    </label>
  );
}
