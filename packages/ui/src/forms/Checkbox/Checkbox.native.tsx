import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight, radii } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { CheckboxProps } from './Checkbox.types';

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  const t = useAppTheme();

  const box = (
    <View
      style={[
        styles.box,
        { borderColor: checked ? colors.sky[500] : t.border.medium },
        checked && styles.boxChecked,
        disabled && styles.disabled,
      ]}
    >
      {checked && <View style={styles.checkmark} />}
    </View>
  );

  const content = label ? (
    <View style={styles.row}>
      {box}
      <Text style={[styles.label, { color: t.text.primary }]}>{label}</Text>
    </View>
  ) : box;

  // Visual-only — no touch handling, parent row controls interaction
  if (!onChange) return content;

  return (
    <TouchableOpacity
      onPress={() => onChange(!checked)}
      disabled={disabled}
      activeOpacity={0.7}
      accessible
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityLabel={label}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 20,
    height: 20,
    minWidth: 20,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.sky[500],
  },
  disabled: {
    opacity: 0.5,
  },
  // CSS border-trick checkmark (L-shape rotated 45°)
  checkmark: {
    width: 5,
    height: 9,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.white,
    transform: [{ rotate: '45deg' }],
    marginTop: -3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
