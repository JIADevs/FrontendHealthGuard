import { useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radii, fontSize } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { SearchFieldProps } from './SearchField.types';

// ── Inline icons (no lucide dependency) ────────────────────────────────────

function SearchIcon({ color }: { color: string }) {
  return (
    <View style={[iconStyles.root, { width: 18, height: 18 }]} pointerEvents="none">
      <View style={[iconStyles.circle, { borderColor: color }]} />
      <View style={[iconStyles.handle, { backgroundColor: color }]} />
    </View>
  );
}

function ClearIcon({ color }: { color: string }) {
  return (
    <View style={[iconStyles.root, { width: 10, height: 10 }]} pointerEvents="none">
      <View style={[iconStyles.xLine, { backgroundColor: color, transform: [{ rotate: '45deg' }] }]} />
      <View style={[iconStyles.xLine, { backgroundColor: color, transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  root:    { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  circle:  { position: 'absolute', top: 0, left: 0, width: 13, height: 13, borderRadius: 7, borderWidth: 2 },
  handle:  { position: 'absolute', bottom: 0, right: 0, width: 2, height: 7, borderRadius: 1, transform: [{ rotate: '45deg' }] },
  xLine:   { position: 'absolute', width: 10, height: 1.5, borderRadius: 1 },
});

// ── SearchField ─────────────────────────────────────────────────────────────

export function SearchField({
  value,
  onChange,
  placeholder = 'Buscar...',
  accessibilityLabel,
}: SearchFieldProps) {
  const t = useAppTheme();
  const inputRef = useRef<TextInput>(null);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      style={[styles.container, { backgroundColor: t.border.light }]}
      accessibilityRole="search"
    >
      <SearchIcon color={t.text.secondary} />

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={t.text.muted}
        style={[styles.input, { color: t.text.primary }]}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        accessibilityLabel={accessibilityLabel ?? placeholder}
      />

      {value.trim().length > 0 && (
        <TouchableOpacity
          onPress={() => onChange('')}
          style={[styles.clearBtn, { backgroundColor: t.border.medium }]}
          accessibilityRole="button"
          accessibilityLabel="Limpiar búsqueda"
        >
          <ClearIcon color={t.text.secondary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: fontSize.sm,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
