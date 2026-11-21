import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion, radii, spacing, fontSize, nativeFont } from '../../tokens/tokens';
import { useAppTheme, type ThemeContextValue } from '../../tokens/ThemeProvider';
import { FadeThrough, motionEasing, useReducedMotion } from '../../motion/motion.native';
import type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';

/** Canto inferior de 3 px (MASTER §6, elevación 2). Se dibuja dentro del alto: el botón no cambia de tamaño al presionarlo. */
const EDGE = 3;

const minHeightBySize: Record<ButtonSize, number> = { sm: 44, md: 48, lg: 52 };
const paddingHorizontalBySize: Record<ButtonSize, number> = { sm: spacing[4], md: spacing[5], lg: spacing[6] };
const fontSizeBySize: Record<ButtonSize, number> = { sm: 14, md: fontSize.base, lg: fontSize.md };

type VariantColors = { bg: string; fg: string; edge: string; border?: string };

function colorsFor(t: ThemeContextValue, variant: ButtonVariant): VariantColors {
  switch (variant) {
    case 'primary':   return { bg: t.brand.solid, fg: t.text.onSolid, edge: t.brand.edge };
    case 'success':   return { bg: t.status.successSolid, fg: t.text.onSolid, edge: t.status.successEdge };
    case 'streak':    return { bg: t.motivation.streakSolid, fg: t.text.onSolid, edge: t.motivation.streakEdge };
    case 'danger':    return { bg: t.status.dangerSolid, fg: t.text.onSolid, edge: t.status.dangerEdge };
    case 'secondary': return { bg: t.surface.bgCard, fg: t.brand.text, edge: t.border.default, border: t.border.default };
    case 'ghost':     return { bg: 'transparent', fg: t.brand.text, edge: 'transparent' };
  }
}

/**
 * Botón v2 (movimiento-interacciones.md §5):
 * - Presionado: el relleno baja 3 px con `translateY` y tapa el canto (100 ms abajo con `ease-out`,
 *   150 ms arriba). Solo se anima `transform`; el alto nunca cambia (§8).
 * - Cargando: el texto pasa a gerundio con fundido y aparece el spinner; el ancho no cambia.
 *   Queda bloqueado (sin doble envío) pero conserva su color: no es un botón deshabilitado.
 * - Deshabilitado: opacidad 0,5 y sin canto.
 * Con movimiento reducido el presionado cambia sin animar.
 */
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
}: ButtonProps) {
  const t = useAppTheme();
  const reduced = useReducedMotion();
  const c = colorsFor(t, variant);
  const blocked = disabled || loading;
  // Muchas pantallas pasan `disabled={isPending}` junto con `loading`: cargando nunca se ve deshabilitado.
  const dimmed = disabled && !loading;
  const hasEdge = variant !== 'ghost' && !dimmed;
  const radius = size === 'sm' ? 10 : radii.input;
  const minHeight = minHeightBySize[size];

  const press = useSharedValue(0);
  const fillStyle = useAnimatedStyle(() => ({ transform: [{ translateY: press.value }] }));
  const pressTo = (to: number, duration: number) => {
    press.value = reduced ? to : withTiming(to, { duration, easing: to > 0 ? motionEasing.out : motionEasing.standard });
  };

  // Ancho estable al cargar: se fija el ancho que tenía con su texto normal.
  const [restWidth, setRestWidth] = useState<number | undefined>(undefined);

  const content = (isLoading: boolean) => {
    const label = isLoading && loadingLabel ? loadingLabel : children;
    const text =
      typeof label === 'string' ? (
        <Text style={[styles.label, { color: c.fg, fontSize: fontSizeBySize[size] }]} numberOfLines={1}>
          {label}
        </Text>
      ) : (
        label
      );
    return (
      <View style={styles.row}>
        {isLoading ? <ActivityIndicator size="small" color={c.fg} /> : iconPosition === 'start' ? icon : null}
        {text}
        {!isLoading && iconPosition === 'end' ? icon : null}
      </View>
    );
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      onPressIn={() => hasEdge && pressTo(EDGE, motion.instant)}
      onPressOut={() => pressTo(0, motion.fast)}
      onLayout={(e) => {
        if (!loading) setRestWidth(e.nativeEvent.layout.width);
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: blocked, busy: loading }}
      style={{
        minHeight,
        alignSelf: fullWidth ? 'stretch' : undefined,
        minWidth: loading && !fullWidth ? restWidth : undefined,
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      {/* Canto: una capa del color del borde, corrida 3 px hacia abajo, fija detrás del relleno. */}
      {hasEdge ? (
        <View style={[StyleSheet.absoluteFill, { top: EDGE, borderRadius: radius, backgroundColor: c.edge }]} />
      ) : null}
      <Animated.View
        style={[
          styles.fill,
          {
            minHeight: minHeight - (hasEdge ? EDGE : 0),
            marginBottom: hasEdge ? EDGE : 0,
            backgroundColor: c.bg,
            borderRadius: radius,
            borderWidth: c.border ? 1.5 : 0,
            borderColor: c.border ?? 'transparent',
            paddingHorizontal: variant === 'ghost' ? spacing[2] : paddingHorizontalBySize[size],
          },
          fillStyle,
        ]}
      >
        <FadeThrough value={loading}>{content}</FadeThrough>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  label: { fontFamily: nativeFont('heading', 800) },
});
