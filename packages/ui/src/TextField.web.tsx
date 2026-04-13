"use client";
import { useState } from 'react';
import { colors, spacing, fontSize, fontWeight, radii } from './tokens';
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
    border: `1.5px solid ${error ? colors.error[500] : focused ? 'var(--primary-500)' : 'var(--border)'}`,
    borderRadius: radii.sm,
    fontSize: fontSize.sm,
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
    background: disabled
      ? 'color-mix(in srgb, var(--text-primary) 8%, var(--bg-card))'
      : 'color-mix(in srgb, var(--text-primary) 4%, var(--bg-card))',
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: focused ? '0 0 0 3px var(--primary-ring-md)' : undefined,
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
            color: 'var(--text-primary)',
          }}
        >
          {label}
          {required && <span style={{ color: colors.error[500], marginLeft: 2 }}>*</span>}
        </label>
      )}

      {multiline ? (
        <textarea
          className="hg-textfield-input"
          rows={4}
          {...(sharedProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 96 }}
        />
      ) : (
        <input
          className="hg-textfield-input"
          type={type}
          {...(sharedProps as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {error && (
        <span style={{ fontSize: fontSize.xs, color: colors.error[500] }}>
          {error}
        </span>
      )}
    </div>
  );
}
