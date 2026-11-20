"use client";

import { useState } from 'react';
import { radii, spacing, fontSize, fontWeight, fontFamily } from '../../tokens/tokens';
import type { CardProps } from './Card.types';

const toneStyle = {
  streak:  { bg: 'var(--color-motivation-streak-bg)', border: 'var(--color-motivation-streak-border)' },
  ai:      { bg: 'var(--color-feature-ai-bg)', border: 'var(--color-feature-ai-fg)' },
  success: { bg: 'var(--color-success-bg)', border: 'var(--color-success-fg)' },
} as const;

export function Card({ title, subtitle, icon, iconBackground, children, actions, footer, onPress, variant = 'default', tone }: CardProps) {
  const [hovered, setHovered] = useState(false);
  // v2 (MASTER §6–7): radio 18, borde 1 px + canto inferior de 3 px (box-shadow, no cambia el alto)
  const borderColor = variant === 'selected' ? 'var(--color-brand-solid)' : tone ? toneStyle[tone].border : 'var(--color-border)';
  const pad = variant === 'compact' ? spacing[3] : spacing[4];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    background: tone ? toneStyle[tone].bg : 'var(--color-surface)',
    borderRadius: radii.card,
    border: `1px solid ${borderColor}`,
    overflow: 'hidden',
    cursor: onPress ? 'pointer' : 'default',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: `0 3px 0 ${hovered && onPress && variant !== 'selected' ? 'var(--color-brand-tint-border)' : borderColor}`,
  };

  return (
    <div
      style={containerStyle}
      onClick={onPress}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[3], padding: pad }}>
        {/* Icon slot */}
        {icon && (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 13,
              background: iconBackground ?? 'var(--color-surface-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}

        {/* Content slot */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: fontWeight.extrabold,
              fontFamily: fontFamily.heading,
              color: 'var(--color-text-primary)',
              marginBottom: subtitle ? 2 : 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: fontSize.sm, color: 'var(--color-text-secondary)' }}>
              {subtitle}
            </div>
          )}
          {children && <div style={{ marginTop: spacing[2] }}>{children}</div>}
        </div>

        {/* Actions slot */}
        {actions && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: spacing[1], flexShrink: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>

      {/* Footer slot */}
      {footer && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: `${spacing[3]}px ${pad}px`,
            borderTop: '1px solid var(--color-border)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
