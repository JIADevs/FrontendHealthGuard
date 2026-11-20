"use client";
import { useState } from 'react';
import { fontFamily } from '../../tokens/tokens';
import type { IconButtonProps } from './IconButton.types';

const SIZE = 44;

export function IconButton({ icon, accessibilityLabel, tone = 'neutral', badge, disabled = false, onPress }: IconButtonProps) {
  const [hovered, setHovered] = useState(false);
  const showBadge = badge === true || (typeof badge === 'number' && badge > 0);
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={typeof badge === 'number' && badge > 0 ? `${accessibilityLabel}, ${badge}` : accessibilityLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: SIZE,
        height: SIZE,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: tone === 'tint' || hovered ? 'var(--color-surface-muted)' : 'var(--color-surface)',
        border: tone === 'neutral' ? '1.5px solid var(--color-border)' : 'none',
        color: 'var(--color-text-on-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        padding: 0,
        flexShrink: 0,
      }}
    >
      {icon}
      {showBadge ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: typeof badge === 'number' ? 2 : 8,
            right: typeof badge === 'number' ? 2 : 9,
            minWidth: typeof badge === 'number' ? 18 : 10,
            height: typeof badge === 'number' ? 18 : 10,
            padding: typeof badge === 'number' ? '0 4px' : 0,
            borderRadius: 9,
            background: 'var(--color-danger-solid)',
            border: '2px solid var(--color-surface)',
            color: 'var(--color-text-on-solid)',
            font: `900 10px/14px ${fontFamily.heading}`,
            boxSizing: 'border-box',
          }}
        >
          {typeof badge === 'number' ? (badge > 9 ? '9+' : badge) : null}
        </span>
      ) : null}
    </button>
  );
}
