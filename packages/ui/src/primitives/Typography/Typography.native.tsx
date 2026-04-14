import { Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, nativeFontFamily } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { TypographyProps, TypographyVariant, TypographyColor } from './Typography.types';

// ─── Variant → style ─────────────────────────────────────────────────────────

const f = nativeFontFamily.sans;

const variantStyles = StyleSheet.create({
  h1:      { fontFamily: f, fontSize: fontSize['4xl'], fontWeight: fontWeight.extrabold, lineHeight: 34 },
  h2:      { fontFamily: f, fontSize: fontSize['3xl'], fontWeight: fontWeight.extrabold, lineHeight: 30 },
  h3:      { fontFamily: f, fontSize: fontSize.xl,    fontWeight: fontWeight.bold,      lineHeight: 26 },
  h4:      { fontFamily: f, fontSize: fontSize.lg,    fontWeight: fontWeight.semibold,  lineHeight: 24 },
  body:    { fontFamily: f, fontSize: fontSize.base,  fontWeight: fontWeight.normal,    lineHeight: 22 },
  bodyLg:  { fontFamily: f, fontSize: fontSize.md,    fontWeight: fontWeight.normal,    lineHeight: 24 },
  bodySm:  { fontFamily: f, fontSize: fontSize.sm,    fontWeight: fontWeight.normal,    lineHeight: 20 },
  caption: { fontFamily: f, fontSize: fontSize.xs,    fontWeight: fontWeight.normal,    lineHeight: 16 },
  label:   { fontFamily: f, fontSize: fontSize.sm,    fontWeight: fontWeight.semibold,  lineHeight: 20 },
  overline:{ fontFamily: f, fontSize: fontSize.xs,    fontWeight: fontWeight.semibold,  lineHeight: 16, textTransform: 'uppercase', letterSpacing: 0.8 },
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
