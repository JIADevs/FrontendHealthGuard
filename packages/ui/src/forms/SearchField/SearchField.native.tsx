import type { ComponentRef } from 'react';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { nativeFont, radii } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import { FIELD_MIN_HEIGHT, FieldFocusRing } from '../fieldKit.native';
import { Spinner } from '../../primitives/Spinner/Spinner.native';
import type { SearchFieldProps } from './SearchField.types';

/**
 * Buscador v2 (kit `.search`, mockups «Tratamientos», «Documentos», m7 «Búsqueda sin resultados»):
 * caja blanca de 48 px con borde de 1,5 px y radio 14, lupa de 18 px, texto de 14 px. En foco toma
 * el anillo de los campos (borde azul + halo, fundido de 150 ms, formularios.md §3). «✕» borra la
 * búsqueda; mientras llegan resultados, el spinner del sistema la reemplaza (v2.13).
 */
export function SearchField({
  value,
  onChange,
  placeholder = 'Buscar',
  accessibilityLabel,
  loading = false,
}: SearchFieldProps) {
  const t = useAppTheme();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={[styles.container, { borderColor: t.border.default, backgroundColor: t.surface.bgCard }]}
      accessibilityRole="search"
    >
      <FieldFocusRing t={t} visible={focused} />
      <Search size={18} strokeWidth={2.2} color={t.text.muted} />

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={t.text.muted}
        style={[styles.input, { color: t.text.primary }]}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        accessibilityLabel={accessibilityLabel ?? placeholder}
      />

      {loading ? (
        <View style={styles.trailing} accessibilityLabel="Buscando" accessibilityLiveRegion="polite">
          <Spinner size="sm" />
        </View>
      ) : value.trim().length > 0 ? (
        <Pressable
          onPress={() => onChange('')}
          // 24 px visible, 44 px to touch (#35).
          hitSlop={10}
          style={({ pressed }) => [styles.trailing, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Borrar la búsqueda"
        >
          <X size={16} strokeWidth={2.2} color={t.text.muted} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: FIELD_MIN_HEIGHT,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderRadius: radii.input,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 14,
    fontFamily: nativeFont('body', 400),
  },
  trailing: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});
