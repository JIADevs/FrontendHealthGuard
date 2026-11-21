"use client";
import { Check } from 'lucide-react';
import { radii, fontFamily } from '../../tokens/tokens';
import { toneVars } from '../../tokens/tones';
import type { ChipProps } from './Chip.types';
import { toneFromColor, OPTION_HEIGHT } from './chipStyle';

export function Chip({
  label,
  tone,
  color = 'default',
  variant = 'tag',
  icon,
  size = 'default',
  selected = false,
  selectionMode = 'multiple',
  onPress,
}: ChipProps) {
  const c = toneVars(tone ?? toneFromColor[color]);
  const isOption = variant === 'option';
  const compact = size === 'compact' && !isOption;

  const style: React.CSSProperties = isOption
    ? {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        minHeight: OPTION_HEIGHT,
        padding: '0 14px',
        // Kit `.pick` (mockups): radio 12, borde de 1,5 px y canto inferior de 3 px.
        borderRadius: 12,
        border: `1.5px solid ${selected ? 'var(--color-brand-focus)' : 'var(--color-border)'}`,
        boxShadow: `0 3px 0 ${selected ? 'var(--color-brand-focus)' : 'var(--color-border)'}`,
        background: selected ? 'var(--color-brand-tint)' : 'var(--color-surface)',
        color: selected ? 'var(--color-brand-text)' : 'var(--color-text-secondary)',
        font: `800 13px ${fontFamily.heading}`,
        transition: 'background 150ms, border-color 150ms, box-shadow 150ms, color 150ms',
        cursor: onPress ? 'pointer' : 'default',
        boxSizing: 'border-box',
      }
    : {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: compact ? '0 10px' : '5px 10px',
        minHeight: compact ? 28 : undefined,
        borderRadius: radii.full,
        border: 'none',
        // Seleccionado (filtros v1): relleno con el color del tono y texto blanco
        background: selected ? c.fg : c.bg,
        color: selected ? 'var(--color-text-on-solid)' : c.fg,
        font: `800 12.5px ${fontFamily.heading}`,
        whiteSpace: 'nowrap',
        cursor: onPress ? 'pointer' : 'default',
        boxSizing: 'border-box',
      };

  const content = (
    <>
      {isOption && selected ? <Check size={14} strokeWidth={3} aria-hidden /> : icon}
      {label}
    </>
  );

  if (onPress) {
    return (
      <button
        type="button"
        style={style}
        onClick={onPress}
        role={isOption ? (selectionMode === 'single' ? 'radio' : 'checkbox') : undefined}
        aria-checked={isOption ? selected : undefined}
      >
        {content}
      </button>
    );
  }
  return <span style={style}>{content}</span>;
}
