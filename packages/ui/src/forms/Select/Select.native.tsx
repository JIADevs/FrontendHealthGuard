import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors, palette, spacing, fontSize, fontWeight, radii } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { SelectProps } from './Select.types';

export function Select({
  options,
  value,
  onChange,
  label,
  placeholder = 'Seleccionar...',
  disabled,
  error,
}: SelectProps) {
  const t = useAppTheme();
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const borderColor = error
    ? colors.error[500]
    : open
    ? palette.brand[500]
    : t.border.medium;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: t.text.primary }]}>{label}</Text>
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          { borderColor, backgroundColor: disabled ? t.border.light : t.surface.bg },
          disabled && styles.disabled,
        ]}
        accessibilityRole="combobox"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open, disabled: !!disabled }}
      >
        <Text
          style={[styles.triggerText, { color: selectedLabel ? t.text.primary : t.text.muted }]}
          numberOfLines={1}
        >
          {selectedLabel ?? placeholder}
        </Text>
        <View style={[styles.chevron, open && styles.chevronOpen]} />
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: t.surface.bgCard }]}>
            {label && (
              <Text style={[styles.sheetTitle, { color: t.text.secondary }]}>{label}</Text>
            )}
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    { borderBottomColor: t.border.light },
                    item.value === value && { backgroundColor: palette.brand[50] },
                  ]}
                  onPress={() => { onChange(item.value); setOpen(false); }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: item.value === value }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: item.value === value ? palette.brand[600] : t.text.primary },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && <View style={styles.checkmark} />}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1],
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  triggerText: {
    flex: 1,
    fontSize: fontSize.md,
  },
  disabled: {
    opacity: 0.6,
  },
  chevron: {
    width: 8,
    height: 8,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.slate[400],
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
  },
  chevronOpen: {
    transform: [{ rotate: '-135deg' }],
    marginTop: 4,
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.error[500],
    backgroundColor: colors.error[50],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing[4],
    paddingBottom: Platform.OS === 'ios' ? spacing[10] : spacing[6],
    maxHeight: '70%',
  },
  sheetTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.slate[200],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  checkmark: {
    width: 6,
    height: 12,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: palette.brand[500],
    transform: [{ rotate: '45deg' }],
  },
});
