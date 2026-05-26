"use client";
import { useState } from 'react';
import { colors, palette, spacing, fontSize, fontWeight, radii, border, surface, text } from '../../tokens/tokens';
import type { TextFieldProps } from './TextField.types';

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  disabled,
  required,
  multiline,
  id,
  autoFocus,
  autoComplete,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing[3]}px ${spacing[4]}px`,
    border: `1.5px solid ${error ? palette.status.error[500] : focused ? 'var(--brand-500)' : border.default}`,
    borderRadius: radii.sm,
    fontSize: fontSize.sm,
    fontFamily: 'inherit',
    color: text.primary,
    background: disabled ? border.light : surface.bg,
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: focused ? '0 0 0 3px var(--brand-ring-md)' : undefined,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : undefined,
  };

  const sharedProps = {
    id,
    value,
    placeholder,
    disabled,
    required,
    autoFocus,
    autoComplete,
    style: inputStyle,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
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
          {required && <span style={{ color: palette.status.error[500], marginLeft: 2 }}>*</span>}
        </label>
      )}

      {multiline ? (
        <textarea
          rows={4}
          {...(sharedProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 96 }}
        />
      ) : (
        <input
          type={type}
          {...(sharedProps as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {error && (
        <span style={{ fontSize: fontSize.xs, color: palette.status.error[500] }}>
          {error}
        </span>
      )}
    </div>
  );
}
