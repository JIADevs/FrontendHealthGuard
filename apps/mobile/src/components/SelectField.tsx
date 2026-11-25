import { useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";
import {
  BottomSheet,
  FieldError,
  IconTile,
  SearchField,
  colors,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  type BottomSheetHandle,
  type ThemeContextValue,
} from "@helu/ui";

/**
 * A plain string is its own value; server lists pass `{ value: id, label: name }`. With `icon` (and
 * an optional `description`) the sheet draws each option as a row with a gray icon tile, the help
 * line and a radio (mockup 13 «1B»).
 */
export type SelectFieldOption = string | { value: string; label: string; icon?: ReactNode; description?: string };

interface SelectFieldProps {
  label: string;
  value?: string;
  placeholder: string;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  required?: boolean;
  /** Shown under the field, with a red border (formularios.md §6). */
  error?: string;
  /** Sheet title when it should say more than the label: «Tipo de documento». */
  sheetTitle?: string;
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
export function SelectField({ label, value, placeholder, options: rawOptions, onChange, error, sheetTitle }: SelectFieldProps) {
  const t = useAppTheme();
  const options = useMemo(
    () =>
      rawOptions.map((o): { value: string; label: string; icon?: ReactNode; description?: string } =>
        typeof o === "string" ? { value: o, label: o } : o,
      ),
    [rawOptions],
  );
  const rich = options.some((o) => o.icon);
  const selectedLabel = options.find((o) => o.value === value)?.label;
  const styles = useMemo(() => makeStyles(t), [t]);
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = fold(search.trim());
    return q ? options.filter((opt) => fold(opt.label).includes(q)) : options;
  }, [options, search]);

  const close = () => {
    setOpen(false);
    setSearch("");
  };
  const pick = (option: string) => sheetRef.current?.close(() => onChange(option));
  const title = sheetTitle ?? label.replace(/\s*\(opcional\)\s*$/i, "");

  return (
    <View style={styles.container}>
      {/* formularios.md §2: etiqueta visible siempre; «(opcional)» va en el texto de la etiqueta, sin asterisco. */}
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.selector, error ? { borderColor: t.status.dangerSolid } : null, pressed && { opacity: 0.8 }]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={selectedLabel ? `${label}: ${selectedLabel}` : label}
        accessibilityHint="Abre la lista para elegir"
      >
        <Text style={[styles.text, { color: selectedLabel ? t.text.primary : t.text.muted }]} numberOfLines={1}>
          {selectedLabel || placeholder}
        </Text>
        <ChevronDown size={18} color={t.text.muted} />
      </Pressable>
      <FieldError message={error} />

      {open ? (
        <BottomSheet ref={sheetRef} title={title} onClose={close}>
          <View style={styles.body}>
            {/* Up to 8 options are all in view (formularios.md §4); more get a search box. */}
            {options.length > 8 ? (
              <SearchField value={search} onChange={setSearch} placeholder="Buscar" accessibilityLabel={`Buscar en ${title}`} />
            ) : null}
            <View accessibilityRole="radiogroup" style={rich ? { gap: 4 } : undefined}>
              {filtered.length === 0 ? (
                <Text style={styles.empty}>{`No encontramos «${search.trim()}».`}</Text>
              ) : (
                filtered.map((option) => {
                  const selected = option.value === value;
                  if (rich) {
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => pick(option.value)}
                        style={({ pressed }) => [styles.richOption, selected && styles.optionSelected, pressed && { opacity: 0.7 }]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={option.description ? `${option.label}, ${option.description}` : option.label}
                      >
                        {option.icon ? <IconTile icon={option.icon} /> : <View style={styles.tileSpace} />}
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={[styles.richTitle, { color: t.text.primary }]}>{option.label}</Text>
                          {option.description ? <Text style={[styles.richHint, { color: t.text.secondary }]}>{option.description}</Text> : null}
                        </View>
                        <View style={[styles.radio, { borderColor: selected ? t.brand.solid : t.border.default }]}>
                          {selected ? <View style={[styles.radioDot, { backgroundColor: t.brand.solid }]} /> : null}
                        </View>
                      </Pressable>
                    );
                  }
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => pick(option.value)}
                      style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && { opacity: 0.7 }]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Text style={[styles.optionText, selected && { color: t.brand.text, fontFamily: nativeFont("body", 600) }]}>{option.label}</Text>
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
    // Mockup 13 «1B»: icon tile, label and help line, radio.
    richOption: { flexDirection: "row", alignItems: "center", gap: spacing[3], minHeight: 56, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 14 },
    tileSpace: { width: 40 },
    richTitle: { fontSize: 15, fontFamily: nativeFont("body", 600) },
    richHint: { fontSize: 13, fontFamily: nativeFont("body", 400) },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    radioDot: { width: 12, height: 12, borderRadius: 6 },
    optionText: { flex: 1, fontSize: 15, fontFamily: nativeFont("body", 400), color: t.text.primary },
    empty: { paddingVertical: spacing[4], textAlign: "center", fontSize: 14, fontFamily: nativeFont("body", 400), color: t.text.secondary },
  });
}
