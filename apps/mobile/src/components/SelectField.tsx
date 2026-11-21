import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { useState, useMemo } from "react";
import { colors, nativeFont, radii, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { ChevronDown, ChevronUp, Search } from "lucide-react-native";

interface SelectFieldProps {
  label: string;
  value?: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
  required?: boolean;
}

export function SelectField({ label, value, placeholder, options, onChange, required }: SelectFieldProps) {
  const t = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter(opt =>
      opt.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <View style={styles.container}>
      {/* formularios.md §2: etiqueta visible siempre; «(opcional)» va en el texto de la etiqueta, sin asterisco. */}
      <Text style={[styles.label, { color: t.text.primary }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.selector,
          {
            backgroundColor: isOpen ? t.surface.bgCard : t.mode === "dark" ? t.surface.muted : colors.slate[50],
            borderColor: isOpen ? t.brand.focus : t.border.default,
          },
        ]}
        onPress={() => setIsOpen(!isOpen)}
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}: ${value}` : label}
        accessibilityState={{ expanded: isOpen }}
      >
        <Text style={[styles.text, { color: value ? t.text.primary : t.text.muted }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        {isOpen ? (
          <ChevronUp size={18} color={t.text.muted} />
        ) : (
          <ChevronDown size={18} color={t.text.muted} />
        )}
      </TouchableOpacity>

      {isOpen && (
        <View style={[styles.dropdown, { backgroundColor: t.surface.bgCard, borderColor: t.border.medium }]}>
          <View style={[styles.searchContainer, { borderBottomColor: t.border.light }]}>
            <Search size={16} color={t.text.muted} />
            <TextInput
              style={[styles.searchInput, { color: t.text.primary }]}
              placeholder="Buscar..."
              placeholderTextColor={t.text.muted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <ScrollView style={styles.optionsList} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {filteredOptions.length === 0 ? (
              <Text style={[styles.emptyText, { color: t.text.muted }]}>
                No se encontraron resultados
              </Text>
            ) : (
              filteredOptions.map((item: string) => (
                <TouchableOpacity
                  key={item}
                  style={styles.option}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[styles.optionText, { color: t.text.primary }]}>{item}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: nativeFont("heading", 800),
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    minHeight: 48,
    borderWidth: 1.5,
    borderRadius: radii.input,
    paddingHorizontal: 14,
  },
  text: {
    flex: 1,
    fontSize: 15,
    fontFamily: nativeFont("body", 400),
  },
  dropdown: {
    borderWidth: 1.5,
    borderRadius: radii.input,
    marginTop: spacing[1],
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  optionsList: {
    maxHeight: 200,
  },
  option: {
    padding: spacing[3],
  },
  optionText: {
    fontSize: 16,
  },
  emptyText: {
    padding: spacing[4],
    textAlign: "center",
  },
});
