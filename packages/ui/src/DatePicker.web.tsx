"use client";
import { useState } from 'react';
import { colors, spacing, fontSize, fontWeight, radii } from './tokens';
import type { DatePickerProps } from './DatePicker.types';

export function DatePicker({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  required,
  minDate,
  maxDate,
  id,
}: DatePickerProps) {
  const [focused, setFocused] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing[3]}px ${spacing[4]}px`,
    border: `1.5px solid ${error ? colors.error[500] : focused ? 'var(--primary-500)' : 'var(--border)'}`,
    borderRadius: radii.sm,
    fontSize: fontSize.sm,
    fontFamily: 'inherit',
    color: value ? 'var(--text-primary)' : 'var(--text-muted)',
    background: disabled
      ? 'color-mix(in srgb, var(--text-primary) 8%, var(--bg-card))'
      : 'color-mix(in srgb, var(--text-primary) 4%, var(--bg-card))',
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: focused ? '0 0 0 3px var(--primary-ring-md)' : undefined,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : undefined,
    colorScheme: 'light dark',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: 'var(--text-primary)',
          }}
        >
          {label}
          {required && <span style={{ color: colors.error[500], marginLeft: 2 }}>*</span>}
        </label>
      )}

      <input
        id={id}
        className="hg-native-date-input"
        type="date"
        value={value}
        min={minDate}
        max={maxDate}
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
