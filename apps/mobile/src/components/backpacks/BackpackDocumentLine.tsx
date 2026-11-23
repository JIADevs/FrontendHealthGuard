import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";
import type { Document } from "@helu/api";
import { IconTile, fontSize, nativeFont, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";
import { CATEGORY_META, categoryOf } from "../documents/documentCategories";
import { documentDateLabel } from "../documents/utils/groupDocumentsByDate";

/**
 * A document inside the «Contenido» card (helper `dline` / `row` with `rmBtn`): category tile, title,
 * «28 oct · Orden», and a 44 px «×» labelled «Quitar de la mochila». Tapping the row opens it.
 */
export function BackpackDocumentLine({
  document,
  onPress,
  onRemove,
}: {
  document: Document;
  onPress: () => void;
  onRemove: () => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const category = CATEGORY_META[categoryOf(document)];
  const Icon = category.icon;
  const meta = `${documentDateLabel(document)} · ${category.label}`;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.main, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel={`${document.title}, ${meta}`}
      >
        <IconTile tone="document" icon={<Icon size={19} strokeWidth={2.2} color={t.accent.docFg} />} />
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={2}>
            {document.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onRemove}
        style={({ pressed }) => [styles.remove, pressed && { backgroundColor: t.surface.muted }]}
        accessibilityRole="button"
        accessibilityLabel={`Quitar ${document.title} de la mochila`}
      >
        <X size={18} color={t.text.muted} />
      </Pressable>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: spacing[1], paddingVertical: 6 },
    main: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing[3], minHeight: 44 },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    remove: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  });
}
