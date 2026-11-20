import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, fontSize, nativeFont } from '../../tokens/tokens';
import { useAppTheme, type ThemeContextValue } from '../../tokens/ThemeProvider';
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
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;
  const c = colorsFor(t, variant);
  const hasEdge = variant !== 'ghost' && !isDisabled;
  const down = pressed && hasEdge;
  const label = loading && loadingLabel ? loadingLabel : children;

  const text =
    typeof label === 'string' ? (
      <Text style={[styles.label, { color: c.fg, fontSize: fontSizeBySize[size] }]} numberOfLines={1}>
        {label}
      </Text>
    ) : (
      label
    );

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.outer,
        {
          minHeight: minHeightBySize[size],
          borderRadius: size === 'sm' ? 10 : radii.input,
          backgroundColor: hasEdge ? c.edge : 'transparent',
          paddingTop: down ? EDGE : 0,
          paddingBottom: hasEdge && !down ? EDGE : 0,
          alignSelf: fullWidth ? 'stretch' : undefined,
          opacity: isDisabled ? 0.5 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            backgroundColor: c.bg,
            borderRadius: size === 'sm' ? 10 : radii.input,
            borderWidth: c.border ? 1.5 : 0,
            borderColor: c.border ?? 'transparent',
            paddingHorizontal: variant === 'ghost' ? spacing[2] : paddingHorizontalBySize[size],
          },
        ]}
      >
        {loading ? <ActivityIndicator size="small" color={c.fg} /> : iconPosition === 'start' ? icon : null}
        {text}
        {!loading && iconPosition === 'end' ? icon : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: { overflow: 'hidden' },
  fill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  label: { fontFamily: nativeFont('heading', 800) },
});
