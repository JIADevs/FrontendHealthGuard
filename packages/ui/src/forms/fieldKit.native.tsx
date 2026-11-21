import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { colors, fontSize, nativeFont, radii, spacing } from '../tokens/tokens';
import type { ThemeContextValue } from '../tokens/ThemeProvider';

/**
 * Anatomía común de los campos v2 (formularios.md §2–3, kit `.lbl` / `.inp`):
 * etiqueta Nunito 800 13, caja de 48 px con radio 14 y borde de 1,5 px,
 * fondo `--input-bg` (#F8FAFC) que pasa a la superficie en foco, y error con ícono.
 */
export const FIELD_MIN_HEIGHT = 48;

export function fieldBox(
  t: ThemeContextValue,
  { focused = false, error = false, disabled = false }: { focused?: boolean; error?: boolean; disabled?: boolean },
) {
  const inputBg = t.mode === 'dark' ? t.surface.muted : colors.slate[50];
  return {
    minHeight: FIELD_MIN_HEIGHT,
    borderRadius: radii.input,
    borderWidth: focused ? 2 : 1.5,
    borderColor: error ? t.status.dangerSolid : focused ? t.brand.focus : t.border.default,
    backgroundColor: disabled ? t.surface.muted : focused ? t.surface.bgCard : inputBg,
    paddingHorizontal: 14,
    opacity: disabled ? 0.5 : 1,
  } as const;
}

export function FieldLabel({ t, label }: { t: ThemeContextValue; label: string }) {
  return (
    <Text style={{ fontSize: fontSize.sm, fontFamily: nativeFont('heading', 800), color: t.text.primary }}>
      {label}
    </Text>
  );
}

/** Error bajo el campo: ícono ⓘ + texto rojo, anunciado al lector de pantalla. */
export function FieldErrorText({ t, message }: { t: ThemeContextValue; message?: string }) {
  if (!message) return null;
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <AlertCircle size={14} color={t.status.errorFg} />
      <Text style={{ flex: 1, fontSize: fontSize.sm, fontFamily: nativeFont('body', 400), color: t.status.errorFg }}>
        {message}
      </Text>
    </View>
  );
}

export const fieldTextStyle = (t: ThemeContextValue, filled: boolean) => ({
  fontSize: fontSize.base,
  fontFamily: nativeFont('body', 400),
  color: filled ? t.text.primary : t.text.muted,
});
