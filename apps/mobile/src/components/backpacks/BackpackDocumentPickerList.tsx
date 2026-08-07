import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Check, Plus } from "lucide-react-native";
import type { Document } from "@helu/api";
import {
  Button,
  Checkbox,
  DocumentTypeIcon,
  EmptyState,
  Spinner,
  Typography,
  colors,
  formatDate,
  spacing,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { DocumentCategoryIcon } from "../documents/DocumentCategoryIcon";
import { resolveDocumentTheme } from "../documents/utils/resolveDocumentTheme";
import { formatShortDate } from "@helu/ui";

export type BackpackDocumentPickerMode = "add" | "check";

export interface BackpackDocumentPickerListProps {
  mode: BackpackDocumentPickerMode;
  documents: Document[];
  loading?: boolean;
  isRefetching?: boolean;
  onRefresh?: () => void;
  emptyMessage?: string;
  onDocumentPress?: (doc: Document) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  /**
   * When true, render rows with `.map` instead of FlatList.
   * Required when this list sits inside a parent vertical ScrollView
   * (RN forbids nested VirtualizedLists with the same orientation).
   */
  embedded?: boolean;
  /** add mode */
  addingIds?: Record<string, "loading" | "done">;
  onAdd?: (doc: Document) => void;
  /** check mode */
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
}

export function BackpackDocumentPickerList({
  mode,
  documents,
  loading = false,
  isRefetching = false,
  onRefresh,
  emptyMessage = "No hay documentos disponibles.",
  onDocumentPress,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  embedded = false,
  addingIds = {},
  onAdd,
  selectedIds,
  onToggle,
}: BackpackDocumentPickerListProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) onLoadMore?.();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  const renderAddRow = useCallback(
    (item: Document) => (
      <View key={item.id} style={styles.cardRow}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => onDocumentPress?.(item)}
          accessibilityLabel={`Abrir documento ${item.title}`}
        >
          <DocumentTypeIcon format={item.format} documentTypeName={item.documentType?.name} size={24} />
          <View style={styles.cardInfo}>
            <Typography variant="label" numberOfLines={1}>
              {item.title}
            </Typography>
            <Typography variant="caption" color="secondary">
              {formatDate(item.uploadedAt)}
              {item.documentType?.name ? ` • ${item.documentType.name}` : ""}
            </Typography>
          </View>
        </TouchableOpacity>
        <AddButton item={item} addingIds={addingIds} onAdd={onAdd} />
      </View>
    ),
    [addingIds, onAdd, onDocumentPress, styles],
  );

  const renderCheckRow = useCallback(
    (item: Document) => {
      const checked = selectedIds?.has(item.id) ?? false;
      const category = resolveDocumentTheme(item, t);
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.checkRow, checked && styles.checkRowSelected]}
          onPress={() => onToggle?.(item.id)}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
        >
          <View pointerEvents="none">
            <Checkbox checked={checked} onChange={() => {}} />
          </View>
          <DocumentCategoryIcon theme={category} format={item.format} size={18} />
          <View style={styles.cardInfo}>
            <Typography variant="label" numberOfLines={1}>
              {item.title}
            </Typography>
            <Typography variant="caption" color="secondary">
              {formatShortDate(item.documentDate ?? item.uploadedAt)}
            </Typography>
          </View>
        </TouchableOpacity>
      );
    },
    [onToggle, selectedIds, styles, t],
  );

  const listFooter = useMemo(() => {
    if (isFetchingNextPage) {
      return <ActivityIndicator style={styles.footerLoader} color={t.brand.fg} />;
    }
    if (hasNextPage && onLoadMore) {
      return (
        <View style={styles.loadMoreWrap}>
          <Button variant="secondary" fullWidth onPress={onLoadMore}>
            Cargar más
          </Button>
        </View>
      );
    }
    return null;
  }, [hasNextPage, isFetchingNextPage, onLoadMore, styles, t.brand.fg]);

  if (loading && documents.length === 0) {
    return (
      <View style={styles.center}>
        <Spinner size="lg" />
      </View>
    );
  }

  // Embedded: parent ScrollView owns scrolling — never nest a FlatList here.
  if (embedded) {
    return (
      <View style={styles.embeddedList}>
        {documents.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          documents.map((item) => (mode === "add" ? renderAddRow(item) : renderCheckRow(item)))
        )}
        {listFooter}
      </View>
    );
  }

  return (
    <FlatList
      data={documents}
      keyExtractor={(d) => d.id}
      renderItem={({ item }) => (mode === "add" ? renderAddRow(item) : renderCheckRow(item))}
      contentContainerStyle={styles.list}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            colors={[t.brand.fg]}
            tintColor={t.brand.fg}
          />
        ) : undefined
      }
      ListEmptyComponent={<EmptyState message={emptyMessage} />}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      ListFooterComponent={listFooter}
    />
  );
}

function AddButton({
  item,
  addingIds,
  onAdd,
}: {
  item: Document;
  addingIds: Record<string, "loading" | "done">;
  onAdd?: (doc: Document) => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const state = addingIds[item.id];

  let icon: React.ReactNode;
  if (state === "loading") {
    icon = <ActivityIndicator size="small" color={colors.white} />;
  } else if (state === "done") {
    icon = <Check size={18} color={colors.white} />;
  } else {
    icon = <Plus size={18} color={colors.white} />;
  }

  return (
    <TouchableOpacity
      style={[
        styles.addBtn,
        state === "loading" && styles.addBtnLoading,
        state === "done" && styles.addBtnDone,
      ]}
      onPress={() => onAdd?.(item)}
      disabled={!!state}
      accessibilityLabel={`Agregar ${item.title} a la mochila`}
    >
      {icon}
    </TouchableOpacity>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing[6],
    },
    list: {
      padding: spacing[4],
      gap: spacing[3],
      paddingBottom: spacing[10],
      flexGrow: 1,
    },
    embeddedList: {
      minHeight: 120,
    },
    cardRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      marginBottom: spacing[3],
    },
    card: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: spacing[3],
      backgroundColor: t.surface.bgCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border.medium,
    },
    cardInfo: {
      flex: 1,
    },
    addBtn: {
      backgroundColor: t.brand.fg,
      borderRadius: 16,
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    addBtnLoading: { opacity: 0.7 },
    addBtnDone: { backgroundColor: t.accent.docFg },
    checkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: spacing[3],
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border.light,
      backgroundColor: t.surface.bgCard,
      marginBottom: spacing[2],
    },
    checkRowSelected: {
      borderColor: t.brand.tintBorder,
      backgroundColor: t.brand.tint,
    },
    footerLoader: {
      marginVertical: spacing[4],
    },
    loadMoreWrap: {
      marginTop: spacing[2],
      marginBottom: spacing[4],
    },
  });
}
