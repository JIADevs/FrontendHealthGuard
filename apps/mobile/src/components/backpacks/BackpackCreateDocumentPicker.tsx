import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Document } from "@helu/api";
import {
  SearchField,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { BackpackDocumentPickerList } from "./BackpackDocumentPickerList";

interface BackpackCreateDocumentPickerProps {
  documents: Document[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  loading?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export function BackpackCreateDocumentPicker({
  documents,
  selectedIds,
  onToggle,
  loading = false,
  search,
  onSearchChange,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
}: BackpackCreateDocumentPickerProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const selectedCount = selectedIds.size;

  const emptyMessage = search.trim()
    ? "Sin resultados para tu búsqueda."
    : "No tienes documentos disponibles para agregar.";

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>SELECCIONAR DOCUMENTOS</Text>

      <SearchField
        value={search}
        onChange={onSearchChange}
        placeholder="Buscar documentos..."
        accessibilityLabel="Buscar documentos para la mochila"
      />

      <BackpackDocumentPickerList
        mode="check"
        embedded
        documents={documents}
        selectedIds={selectedIds}
        onToggle={onToggle}
        loading={loading}
        emptyMessage={emptyMessage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={onLoadMore}
      />

      <Text style={styles.counter}>
        {selectedCount} de {documents.length} seleccionados
      </Text>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    section: {
      gap: spacing[3],
      minHeight: 200,
    },
    sectionLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
      letterSpacing: 0.6,
    },
    counter: {
      fontSize: fontSize.sm,
      color: t.text.secondary,
      textAlign: "center",
      marginTop: spacing[2],
    },
  });
}
