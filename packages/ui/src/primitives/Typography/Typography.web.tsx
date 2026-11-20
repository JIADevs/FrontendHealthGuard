"use client";
import { fontSize, fontWeight, fontFamily } from '../../tokens/tokens';
import type { TypographyProps, TypographyVariant, TypographyColor } from './Typography.types';

// ─── Variant → style ─────────────────────────────────────────────────────────

// v2 (MASTER §5): títulos, etiquetas y eyebrows en Nunito; cuerpo en Inter (cargadas con next/font).
const H = fontFamily.heading;
const B = fontFamily.body;

const variantStyles: Record<TypographyVariant, React.CSSProperties> = {
  h1:      { fontFamily: H, fontSize: fontSize['4xl'], fontWeight: fontWeight.black,     lineHeight: 1.2 },
  h2:      { fontFamily: H, fontSize: fontSize['3xl'], fontWeight: fontWeight.black,     lineHeight: 1.25 },
  h3:      { fontFamily: H, fontSize: fontSize.xl,    fontWeight: fontWeight.extrabold, lineHeight: 1.3 },
  h4:      { fontFamily: H, fontSize: fontSize.lg,    fontWeight: fontWeight.extrabold, lineHeight: 1.4 },
  body:    { fontFamily: B, fontSize: fontSize.base,  fontWeight: fontWeight.normal,    lineHeight: 1.6 },
  bodyLg:  { fontFamily: B, fontSize: fontSize.md,   fontWeight: fontWeight.normal,    lineHeight: 1.6 },
  bodySm:  { fontFamily: B, fontSize: fontSize.sm,   fontWeight: fontWeight.normal,    lineHeight: 1.5 },
  caption: { fontFamily: B, fontSize: fontSize.xs,   fontWeight: fontWeight.normal,    lineHeight: 1.4 },
  label:   { fontFamily: H, fontSize: fontSize.sm,   fontWeight: fontWeight.extrabold, lineHeight: 1.4 },
  overline:{ fontFamily: H, fontSize: fontSize.xs,   fontWeight: fontWeight.black,     lineHeight: 1.4, textTransform: 'uppercase', letterSpacing: '0.08em' },
  display: { fontFamily: H, fontSize: 30,            fontWeight: fontWeight.black,     lineHeight: 1.1 },
  eyebrow: { fontFamily: H, fontSize: fontSize.xs,   fontWeight: fontWeight.black,     lineHeight: 1.3, textTransform: 'uppercase', letterSpacing: '0.08em' },
  data:    { fontFamily: B, fontSize: 14,            fontWeight: fontWeight.semibold,  lineHeight: 1.3 },
  meta:    { fontFamily: B, fontSize: fontSize.sm,   fontWeight: fontWeight.normal,    lineHeight: 1.4 },
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
  display: 'p',
  eyebrow: 'span',
  data:    'span',
  meta:    'span',
};

// ─── Color → CSS value ────────────────────────────────────────────────────────

// Variables CSS: siguen el modo oscuro (cssVariables.ts). Estados en tono 700 (≥ 4,5:1).
const colorValue: Record<TypographyColor, string> = {
  default:   'var(--color-text-primary)',
  secondary: 'var(--color-text-secondary)',
  muted:     'var(--color-text-muted)',
  error:     'var(--color-danger-fg)',
  success:   'var(--color-success-fg)',
  warning:   'var(--color-warning-fg)',
  inherit:   'inherit',
  brand:     'var(--color-brand-text)',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Typography({
  variant = 'body',
  color,
  align,
  numberOfLines,
  children,
}: TypographyProps) {
  const Tag = variantElement[variant] as React.ElementType;

  const style: React.CSSProperties = {
    margin: 0,
    padding: 0,
    color: colorValue[color ?? (variant === 'meta' ? 'secondary' : 'default')],
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
