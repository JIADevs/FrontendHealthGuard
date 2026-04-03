"use client";
import { useState } from 'react';
import { colors, spacing, fontSize, fontWeight, radii, border, surface, text } from './tokens';
import type { TimePickerProps } from './TimePicker.types';

export function TimePicker({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  required,
  id,
}: TimePickerProps) {
  const [focused, setFocused] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing[3]}px ${spacing[4]}px`,
    border: `1.5px solid ${error ? colors.error[500] : focused ? 'var(--primary-500)' : border.default}`,
    borderRadius: radii.sm,
    fontSize: fontSize.sm,
    fontFamily: 'inherit',
    color: value ? text.primary : text.muted,
    background: disabled ? border.light : surface.bg,
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: focused ? '0 0 0 3px var(--primary-ring-md)' : undefined,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : undefined,
    colorScheme: 'light',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: text.primary,
          }}
        >
          {label}
          {required && <span style={{ color: colors.error[500], marginLeft: 2 }}>*</span>}
        </label>
      )}

      <input
        id={id}
        type="time"
        value={value}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        style={inputStyle}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      {error && (
        <span style={{ fontSize: fontSize.xs, color: colors.error[500] }}>
          {error}
        </span>
      )}
    </div>
  );
}
