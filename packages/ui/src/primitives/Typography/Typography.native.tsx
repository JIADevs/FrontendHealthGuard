import { Text, StyleSheet } from 'react-native';
import { fontSize, nativeFont } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { TypographyProps, TypographyVariant, TypographyColor } from './Typography.types';

// ─── Variant → style ─────────────────────────────────────────────────────────

// v2 (MASTER §5): títulos, etiquetas y eyebrows en Nunito; cuerpo en Inter.
// Con fuentes cargadas, el peso lo define la familia (Nunito_900Black…), no `fontWeight`:
// Android no elige el archivo por `fontWeight` y iOS puede caer a la fuente del sistema.
const heading = (w: number) => ({ fontFamily: nativeFont('heading', w) });
const body = (w: number) => ({ fontFamily: nativeFont('body', w) });

const variantStyles = StyleSheet.create({
  h1:      { ...heading(900), fontSize: fontSize['4xl'], lineHeight: 34 },
  h2:      { ...heading(900), fontSize: fontSize['3xl'], lineHeight: 30 },
  h3:      { ...heading(800), fontSize: fontSize.xl,    lineHeight: 26 },
  h4:      { ...heading(800), fontSize: fontSize.lg,    lineHeight: 24 },
  body:    { ...body(400),    fontSize: fontSize.base,  lineHeight: 22 },
  bodyLg:  { ...body(400),    fontSize: fontSize.md,    lineHeight: 24 },
  bodySm:  { ...body(400),    fontSize: fontSize.sm,    lineHeight: 20 },
  caption: { ...body(400),    fontSize: fontSize.xs,    lineHeight: 16 },
  label:   { ...heading(800), fontSize: fontSize.sm,    lineHeight: 20 },
  overline:{ ...heading(900), fontSize: fontSize.xs,    lineHeight: 16, textTransform: 'uppercase', letterSpacing: 0.8 },
  display: { ...heading(900), fontSize: 30,             lineHeight: 33 },
  eyebrow: { ...heading(900), fontSize: fontSize.xs,    lineHeight: 14, textTransform: 'uppercase', letterSpacing: 0.9 },
  data:    { ...body(600),    fontSize: 14,             lineHeight: 18 },
  meta:    { ...body(400),    fontSize: fontSize.sm,    lineHeight: 18 },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function Typography({
  variant = 'body',
  color,
  align,
  numberOfLines,
  children,
}: TypographyProps) {
  const t = useAppTheme();

  const colorValue: Record<TypographyColor, string> = {
    default:   t.text.primary,
    secondary: t.text.secondary,
    muted:     t.text.muted,
    error:     t.status.errorFg,
    success:   t.status.successFg,
    warning:   t.status.warningFg,
    inherit:   t.text.primary,
    brand:     t.brand.text,
  };

  return (
    <Text
      style={[variantStyles[variant], { color: colorValue[color ?? (variant === 'meta' ? 'secondary' : 'default')], textAlign: align }]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}
