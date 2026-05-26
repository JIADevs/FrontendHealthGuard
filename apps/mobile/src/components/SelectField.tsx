import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from "react-native";
import { useState, useMemo } from "react";
import { spacing, useAppTheme } from "@helu/ui";
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
      <Text style={[styles.label, { color: t.text.primary }]}>
        {label} {required && "*"}
      </Text>
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: t.surface.bgCard, borderColor: t.border.medium }]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[styles.text, { color: value ? t.text.primary : t.text.muted }]}>
          {value || placeholder}
        </Text>
        {isOpen ? (
          <ChevronUp size={20} color={t.text.secondary} />
        ) : (
          <ChevronDown size={20} color={t.text.secondary} />
        )}
      </TouchableOpacity>

      {isOpen && (
        <View style={[styles.dropdown, { backgroundColor: t.surface.bgCard, borderColor: t.border.medium }]}>
          <View style={[styles.searchContainer, { borderBottomColor: t.border.light }]}>
            <Search size={16} color={t.text.tertiary} />
            <TextInput
              style={[styles.searchInput, { color: t.text.primary }]}
              placeholder="Buscar..."
              placeholderTextColor={t.text.tertiary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item}
            renderItem={({ item }: { item: string }) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleSelect(item)}
              >
                <Text style={[styles.optionText, { color: t.text.primary }]}>{item}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: t.text.muted }]}>
                No se encontraron resultados
              </Text>
            }
            style={styles.optionsList}
            nestedScrollEnabled
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  text: {
    fontSize: 16,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
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
