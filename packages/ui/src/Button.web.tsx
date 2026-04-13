"use client";
import { useState } from 'react';
import { colors, radii, spacing, fontSize, fontWeight } from './tokens';
import { Spinner } from './Spinner.web';
import type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';

const bgByVariant: Record<ButtonVariant, string> = {
  primary:   colors.sky[500],
  secondary: 'var(--btn-secondary-bg)',
  danger:    colors.error[500],
  ghost:     'transparent',
};

const bgHoverByVariant: Record<ButtonVariant, string> = {
  primary:   colors.sky[600],
  secondary: 'var(--btn-secondary-bg-hover)',
  danger:    colors.error[600],
  ghost:     'var(--btn-ghost-hover-bg)',
};

const colorByVariant: Record<ButtonVariant, string> = {
  primary:   colors.white,
  secondary: 'var(--btn-secondary-color)',
  danger:    colors.white,
  ghost:     colors.primary[600],
};

const borderByVariant: Record<ButtonVariant, string> = {
  primary:   'none',
  secondary: '1.5px solid var(--btn-secondary-border)',
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

const spinnerSizeByButton: Record<ButtonSize, 'sm' | 'md'> = {
  sm: 'sm',
  md: 'md',
  lg: 'md',
};

function loadingSpinner(variant: ButtonVariant, buttonSize: ButtonSize) {
  const spinSize = spinnerSizeByButton[buttonSize];
  const spinColor = variant === 'primary' || variant === 'danger' ? 'white' : 'primary';
  return <Spinner size={spinSize} color={spinColor} />;
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
      aria-busy={loading || undefined}
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
        cursor: loading ? 'wait' : isDisabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !loading ? 0.6 : 1,
        transition: 'background 0.15s, opacity 0.15s',
        outline: 'none',
        boxSizing: 'border-box',
      }}
    >
      {loading ? (
        <>
          {loadingSpinner(variant, size)}
          <span className="sr-only">Cargando</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
