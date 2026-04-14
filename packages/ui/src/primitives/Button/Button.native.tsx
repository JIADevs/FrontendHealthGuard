import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, palette, radii, spacing, fontSize, fontWeight } from '../../tokens/tokens';
import type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';

const bgByVariant: Record<ButtonVariant, string> = {
  primary:   palette.brand[500],
  secondary: colors.white,
  danger:    colors.error[500],
  ghost:     'transparent',
};

const colorByVariant: Record<ButtonVariant, string> = {
  primary:   colors.white,
  secondary: colors.gray[700],
  danger:    colors.white,
  ghost:     colors.primary[600],
};

const borderColorByVariant: Partial<Record<ButtonVariant, string>> = {
  secondary: colors.gray[200],
};

const paddingVerticalBySize: Record<ButtonSize, number> = {
  sm: spacing[2],
  md: spacing[3],
  lg: 14,
};

const paddingHorizontalBySize: Record<ButtonSize, number> = {
  sm: spacing[4],
  md: spacing[5],
  lg: spacing[6],
};

const fontSizeBySize: Record<ButtonSize, number> = {
  sm: fontSize.sm,
  md: fontSize.base,
  lg: fontSize.md,
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onPress,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        {
          backgroundColor: bgByVariant[variant],
          paddingVertical: paddingVerticalBySize[size],
          paddingHorizontal: paddingHorizontalBySize[size],
          borderRadius: radii.sm,
          borderWidth: borderColorByVariant[variant] ? 1.5 : 0,
          borderColor: borderColorByVariant[variant] ?? 'transparent',
          width: fullWidth ? '100%' : undefined,
          opacity: isDisabled ? 0.6 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colorByVariant[variant]} />
      ) : typeof children === 'string' ? (
        <Text
          style={{
            color: colorByVariant[variant],
            fontSize: fontSizeBySize[size],
            fontWeight: fontWeight.semibold,
          }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
});
