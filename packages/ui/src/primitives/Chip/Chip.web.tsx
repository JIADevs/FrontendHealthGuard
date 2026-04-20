"use client";

import { colors, palette, radii, fontSize, fontWeight } from '../../tokens/tokens';
import type { ChipProps, ChipColor } from './Chip.types';

const unselected: Record<ChipColor, { background: string; color: string }> = {
  default: { background: palette.brand[50],  color: palette.brand[700] },
  green:   { background: palette.status.success[50],  color: palette.accent.document[700]   },
  amber:   { background: palette.accent.medication[50],    color: palette.accent.medication[800]   },
};

const selected: Record<ChipColor, { background: string; color: string }> = {
  default: { background: palette.brand[500],   color: colors.white },
  green:   { background: palette.accent.document[500], color: colors.white },
  amber:   { background: palette.accent.medication[500], color: colors.white },
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
