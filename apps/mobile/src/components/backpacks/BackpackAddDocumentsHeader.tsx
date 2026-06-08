import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { SearchField, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface BackpackAddDocumentsHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
}

/** Search toolbar for add-documents flow (nav holds the primary title). */
export function BackpackAddDocumentsHeader({
  search,
  onSearchChange,
}: BackpackAddDocumentsHeaderProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.header}>
      <SearchField
        value={search}
        onChange={onSearchChange}
        placeholder="Buscar documentos..."
        accessibilityLabel="Buscar documentos para agregar"
      />
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    header: {
      paddingHorizontal: spacing[5],
      paddingBottom: spacing[3],
      backgroundColor: t.surface.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: t.border.medium,
    },
  });
}
