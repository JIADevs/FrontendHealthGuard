"use client";

import { colors, radii, fontSize, fontWeight } from './tokens';
import type { ChipProps, ChipColor } from './Chip.types';

const unselected: Record<ChipColor, { background: string; color: string }> = {
  default: { background: colors.primary[50],  color: colors.primary[700] },
  green:   { background: colors.success[50],  color: colors.green[700]   },
  amber:   { background: colors.amber[50],    color: colors.amber[800]   },
};

const selected: Record<ChipColor, { background: string; color: string }> = {
  default: { background: colors.sky[500],   color: colors.white },
  green:   { background: colors.green[500], color: colors.white },
  amber:   { background: colors.amber[500], color: colors.white },
};

export function Chip({ label, color = 'default', selected: isSelected = false, onPress }: ChipProps) {
  const palette = isSelected ? selected[color] : unselected[color];

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: radii.full,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    whiteSpace: 'nowrap',
    cursor: onPress ? 'pointer' : 'default',
    border: 'none',
    background: palette.background,
    color: palette.color,
    transition: 'background 0.15s, color 0.15s',
  };

  if (onPress) {
    return (
      <button type="button" style={style} onClick={onPress}>
        {label}
      </button>
    );
  }

  return <span style={style}>{label}</span>;
}
