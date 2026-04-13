"use client";
import { useState } from 'react';
import { border, surface, text, spacing, fontSize, radii } from '../../tokens/tokens';
import type { SearchFieldProps } from './SearchField.types';

export function SearchField({
  value,
  onChange,
  placeholder = 'Buscar...',
  accessibilityLabel,
}: SearchFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[2],
        paddingLeft: spacing[3],
        paddingRight: value ? spacing[1] : spacing[3],
        paddingTop: 9,
        paddingBottom: 9,
        borderRadius: radii.md,
        border: `1.5px solid ${focused ? 'var(--primary-500)' : border.default}`,
        backgroundColor: surface.bg,
        boxShadow: focused ? '0 0 0 3px var(--primary-ring-md)' : undefined,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxSizing: 'border-box',
      }}
    >
      {/* Search icon (inline SVG — no lucide dependency) */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={text.secondary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={accessibilityLabel ?? placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: fontSize.sm,
          color: text.primary,
          fontFamily: 'inherit',
          minWidth: 0,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            minWidth: 24,
            borderRadius: '50%',
            border: 'none',
            background: border.medium,
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke={text.secondary}
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
