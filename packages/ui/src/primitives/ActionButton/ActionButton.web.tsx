"use client";
import { useState } from 'react';
import { Pencil, Plus, Trash2, Copy, Share2, Eye } from 'lucide-react';
import { colors, palette, radii, spacing, fontSize, fontWeight } from '../../tokens/tokens';
import type { ActionButtonProps, ActionType, ActionButtonSize } from './ActionButton.types';

const iconByAction: Record<ActionType, React.ElementType> = {
  edit:   Pencil,
  create: Plus,
  delete: Trash2,
  copy:   Copy,
  share:  Share2,
  view:   Eye,
};

const colorByAction: Record<ActionType, { fg: string; bg: string; bgHover: string }> = {
  edit:   { fg: palette.brand[600],     bg: palette.brand[50],     bgHover: palette.brand[100] },
  create: { fg: palette.accent.document[600],   bg: palette.accent.document[50],   bgHover: palette.accent.document[100] },
  delete: { fg: palette.status.error[600],   bg: palette.status.error[50],   bgHover: palette.status.error[100] },
  copy:   { fg: palette.surface[600],   bg: palette.surface[50],   bgHover: palette.surface[100] },
  share:  { fg: palette.accent.ai[600],  bg: palette.accent.ai[50],  bgHover: palette.accent.ai[100] },
  view:   { fg: palette.surface[600],   bg: palette.surface[50],   bgHover: palette.surface[100] },
};

const containerSizePx: Record<ActionButtonSize, number> = { sm: 28, md: 36, lg: 44 };
const iconSizePx:      Record<ActionButtonSize, number> = { sm: 14, md: 18, lg: 22 };
const labelSizePx:     Record<ActionButtonSize, number> = { sm: fontSize.xs, md: fontSize.sm, lg: fontSize.base };

export function ActionButton({
  action,
  onPress,
  size = 'md',
  label,
  disabled = false,
  loading = false,
  tooltip,
}: ActionButtonProps) {
  const [hovered, setHovered] = useState(false);
  const isDisabled = disabled || loading;

  const { fg, bg, bgHover } = colorByAction[action];
  const Icon = iconByAction[action];
  const containerSize = containerSizePx[size];
  const iconSize = iconSizePx[size];

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: spacing[1] }}>
      <button
        type="button"
        title={tooltip}
        onClick={onPress}
        disabled={isDisabled}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: containerSize,
          height: containerSize,
          borderRadius: radii.full,
          border: 'none',
          background: hovered && !isDisabled ? bgHover : bg,
          color: fg,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.5 : 1,
          transition: 'background 0.15s, opacity 0.15s',
          outline: 'none',
          padding: 0,
          flexShrink: 0,
        }}
      >
        {loading ? (
          <span style={{ fontSize: iconSize, color: fg, lineHeight: 1 }}>…</span>
        ) : (
          <Icon size={iconSize} strokeWidth={2} />
        )}
      </button>

      {label && (
        <span
          style={{
            fontSize: labelSizePx[size],
            fontWeight: fontWeight.medium,
            color: fg,
            userSelect: 'none',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
