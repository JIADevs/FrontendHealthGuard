import { Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight } from './tokens';
import { useAppTheme } from './ThemeProvider';
import type { TypographyProps, TypographyVariant, TypographyColor } from './Typography.types';

// ─── Variant → style ─────────────────────────────────────────────────────────

const variantStyles = StyleSheet.create({
  h1:      { fontSize: fontSize['4xl'], fontWeight: fontWeight.extrabold, lineHeight: 34 },
  h2:      { fontSize: fontSize['3xl'], fontWeight: fontWeight.extrabold, lineHeight: 30 },
  h3:      { fontSize: fontSize.xl,    fontWeight: fontWeight.bold,      lineHeight: 26 },
  h4:      { fontSize: fontSize.lg,    fontWeight: fontWeight.semibold,  lineHeight: 24 },
  body:    { fontSize: fontSize.base,  fontWeight: fontWeight.normal,    lineHeight: 22 },
  bodyLg:  { fontSize: fontSize.md,   fontWeight: fontWeight.normal,    lineHeight: 24 },
  bodySm:  { fontSize: fontSize.sm,   fontWeight: fontWeight.normal,    lineHeight: 20 },
  caption: { fontSize: fontSize.xs,   fontWeight: fontWeight.normal,    lineHeight: 16 },
  label:   { fontSize: fontSize.sm,   fontWeight: fontWeight.semibold,  lineHeight: 20 },
  overline:{ fontSize: fontSize.xs,   fontWeight: fontWeight.semibold,  lineHeight: 16, textTransform: 'uppercase', letterSpacing: 0.8 },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function Typography({
  variant = 'body',
  color = 'default',
  align,
  numberOfLines,
  children,
}: TypographyProps) {
  const t = useAppTheme();

  const colorValue: Record<TypographyColor, string> = {
    default:   t.text.primary,
    secondary: t.text.secondary,
    muted:     t.text.muted,
    error:     colors.error[500],
    success:   colors.success[500],
    warning:   colors.warning[500],
    inherit:   t.text.primary,
  };

  return (
    <Text
      style={[variantStyles[variant], { color: colorValue[color], textAlign: align }]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}
