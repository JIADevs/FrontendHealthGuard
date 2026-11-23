import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";
import {
  BottomSheet,
  SearchField,
  colors,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  type BottomSheetHandle,
  type ThemeContextValue,
} from "@helu/ui";

interface SelectFieldProps {
  label: string;
  value?: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
  required?: boolean;
}

function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Selector for many options or a server list (formularios.md §2: «Selector — hoja con búsqueda en
 * móvil»): the field looks like the kit inputs and opens a kit BottomSheet with a search box and the
 * options, the chosen one with a check. Before, the list unfolded inside the form and was hidden by
 * the fixed bottom bar.
 */
export function SelectField({ label, value, placeholder, options, onChange }: SelectFieldProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = fold(search.trim());
    return q ? options.filter((opt) => fold(opt).includes(q)) : options;
  }, [options, search]);

  const close = () => {
    setOpen(false);
    setSearch("");
  };
  const pick = (option: string) => sheetRef.current?.close(() => onChange(option));
  const title = label.replace(/\s*\(opcional\)\s*$/i, "");

  return (
    <View style={styles.container}>
      {/* formularios.md §2: etiqueta visible siempre; «(opcional)» va en el texto de la etiqueta, sin asterisco. */}
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.selector, pressed && { opacity: 0.8 }]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}: ${value}` : label}
        accessibilityHint="Abre la lista para elegir"
      >
        <Text style={[styles.text, { color: value ? t.text.primary : t.text.muted }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={t.text.muted} />
      </Pressable>

      {open ? (
        <BottomSheet ref={sheetRef} title={title} onClose={close}>
          <View style={styles.body}>
            {options.length > 6 ? (
              <SearchField value={search} onChange={setSearch} placeholder="Buscar" accessibilityLabel={`Buscar en ${title}`} />
            ) : null}
            <View accessibilityRole="radiogroup">
              {filtered.length === 0 ? (
                <Text style={styles.empty}>{`No encontramos «${search.trim()}».`}</Text>
              ) : (
                filtered.map((option) => {
                  const selected = option === value;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => pick(option)}
                      style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && { opacity: 0.7 }]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Text style={[styles.optionText, selected && { color: t.brand.text, fontFamily: nativeFont("body", 600) }]}>{option}</Text>
                      {selected ? <Check size={18} strokeWidth={3} color={t.brand.text} /> : null}
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        </BottomSheet>
      ) : null}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { gap: 6 },
    label: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    selector: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      minHeight: 48,
      borderWidth: 1.5,
      borderRadius: radii.input,
      paddingHorizontal: 14,
      backgroundColor: t.mode === "dark" ? t.surface.muted : colors.slate[50],
      borderColor: t.border.default,
    },
    text: { flex: 1, fontSize: 15, fontFamily: nativeFont("body", 400) },
    body: { gap: spacing[3] },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[3],
      minHeight: 48,
      paddingHorizontal: spacing[3],
      borderRadius: 12,
    },
    optionSelected: { backgroundColor: t.brand.tint },
    optionText: { flex: 1, fontSize: 15, fontFamily: nativeFont("body", 400), color: t.text.primary },
    empty: { paddingVertical: spacing[4], textAlign: "center", fontSize: 14, fontFamily: nativeFont("body", 400), color: t.text.secondary },
  });
}
