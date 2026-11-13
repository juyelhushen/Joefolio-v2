import type { ComponentPropsWithRef } from 'react';
import { Check, LoaderCircle } from 'lucide-react';

type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'default' | 'compact';
  iconOnly?: boolean;
  state?: 'idle' | 'loading' | 'success';
  loadingLabel?: string;
  successLabel?: string;
};

export default function Button({
  variant = 'secondary',
  size = 'default',
  iconOnly = false,
  state = 'idle',
  loadingLabel = 'Working…',
  successLabel = 'Done',
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const loading = state === 'loading';

  return (
    <button
      {...props}
      type={type}
      className={`button button-${variant}${size === 'compact' ? ' button-compact' : ''}${iconOnly ? ' button-icon' : ''} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || props['aria-busy']}
      data-state={state}
    >
      <span className="button-content">
        <span className="button-label" aria-hidden={state !== 'idle'}>
          {children}
        </span>
        <span className="button-feedback" aria-hidden={!loading}>
          <LoaderCircle className="button-spinner" aria-hidden="true" />
          <span className={iconOnly ? 'visually-hidden' : undefined}>{loadingLabel}</span>
        </span>
        <span className="button-feedback" aria-hidden={state !== 'success'}>
          <Check aria-hidden="true" />
          <span className={iconOnly ? 'visually-hidden' : undefined}>{successLabel}</span>
        </span>
      </span>
    </button>
  );
}
