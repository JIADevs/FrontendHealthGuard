import { useMemo } from "react";
import { Keyboard, Pressable, StyleSheet, View } from "react-native";
import { Filter } from "lucide-react-native";
import {
  SearchField,
  radii,
  spacing,
  useAppTheme,
  type ThemeContextValue,
} from "@helu/ui";

export interface AgendaListToolbarProps {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  /** What the list holds, for the accessible labels («medicamentos», «citas»). */
  noun: string;
  hasActiveFilter: boolean;
  onOpenFilters: () => void;
}

/**
 * Search + filter button over Citas and Medicamentos (mockup `m2-agenda.js`): the button is the kit
 * `iconbtn` (white, 1 px border, 46 × 46, radius 14) and turns brand tint while a filter is on —
 * the same toolbar as Documentos.
 */
export function AgendaListToolbar({
  search,
  onSearch,
  placeholder,
  noun,
  hasActiveFilter,
  onOpenFilters,
}: AgendaListToolbarProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.toolbar}>
      <View style={styles.searchWrap}>
        <SearchField
          value={search}
          onChange={onSearch}
          placeholder={placeholder}
          accessibilityLabel={`Buscar ${noun}`}
        />
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.filterBtn,
          hasActiveFilter && styles.filterBtnActive,
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => {
          Keyboard.dismiss();
          onOpenFilters();
        }}
        accessibilityRole="button"
        accessibilityLabel={
          hasActiveFilter
            ? `Filtros de ${noun}, hay filtros activos`
            : `Filtros de ${noun}`
        }
      >
        <Filter
          size={18}
          color={hasActiveFilter ? t.brand.text : t.text.onMuted}
        />
      </Pressable>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    toolbar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      paddingHorizontal: spacing[4],
      paddingTop: spacing[3],
    },
    searchWrap: { flex: 1 },
    filterBtn: {
      width: 46,
      height: 46,
      borderRadius: radii.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.surface.bgCard,
      borderWidth: 1,
      borderColor: t.border.default,
    },
    filterBtnActive: {
      backgroundColor: t.brand.tint,
      borderColor: t.brand.tintBorder,
    },
  });
}
