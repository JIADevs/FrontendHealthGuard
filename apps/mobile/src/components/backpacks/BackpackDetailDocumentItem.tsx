import { useMemo } from "react";
import { View, TouchableOpacity, StyleSheet, Text, ActivityIndicator } from "react-native";
import { ChevronRight, X } from "lucide-react-native";
import type { Document } from "@helu/api";
import {
  Typography,
  spacing,
  radii,
  formatShortDate,
  formatFileSize,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { DocumentCategoryIcon } from "../documents/DocumentCategoryIcon";
import { DocumentCategoryTag } from "../documents/DocumentCategoryTag";
import { resolveDocumentTheme } from "../documents/utils/resolveDocumentTheme";

interface BackpackDetailDocumentItemProps {
  document: Document;
  onPress: () => void;
  onRemove?: () => void;
  isRemoving?: boolean;
}

export function BackpackDetailDocumentItem({
  document,
  onPress,
  onRemove,
  isRemoving = false,
}: BackpackDetailDocumentItemProps) {
  const t = useAppTheme();
  const category = useMemo(() => resolveDocumentTheme(document, t), [document, t]);
  const styles = useMemo(() => makeStyles(t), [t]);

  const dateStr = document.documentDate ?? document.uploadedAt;
  const meta = `${formatShortDate(dateStr)} · ${formatFileSize(document.fileSizeBytes)}`;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.mainPress}
        onPress={onPress}
        activeOpacity={0.65}
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${document.title}`}
      >
        <DocumentCategoryIcon theme={category} format={document.format} />

        <View style={styles.content}>
          <Typography variant="body" numberOfLines={1}>
            {document.title}
          </Typography>
          <View style={styles.metaRow}>
            <DocumentCategoryTag theme={category} />
            <Text style={styles.metaText}>{meta}</Text>
          </View>
        </View>

        <ChevronRight size={20} color={t.text.muted} />
      </TouchableOpacity>

      {onRemove ? (
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={onRemove}
          disabled={isRemoving}
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${document.title} de la mochila`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color={t.text.muted} />
          ) : (
            <X size={18} color={t.text.muted} />
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.light,
      overflow: "hidden",
    },
    mainPress: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: spacing[4],
    },
    content: {
      flex: 1,
      gap: spacing[2],
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing[2],
    },
    metaText: {
      fontSize: 12,
      color: t.text.secondary,
    },
    removeBtn: {
      padding: spacing[3],
      borderLeftWidth: 1,
      borderLeftColor: t.border.light,
    },
  });
}
