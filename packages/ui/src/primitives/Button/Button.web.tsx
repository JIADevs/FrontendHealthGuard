"use client";
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { colors, palette, radii, spacing, fontSize, fontWeight } from '../../tokens/tokens';
import type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';

const bgByVariant: Record<ButtonVariant, string> = {
  primary:   palette.brand[500],
  secondary: colors.white,
  danger:    colors.error[500],
  ghost:     'transparent',
};

const bgHoverByVariant: Record<ButtonVariant, string> = {
  primary:   palette.brand[600],
  secondary: colors.gray[50],
  danger:    colors.error[600],
  ghost:     colors.primary[50], 
};

const colorByVariant: Record<ButtonVariant, string> = {
  primary:   colors.white,
  secondary: colors.gray[700],
  danger:    colors.white,
  ghost:     colors.primary[600],
};

const borderByVariant: Record<ButtonVariant, string> = {
  primary:   'none',
  secondary: `1.5px solid ${colors.gray[200]}`,
  danger:    'none',
  ghost:     'none',
};

const paddingBySize: Record<ButtonSize, string> = {
  sm: `${spacing[2]}px ${spacing[4]}px`,
  md: `${spacing[3]}px ${spacing[5]}px`,
  lg: `14px ${spacing[6]}px`,
};

const fontSizeBySize: Record<ButtonSize, number> = {
  sm: fontSize.sm,
  md: fontSize.base,
  lg: fontSize.md,
};

const loaderSizeBySize: Record<ButtonSize, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

/* Keyframes injected once for loading indicator (works without app globals.css). */
if (typeof document !== 'undefined' && !document.getElementById('helu-ui-btn-spin-kf')) {
  const el = document.createElement('style');
  el.id = 'helu-ui-btn-spin-kf';
  el.textContent = '@keyframes helu-ui-btn-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(el);
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onPress,
  type = 'button',
  form,
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const isDisabled = disabled || loading;

  const bg = hovered && !isDisabled ? bgHoverByVariant[variant] : bgByVariant[variant];

  return (
    <button
      type={type}
      form={form}
      onClick={onPress}
      disabled={isDisabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        width: fullWidth ? '100%' : undefined,
        padding: paddingBySize[size],
        background: bg,
        color: colorByVariant[variant],
        border: borderByVariant[variant],
        borderRadius: radii.sm,
        fontSize: fontSizeBySize[size],
        fontWeight: fontWeight.semibold,
        fontFamily: 'inherit',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'background 0.15s, opacity 0.15s',
        outline: 'none',
        boxSizing: 'border-box',
      }}
    >
      {loading ? (
        <Loader2
          size={loaderSizeBySize[size]}
          strokeWidth={2.5}
          aria-hidden
          style={{
            color: colorByVariant[variant],
            animation: 'helu-ui-btn-spin 0.65s linear infinite',
          }}
        />
      ) : (
        children
      )}
    </button>
  );
}
