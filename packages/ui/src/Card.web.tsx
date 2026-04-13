"use client";

import { useState } from 'react';
import { radii, spacing, fontSize, fontWeight } from './tokens';
import type { CardProps } from './Card.types';

export function Card({ title, subtitle, icon, iconBackground, children, actions, footer, onPress }: CardProps) {
  const [hovered, setHovered] = useState(false);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-card)',
    borderRadius: radii.lg,
    border: '1px solid var(--border)',
    overflow: 'hidden',
    cursor: onPress ? 'pointer' : 'default',
    transition: 'box-shadow 0.15s, transform 0.15s',
    boxShadow: hovered && onPress ? 'var(--shadow-md)' : 'var(--shadow-sm)',
    transform: hovered && onPress ? 'translateY(-1px)' : 'none',
  };

  return (
    <div
      style={containerStyle}
      onClick={onPress}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[3], padding: spacing[5] }}>
        {/* Icon slot */}
        {icon && (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: radii.md,
              background: iconBackground ?? 'color-mix(in srgb, var(--primary-500) 14%, var(--bg-card))',
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
              fontSize: fontSize.sm + 1,
              fontWeight: fontWeight.semibold,
              color: 'var(--text-primary)',
              marginBottom: subtitle ? 2 : 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: fontSize.sm, color: 'var(--text-secondary)' }}>
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
            padding: `${spacing[3]}px ${spacing[5]}px`,
            borderTop: '1px solid var(--border)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
