import { useEffect, useId, useState, type ReactNode } from 'react';
import { Button as NovaButton, ScreenReader } from '@visa/nova-react';
import { cn } from '@/studio/lib/utils';

/* Nova Button is used unstyled (no Nova theme CSS) so semantics/accessibility come from Nova
   while the visuals follow the Mission Studio chrome. */

interface IconBtnProps {
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
  testId: string;
  className?: string;
  kbd?: string;
}

export function IconBtn({ label, onClick, active, disabled, children, testId, className, kbd }: IconBtnProps) {
  return (
    <NovaButton
      type="button"
      iconButton
      subtle
      title={kbd ? `${label}  (${kbd})` : label}
      aria-pressed={active === undefined ? undefined : active}
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'inline-flex h-7 min-w-7 items-center justify-center gap-1.5 rounded-[5px] px-1.5 text-[#a7a5a0] transition-[background,color,transform] duration-150',
        'hover:bg-white/[0.06] hover:text-[#efece6] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-30',
        'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[hsl(var(--signal))]',
        active && 'bg-white/[0.08] text-[#f3f1ec]',
        className,
      )}
    >
      {children}
      <ScreenReader>{label}</ScreenReader>
    </NovaButton>
  );
}

interface TextBtnProps {
  onClick?: () => void;
  children: ReactNode;
  testId: string;
  variant?: 'ghost' | 'solid' | 'outline' | 'danger';
  disabled?: boolean;
  className?: string;
  title?: string;
  type?: 'button' | 'submit';
}

export function TextBtn({ onClick, children, testId, variant = 'ghost', disabled, className, title, type = 'button' }: TextBtnProps) {
  return (
    <NovaButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      data-testid={testId}
      className={cn(
        'inline-flex h-7 items-center justify-center gap-1.5 rounded-[5px] px-2.5 text-[11.5px] font-medium tracking-[-0.005em] transition-[background,color,border-color,transform] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35',
        'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[hsl(var(--signal))]',
        variant === 'ghost' && 'text-[#b9b6b0] hover:bg-white/[0.06] hover:text-[#f3f1ec]',
        variant === 'solid' && 'bg-[#ebe8e1] text-[#121315] hover:bg-white',
        variant === 'outline' && 'border border-white/[0.09] text-[#d7d4ce] hover:border-white/[0.18] hover:bg-white/[0.03]',
        variant === 'danger' && 'border border-[#e2523f]/40 text-[#f08b7c] hover:bg-[#e2523f]/10',
        className,
      )}
    >
      {children}
    </NovaButton>
  );
}

export function Section({ title, children, aside, defaultOpen = true }: { title: string; children: ReactNode; aside?: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="border-b border-white/[0.06]">
      <div className="flex h-11 items-center justify-between px-5">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="label-xs flex items-center gap-1.5 hover:text-[#d8d5cf]"
          data-testid={`toggle-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <span className={cn('inline-block h-0 w-0 border-y-[3px] border-l-[4px] border-y-transparent border-l-current transition-transform', open && 'rotate-90')} />
          {title}
        </button>
        {aside}
      </div>
      {open && (
        <div id={id} className="space-y-3.5 px-5 pb-5">
          {children}
        </div>
      )}
    </section>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  disabled?: boolean;
  testId: string;
  digits?: number;
}

export function ParamSlider({ label, value, min, max, step = 0.01, unit, onChange, disabled, testId, digits }: SliderProps) {
  const id = useId();
  const dp = digits ?? (step >= 1 ? 0 : step >= 0.1 ? 1 : 2);
  const [draft, setDraft] = useState(value.toFixed(dp));
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setDraft(value.toFixed(dp));
  }, [value, dp, editing]);
  const pct = ((value - min) / (max - min)) * 100;
  const commitDraft = () => {
    setEditing(false);
    const n = Number(draft);
    if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
    else setDraft(value.toFixed(dp));
  };
  return (
    <div className={cn('grid grid-cols-[1fr_auto] items-center gap-x-2', disabled && 'opacity-40')}>
      <label htmlFor={id} className="truncate text-[11.5px] text-[#a9a6a0]">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          aria-label={`${label} value`}
          className="mono h-5 w-[52px] rounded-[3px] border border-transparent bg-transparent px-1 text-right text-[11px] text-[#e9e6df] hover:border-white/10 focus:border-[hsl(var(--signal))]/60 focus:bg-black/30 focus:outline-none"
          value={draft}
          disabled={disabled}
          onFocus={() => setEditing(true)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              const d = (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
              onChange(Math.max(min, Math.min(max, +(value + d).toFixed(4))));
            }
          }}
          data-testid={`${testId}-value`}
        />
        {unit && <span className="mono w-5 text-[10px] text-[#6c6a66]">{unit}</span>}
      </div>
      <input
        id={id}
        type="range"
        className="ms-range col-span-2"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        style={{ ['--p' as string]: `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
        data-testid={testId}
      />
    </div>
  );
}

export function ColorField({ label, value, onChange, disabled, testId }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; testId: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div className={cn('flex items-center justify-between gap-2', disabled && 'opacity-40')}>
      <span className="text-[11.5px] text-[#a9a6a0]">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          aria-label={`${label} hex`}
          className="mono h-6 w-[72px] rounded-[4px] border border-white/[0.08] bg-black/20 px-1.5 text-[11px] uppercase text-[#e9e6df] focus:border-[hsl(var(--signal))]/60 focus:outline-none"
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => (/^#[0-9a-fA-F]{6}$/.test(draft) ? onChange(draft.toLowerCase()) : setDraft(value))}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          data-testid={`${testId}-hex`}
        />
        <label className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-[4px] border border-white/15" style={{ background: value }}>
          <input
            type="color"
            aria-label={label}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            data-testid={testId}
          />
        </label>
      </div>
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  testId,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
  testId: string;
}) {
  const id = useId();
  return (
    <div className={cn('flex items-center justify-between gap-3', disabled && 'opacity-40')}>
      <label htmlFor={id} className="shrink-0 text-[11.5px] text-[#a9a6a0]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-6 min-w-0 max-w-[170px] flex-1 cursor-pointer rounded-[4px] border border-white/[0.08] bg-[#17181b] px-1.5 text-[11.5px] text-[#e9e6df] focus:border-[hsl(var(--signal))]/60 focus:outline-none"
        data-testid={testId}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  disabled,
  testId,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
  testId: string;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex rounded-[5px] border border-white/[0.07] bg-black/20 p-0.5', disabled && 'opacity-40')}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-6 flex-1 rounded-[4px] px-1.5 text-[11px] transition-colors',
            value === o.value ? 'bg-[#2a2b2f] text-[#f3f1ec] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]' : 'text-[#8d8a85] hover:text-[#d8d5cf]',
          )}
          data-testid={`${testId}-${o.value}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SwitchRow({ label, checked, onChange, disabled, testId, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; testId: string; hint?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3', disabled && 'opacity-40')}>
      <div>
        <div className="text-[11.5px] text-[#a9a6a0]">{label}</div>
        {hint && <div className="text-[10.5px] text-[#6c6a66]">{hint}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative h-4 w-7 shrink-0 rounded-full transition-colors', checked ? 'bg-[#e9e6df]' : 'bg-white/[0.12]')}
        data-testid={testId}
      >
        <span className={cn('absolute top-0.5 h-3 w-3 rounded-full transition-transform', checked ? 'translate-x-3.5 bg-[#121315]' : 'translate-x-0.5 bg-[#8d8a85]')} />
      </button>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="rounded-[4px] border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-[10.5px] leading-[1.45] text-[#85827d]">{children}</p>;
}
