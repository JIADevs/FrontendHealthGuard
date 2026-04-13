import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, palette, spacing, fontSize, fontWeight, radii } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { TextFieldProps } from './TextField.types';

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  required,
  multiline,
  numberOfLines = 4,
  type,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoFocus,
  returnKeyType,
  accessibilityLabel,
}: TextFieldProps) {
  const t = useAppTheme();
  const [focused, setFocused] = useState(false);
  const isPassword = type === 'password';

  const borderColor = error
    ? colors.error[500]
    : focused
    ? palette.brand[500]
    : t.border.medium;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: t.text.primary }]}>
          {label}
          {required ? <Text style={{ color: colors.error[500] }}> *</Text> : null}
        </Text>
      )}

      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={t.text.muted}
        editable={!disabled}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : undefined}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
        returnKeyType={returnKeyType}
        accessibilityLabel={accessibilityLabel ?? label}
        secureTextEntry={isPassword}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          {
            borderColor,
            color: t.text.primary,
            backgroundColor: disabled ? t.border.light : t.surface.bg,
          },
          multiline && styles.multiline,
          disabled && styles.disabled,
        ]}
      />

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
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
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: fontSize.md,
  },
  multiline: {
    height: 120,
    textAlignVertical: 'top',
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.error[500],
    backgroundColor: colors.error[50],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.xs,
  },
});
