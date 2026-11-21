import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { AlertCircle } from 'lucide-react-native';
import { colors, fontSize, motion, nativeFont, radii, spacing } from '../tokens/tokens';
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
    // Foco: borde azul + halo de 3 px (formularios.md §3, movimiento-interacciones.md §5)
    boxShadow: focused && !error ? `0 0 0 3px ${t.brand.tintBorder}` : undefined,
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
    // Entra con fundido bajando 4 px en 150 ms; sin sacudida (movimiento-interacciones.md §5).
    <Animated.View
      entering={FadeInDown.duration(motion.fast).withInitialValues({ opacity: 0, transform: [{ translateY: -4 }] })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <AlertCircle size={14} color={t.status.errorFg} />
      <Text style={{ flex: 1, fontSize: fontSize.sm, fontFamily: nativeFont('body', 400), color: t.status.errorFg }}>
        {message}
      </Text>
    </Animated.View>
  );
}

export const fieldTextStyle = (t: ThemeContextValue, filled: boolean) => ({
  fontSize: fontSize.base,
  fontFamily: nativeFont('body', 400),
  color: filled ? t.text.primary : t.text.muted,
});

/**
 * Anillo de foco (formularios.md §3, movimiento-interacciones.md §5 «Campo»): borde azul de 2 px,
 * halo de 3 px y fondo de superficie, en una capa detrás del texto que entra y sale con opacidad
 * en 150 ms. Así el foco se anima sin tocar el borde ni el layout (§8). Con error no se muestra:
 * el borde rojo manda.
 */
export function FieldFocusRing({ t, visible }: { t: ThemeContextValue; visible: boolean }) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    opacity.value = reduced ? (visible ? 1 : 0) : withTiming(visible ? 1 : 0, { duration: motion.fast });
  }, [visible, reduced, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: -1.5,
          left: -1.5,
          right: -1.5,
          bottom: -1.5,
          borderRadius: radii.input,
          borderWidth: 2,
          borderColor: t.brand.focus,
          backgroundColor: t.surface.bgCard,
          boxShadow: `0 0 0 3px ${t.brand.tintBorder}`,
        },
        style,
      ]}
    />
  );
}
