import { useMemo } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, Text } from "react-native";
import {
  spacing,
  radii,
  fontSize,
  fontWeight,
  useAppTheme,
  getDocumentFilterLabel,
  DOCUMENT_QUICK_FILTER_KEYS,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { DocumentsFilterChip } from "./DocumentsFilterChip";
import type { DocumentCategoryFilter } from "./utils/documentListFilters";

interface DocumentsFilterChipsProps {
  selected: DocumentCategoryFilter;
  onSelect: (key: DocumentCategoryFilter) => void;
  onMorePress: () => void;
  /** Si el filtro activo no está en la barra rápida, mostrar indicador en "..." */
  hasHiddenSelection?: boolean;
}

export function DocumentsFilterChips({
  selected,
  onSelect,
  onMorePress,
  hasHiddenSelection = false,
}: DocumentsFilterChipsProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const quickKeys = DOCUMENT_QUICK_FILTER_KEYS;
  const showMoreActive = hasHiddenSelection && selected !== null && !quickKeys.includes(selected);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.scroll}
    >
      {quickKeys.map((key) => (
        <DocumentsFilterChip
          key={key ?? "all"}
          label={getDocumentFilterLabel(key)}
          selected={selected === key}
          onPress={() => onSelect(key)}
        />
      ))}

      <TouchableOpacity
        style={[styles.moreChip, showMoreActive && styles.moreChipActive]}
        onPress={onMorePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Más categorías de filtro"
      >
        <Text style={[styles.moreText, showMoreActive && styles.moreTextActive]}>···</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    scroll: {
      marginTop: spacing[3],
      flexGrow: 0,
    },
    content: {
      gap: spacing[2],
      paddingRight: spacing[5],
      alignItems: "center",
    },
    moreChip: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
      minWidth: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    moreChipActive: {
      borderColor: t.brand.fg,
      backgroundColor: t.brand.tint,
    },
    moreText: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: t.text.secondary,
      letterSpacing: 2,
      lineHeight: 20,
    },
    moreTextActive: {
      color: t.brand.fg,
    },
  });
}
