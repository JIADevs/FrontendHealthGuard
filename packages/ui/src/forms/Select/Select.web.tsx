"use client";
import { useState } from 'react';
import { colors, palette, spacing, fontSize, fontWeight, radii, border, surface, text } from '../../tokens/tokens';
import type { SelectProps } from './Select.types';

export function Select({
  options,
  value,
  onChange,
  label,
  placeholder = 'Seleccionar...',
  disabled,
  error,
}: SelectProps) {
  const [focused, setFocused] = useState(false);

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing[3]}px ${spacing[8]}px ${spacing[3]}px ${spacing[4]}px`,
    border: `1.5px solid ${error ? palette.status.error[500] : focused ? 'var(--brand-500)' : border.default}`,
    borderRadius: radii.sm,
    fontSize: fontSize.sm,
    fontFamily: 'inherit',
    color: value ? text.primary : text.secondary,
    background: disabled ? border.light : surface.bg,
    appearance: 'none',
    WebkitAppearance: 'none',
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: focused ? '0 0 0 3px var(--brand-ring-md)' : undefined,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
      {label && (
        <label style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: text.primary }}>
          {label}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <select
          value={value ?? ''}
          disabled={disabled}
          style={selectStyle}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          <option value="" disabled hidden>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Chevron */}
        <span
          style={{
            position: 'absolute',
            right: spacing[4],
            top: '50%',
            width: 7,
            height: 7,
            borderRight: `1.5px solid ${text.secondary}`,
            borderBottom: `1.5px solid ${text.secondary}`,
            transform: 'translateY(-75%) rotate(45deg)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {error && (
        <span style={{ fontSize: fontSize.xs, color: palette.status.error[500] }}>{error}</span>
      )}
    </div>
  );
}
