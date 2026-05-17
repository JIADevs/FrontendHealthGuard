import { useMemo } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Filter } from "lucide-react-native";
import { SearchField, spacing, radii, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface DocumentsSearchToolbarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterPress: () => void;
  filterActive?: boolean;
}

export function DocumentsSearchToolbar({
  value,
  onChange,
  onFilterPress,
  filterActive = false,
}: DocumentsSearchToolbarProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t, filterActive), [t, filterActive]);

  return (
    <View style={styles.row}>
      <View style={styles.searchWrap}>
        <SearchField
          value={value}
          onChange={onChange}
          placeholder="Buscar por nombre o etiqueta..."
          accessibilityLabel="Buscar documentos"
        />
      </View>
      <TouchableOpacity
        style={styles.filterBtn}
        onPress={onFilterPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Abrir filtros de documentos"
        accessibilityState={{ selected: filterActive }}
      >
        <Filter size={20} color={filterActive ? t.brand.fg : t.text.secondary} />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(t: ThemeContextValue, filterActive: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      marginTop: spacing[4],
    },
    searchWrap: {
      flex: 1,
    },
    filterBtn: {
      width: 44,
      height: 44,
      borderRadius: radii.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: filterActive ? t.brand.tint : t.border.light,
      borderWidth: 1,
      borderColor: filterActive ? t.brand.tintBorder : t.border.medium,
    },
  });
}
