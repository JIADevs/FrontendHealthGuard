"use client";
import { colors, border, text, fontSize } from '../../tokens/tokens';
import type { CheckboxProps } from './Checkbox.types';

const BOX = 20;
const RADIUS = 5;

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  const interactive = !!onChange && !disabled;

  const boxStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: BOX,
    height: BOX,
    minWidth: BOX,
    borderRadius: RADIUS,
    border: `2px solid ${checked ? colors.sky[500] : border.default}`,
    backgroundColor: checked ? colors.sky[500] : 'transparent',
    transition: 'background-color 0.15s, border-color 0.15s',
    opacity: disabled ? 0.5 : 1,
    flexShrink: 0,
    boxSizing: 'border-box',
  };

  const checkmarkStyle: React.CSSProperties = {
    display: 'block',
    width: 5,
    height: 9,
    borderRight: '2px solid white',
    borderBottom: '2px solid white',
    transform: 'rotate(45deg)',
    marginTop: -3,
  };

  // Visual-only (no onChange) — pointer-events: none so parent row handles clicks
  if (!onChange) {
    return (
      <span style={{ ...boxStyle, pointerEvents: 'none' }}>
        {checked && <span style={checkmarkStyle} />}
      </span>
    );
  }

  // Standalone without label — box is the interactive element
  if (!label) {
    return (
      <span
        role="checkbox"
        aria-checked={checked}
        tabIndex={interactive ? 0 : -1}
        onClick={(e) => { e.stopPropagation(); if (interactive) onChange(!checked); }}
        onKeyDown={(e) => { if (interactive && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); onChange(!checked); } }}
        style={{ ...boxStyle, cursor: interactive ? 'pointer' : 'default', outline: 'none' }}
      >
        {checked && <span style={checkmarkStyle} />}
      </span>
    );
  }

  // With label — label element is the interactive area
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: interactive ? 'pointer' : 'default',
        userSelect: 'none',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        role="checkbox"
        aria-checked={checked}
        onClick={(e) => { e.stopPropagation(); if (interactive) onChange(!checked); }}
        style={boxStyle}
      >
        {checked && <span style={checkmarkStyle} />}
      </span>
      <span style={{ fontSize: fontSize.sm, color: text.primary }}>{label}</span>
    </label>
  );
}
