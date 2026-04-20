"use client";
import { colors, palette, fontSize, fontWeight, text } from '../../tokens/tokens';
import type { TypographyProps, TypographyVariant, TypographyColor } from './Typography.types';

// ─── Variant → style ─────────────────────────────────────────────────────────

const variantStyles: Record<TypographyVariant, React.CSSProperties> = {
  h1:      { fontSize: fontSize['4xl'], fontWeight: fontWeight.extrabold, lineHeight: 1.2 },
  h2:      { fontSize: fontSize['3xl'], fontWeight: fontWeight.extrabold, lineHeight: 1.25 },
  h3:      { fontSize: fontSize.xl,    fontWeight: fontWeight.bold,      lineHeight: 1.3 },
  h4:      { fontSize: fontSize.lg,    fontWeight: fontWeight.semibold,  lineHeight: 1.4 },
  body:    { fontSize: fontSize.base,  fontWeight: fontWeight.normal,    lineHeight: 1.6 },
  bodyLg:  { fontSize: fontSize.md,   fontWeight: fontWeight.normal,    lineHeight: 1.6 },
  bodySm:  { fontSize: fontSize.sm,   fontWeight: fontWeight.normal,    lineHeight: 1.5 },
  caption: { fontSize: fontSize.xs,   fontWeight: fontWeight.normal,    lineHeight: 1.4 },
  label:   { fontSize: fontSize.sm,   fontWeight: fontWeight.semibold,  lineHeight: 1.4 },
  overline:{ fontSize: fontSize.xs,   fontWeight: fontWeight.semibold,  lineHeight: 1.4, textTransform: 'uppercase', letterSpacing: '0.08em' },
};

// ─── Variant → HTML element ───────────────────────────────────────────────────

const variantElement: Record<TypographyVariant, keyof React.JSX.IntrinsicElements> = {
  h1:      'h1',
  h2:      'h2',
  h3:      'h3',
  h4:      'h4',
  body:    'p',
  bodyLg:  'p',
  bodySm:  'p',
  caption: 'span',
  label:   'span',
  overline:'span',
};

// ─── Color → CSS value ────────────────────────────────────────────────────────

const colorValue: Record<TypographyColor, string> = {
  default:   text.primary,
  secondary: text.secondary,
  muted:     text.muted,
  error:     palette.status.error[500],
  success:   palette.status.success[500],
  warning:   palette.status.warning[500],
  inherit:   'inherit',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Typography({
  variant = 'body',
  color = 'default',
  align,
  numberOfLines,
  children,
}: TypographyProps) {
  const Tag = variantElement[variant] as React.ElementType;

  const style: React.CSSProperties = {
    margin: 0,
    padding: 0,
    color: colorValue[color],
    textAlign: align,
    ...variantStyles[variant],
    ...(numberOfLines
      ? {
          display: '-webkit-box',
          WebkitLineClamp: numberOfLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }
      : {}),
  };

  return <Tag style={style}>{children}</Tag>;
}
