import { useEffect, useState } from 'react';
import { useStudio } from '@/studio/studio/store';
import { cn } from '@/studio/lib/utils';

function ago(at: number) {
  const s = Math.round((Date.now() - at) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SaveIndicator() {
  const { saveState } = useStudio();
  const [, tick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 15000);
    return () => window.clearInterval(t);
  }, []);

  let dot = 'bg-[#6c6a66]';
  let text = '';
  let title = '';
  switch (saveState.status) {
    case 'saved':
      dot = 'bg-[#8fbf8a]';
      text = `Saved locally ${ago(saveState.at)}`;
      title = 'Autosaved to this browser';
      break;
    case 'dirty':
      dot = 'bg-[#d9b25c] ms-pulse';
      text = 'Saving…';
      break;
    case 'error':
      dot = 'bg-[#e2523f]';
      text = 'Save failed';
      title = saveState.reason;
      break;
    case 'unavailable':
      dot = 'bg-[#e2523f]';
      text = 'Local storage unavailable — export JSON to keep work';
      title = 'This browser blocks localStorage (private mode or policy). Changes are kept only for this session.';
      break;
  }
  return (
    <div role="status" aria-live="polite" title={title} className="flex min-w-0 items-center gap-1.5 text-[11px] text-[#7d7a75]" data-testid="status-save">
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)} />
      <span className="truncate">{text}</span>
    </div>
  );
}
