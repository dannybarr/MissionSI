import type { ReactNode } from 'react';
import { Button as NovaButton } from '@visa/nova-react';

/*
 * Nova (de-vpds-nova, @visa/nova-react 3.1.0, same version as Mission Studio) supplies the
 * accessible button semantics. Nova theme CSS is deliberately not loaded; the Mission look is
 * applied through locally scoped classes under `.mission-nova` in index.css, so the editorial
 * styling is unchanged and no Visa branding appears.
 */

interface MButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  testId: string;
  pressed?: boolean;
  label?: string;
}

export function MButton({ children, onClick, className = '', testId, pressed, label }: MButtonProps) {
  return (
    <NovaButton
      type="button"
      subtle
      className={`mission-nova ${className}`}
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      data-testid={testId}
    >
      {children}
    </NovaButton>
  );
}

interface MSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  testId: string;
}

/** Binary switch built on Nova Button with role="switch" + aria-checked. */
export function MSwitch({ checked, onChange, label, testId }: MSwitchProps) {
  return (
    <NovaButton
      type="button"
      subtle
      iconButton
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="mission-nova toggle"
      onClick={onChange}
      data-testid={testId}
    />
  );
}
