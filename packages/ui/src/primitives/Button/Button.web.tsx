"use client";
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { radii, spacing, fontSize, fontWeight, fontFamily } from '../../tokens/tokens';
import type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';

/**
 * v2 (MASTER §6–7). Los colores son variables CSS (`--color-*`, ver cssVariables.ts), así el
 * botón sigue el modo oscuro. Canto inferior de 3 px con box-shadow: no cambia el alto.
 */
type VariantStyle = { bg: string; hover: string; fg: string; edge: string; border?: string };

const variantStyles: Record<ButtonVariant, VariantStyle> = {
  primary:   { bg: 'var(--color-brand-solid)', hover: 'var(--color-brand-edge)', fg: 'var(--color-text-on-solid)', edge: 'var(--color-brand-edge)' },
  success:   { bg: 'var(--color-success-solid)', hover: 'var(--color-success-edge)', fg: 'var(--color-text-on-solid)', edge: 'var(--color-success-edge)' },
  streak:    { bg: 'var(--color-motivation-streak-solid)', hover: 'var(--color-motivation-streak-edge)', fg: 'var(--color-text-on-solid)', edge: 'var(--color-motivation-streak-edge)' },
  danger:    { bg: 'var(--color-danger-solid)', hover: 'var(--color-danger-edge)', fg: 'var(--color-text-on-solid)', edge: 'var(--color-danger-edge)' },
  secondary: { bg: 'var(--color-surface)', hover: 'var(--color-surface-muted)', fg: 'var(--color-brand-text)', edge: 'var(--color-border)', border: '1.5px solid var(--color-border)' },
  ghost:     { bg: 'transparent', hover: 'var(--color-brand-tint)', fg: 'var(--color-brand-text)', edge: 'transparent' },
};

const minHeightBySize: Record<ButtonSize, number> = { sm: 44, md: 48, lg: 52 };
const paddingXBySize: Record<ButtonSize, number> = { sm: spacing[4], md: spacing[5], lg: spacing[6] };
const fontSizeBySize: Record<ButtonSize, number> = { sm: 14, md: fontSize.base, lg: fontSize.md };
const loaderSizeBySize: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };

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
  loadingLabel,
  icon,
  iconPosition = 'start',
  accessibilityLabel,
  onPress,
  type = 'button',
  form,
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;
  const v = variantStyles[variant];
  const hasEdge = variant !== 'ghost' && !isDisabled;
  const down = pressed && hasEdge;

  return (
    <button
      type={type}
      form={form}
      onClick={onPress}
      disabled={isDisabled}
      aria-label={accessibilityLabel}
      aria-busy={loading || undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        width: fullWidth ? '100%' : undefined,
        minHeight: minHeightBySize[size],
        padding: `0 ${variant === 'ghost' ? spacing[2] : paddingXBySize[size]}px`,
        background: hovered && !isDisabled ? v.hover : v.bg,
        color: v.fg,
        border: v.border ?? 'none',
        borderRadius: size === 'sm' ? 10 : radii.input,
        boxShadow: hasEdge && !down ? `0 3px 0 ${v.edge}` : 'none',
        transform: down ? 'translateY(3px)' : undefined,
        fontSize: fontSizeBySize[size],
        fontWeight: fontWeight.extrabold,
        fontFamily: fontFamily.heading,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'background 0.15s, transform 0.08s, box-shadow 0.08s, opacity 0.15s',
        boxSizing: 'border-box',
      }}
    >
      {loading ? (
        <Loader2
          size={loaderSizeBySize[size]}
          strokeWidth={2.5}
          aria-hidden
          style={{ color: v.fg, animation: 'helu-ui-btn-spin 0.65s linear infinite' }}
        />
      ) : iconPosition === 'start' ? (
        icon
      ) : null}
      {loading && loadingLabel ? loadingLabel : children}
      {!loading && iconPosition === 'end' ? icon : null}
    </button>
  );
}
