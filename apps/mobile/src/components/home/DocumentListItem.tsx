import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FileText } from "lucide-react-native";
import {
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  formatDate,
  formatFileKind,
  isLinkDocument,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { Document } from "@helu/api";

// ─── Props ───────────────────────────────────────────────────────────────────

interface DocumentListItemProps {
  document: Document;
  onPress: () => void;
  isLast?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DocumentListItem({ document, onPress, isLast }: DocumentListItemProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const kindLabel = isLinkDocument(document.kind)
    ? "Enlace"
    : formatFileKind(document.format);

  return (
    <TouchableOpacity
      style={[styles.item, !isLast && styles.itemBorder]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: t.accent.docBg }]}>
        <FileText size={18} color={t.accent.docFg} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: t.text.primary }]} numberOfLines={1}>
          {document.title}
        </Text>
        <Text style={[styles.subtitle, { color: t.text.secondary }]}>
          {formatDate(document.uploadedAt)}
        </Text>
      </View>
      <View style={[styles.formatBadge, { backgroundColor: t.accent.docBg }]}>
        <Text style={[styles.formatText, { color: t.accent.docFg }]}>
          {kindLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[1],
    },
    itemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: t.border.light,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
    },
    info: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.bold,
    },
    subtitle: {
      fontSize: fontSize.sm,
    },
    formatBadge: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderRadius: radii.sm,
      alignSelf: "flex-start",
      marginTop: spacing[1],
    },
    formatText: {
      fontSize: 10,
      fontWeight: fontWeight.bold,
      textTransform: "uppercase" as const,
    },
  });
}
