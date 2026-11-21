"use client";
import { fontFamily } from '../../tokens/tokens';
import type { SegmentedControlProps } from './SegmentedControl.types';

export function SegmentedControl({ options, value, onChange, accessibilityLabel }: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label={accessibilityLabel}
      style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 14, background: 'var(--color-surface-muted)' }}
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(option.value)}
            style={{
              flex: '1 1 auto',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '9px 6px',
              border: 0,
              borderRadius: 11,
              background: on ? 'var(--color-surface)' : 'transparent',
              boxShadow: on ? '0 2px 0 var(--color-border)' : 'none',
              color: on ? 'var(--color-brand-text)' : 'var(--color-text-on-muted)',
              font: `800 13px ${fontFamily.heading}`,
              whiteSpace: 'nowrap',
              transition: 'background 250ms cubic-bezier(0.2, 0, 0, 1), color 250ms, box-shadow 250ms',
              cursor: 'pointer',
            }}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
