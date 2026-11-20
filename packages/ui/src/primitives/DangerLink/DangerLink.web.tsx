"use client";
import { fontFamily } from '../../tokens/tokens';
import type { DangerLinkProps } from './DangerLink.types';

export function DangerLink({ label, icon, onPress, disabled = false }: DangerLinkProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      style={{
        minHeight: 44,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        alignSelf: 'center',
        margin: '0 auto',
        padding: '0 8px',
        background: 'none',
        border: 'none',
        color: 'var(--color-danger-fg)',
        font: `800 14px ${fontFamily.heading}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}
      {label}
    </button>
  );
}
