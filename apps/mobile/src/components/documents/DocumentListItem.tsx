import { useMemo } from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { ChevronRight, MoreVertical } from "lucide-react-native";
import type { Document } from "@helu/api";
import {
  Typography,
  spacing,
  radii,
  shadows,
  formatShortDate,
  formatFileSize,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { DocumentCategoryIcon } from "./DocumentCategoryIcon";
import { DocumentCategoryTag } from "./DocumentCategoryTag";
import { resolveDocumentTheme } from "./utils/resolveDocumentTheme";

interface DocumentListItemProps {
  document: Document;
  onPress: () => void;
  onMenuPress?: () => void;
  showMenu?: boolean;
}

export function DocumentListItem({
  document,
  onPress,
  onMenuPress,
  showMenu = false,
}: DocumentListItemProps) {
  const t = useAppTheme();
  const category = useMemo(() => resolveDocumentTheme(document), [document]);
  const styles = useMemo(() => makeStyles(t), [t]);

  const dateStr = document.documentDate ?? document.uploadedAt;
  const meta = `${formatShortDate(dateStr)} · ${formatFileSize(document.fileSizeBytes)}`;

  return (
    <TouchableOpacity
      style={styles.card}
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

      {showMenu && onMenuPress ? (
        <TouchableOpacity
          onPress={onMenuPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Opciones de ${document.title}`}
        >
          <MoreVertical size={20} color={t.text.muted} />
        </TouchableOpacity>
      ) : (
        <ChevronRight size={20} color={t.text.muted} />
      )}
    </TouchableOpacity>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      marginHorizontal: spacing[5],
      marginBottom: spacing[3],
      padding: spacing[4],
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.light,
      ...shadows.sm,
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
  });
}
