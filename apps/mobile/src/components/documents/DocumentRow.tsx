import { useEffect, useMemo, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Backpack, Download, Ellipsis, ExternalLink, Eye, Pencil, Share2, Trash2 } from "lucide-react-native";
import type { Document } from "@helu/api";
import {
  ActionSheet,
  Chip,
  IconTile,
  PressableScale,
  SwipeRow,
  fontSize,
  nativeFont,
  spacing,
  useAppTheme,
  useHighlight,
  type ThemeContextValue,
} from "@helu/ui";
import { useRecentlySaved } from "../../lib/recentlySaved";
import { swipeHaptic } from "../../lib/haptics";
import { useDownloadDocument } from "../../hooks/useDownloadDocument";
import { AddToBackpackSheet } from "./AddToBackpackSheet";
import { CATEGORY_META, categoryOf } from "./documentCategories";
import { documentDateLabel } from "./utils/groupDocumentsByDate";

export interface DocumentRowActions {
  onView: () => void;
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
}

/**
 * Mockup «Documentos» (helper `ditem`): sky tile with the category icon, title on up to two lines,
 * «28 oct · Resultado» and, below, the document's tags as grey chips. Its actions go in the swipe
 * (MASTER §7, #127): «Más» + «Compartir» to the left, «A mochila» to the right.
 */
export function DocumentRow({
  document,
  onPress,
  actions,
  peek,
}: {
  document: Document;
  onPress: () => void;
  actions: DocumentRowActions;
  /** First-time discovery of the swipe (§4b «Descubrir») */
  peek?: boolean;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const category = CATEGORY_META[categoryOf(document)];
  const Icon = category.icon;
  const meta = `${documentDateLabel(document)} · ${category.label}`;

  const [sheet, setSheet] = useState(false);
  const [backpack, setBackpack] = useState(false);
  const { download } = useDownloadDocument();
  const isLink = document.kind === "LINK";
  const WHITE = { size: 22, strokeWidth: 2.2, color: t.text.onSolid };
  // Otherwise iOS gives the focus back to the search field when the sheet closes.
  const openSheet = () => {
    Keyboard.dismiss();
    setSheet(true);
  };

  // Just uploaded or edited: blue border that fades in 1.2 s (movimiento-interacciones.md §6).
  const justSaved = useRecentlySaved((s) => s.documentId === document.id);
  const highlight = useHighlight(justSaved);
  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => useRecentlySaved.getState().clearDocument(), 1300);
    return () => clearTimeout(timer);
  }, [justSaved]);

  return (
    <>
      <SwipeRow
        id={document.id}
        accessibilityLabel={`${document.title}, ${meta}`}
        onPress={onPress}
        endActions={[
          { key: "more", tone: "more", label: "Más", icon: <Ellipsis {...WHITE} />, onPress: openSheet },
          { key: "share", tone: "primary", label: "Compartir", icon: <Share2 {...WHITE} />, onPress: actions.onShare },
        ]}
        startAction={{ key: "backpack", tone: "positive", label: "A mochila", icon: <Backpack {...WHITE} />, onPress: () => setBackpack(true) }}
        onLongPress={openSheet}
        onHaptic={swipeHaptic}
        peek={peek}
      >
        <PressableScale onPress={onPress} accessible={false} style={styles.card}>
          <View style={styles.row}>
            <IconTile tone="document" icon={<Icon size={19} strokeWidth={2.2} color={t.accent.docFg} />} />
            <View style={styles.copy}>
              <Text style={styles.title} numberOfLines={2}>
                {document.title}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {meta}
              </Text>
            </View>
          </View>
          {document.customTags.length > 0 ? (
            <View style={styles.chips}>
              {document.customTags.map((tag) => (
                <Chip key={tag.id} label={tag.value} tone="neutral" />
              ))}
            </View>
          ) : null}
          <Animated.View pointerEvents="none" style={highlight} />
        </PressableScale>

      </SwipeRow>

      {sheet ? (
        <ActionSheet
          title={document.title}
          eyebrow={`${category.label} · ${documentDateLabel(document)}`.toUpperCase()}
          tone="document"
          icon={<Icon />}
          onClose={() => setSheet(false)}
          actions={[
            { key: "view", label: "Ver documento", icon: <Eye />, onPress: actions.onView },
            { key: "share", label: "Compartir", meta: "Enlace o QR", icon: <Share2 />, onPress: actions.onShare },
            { key: "backpack", label: "Agregar a una mochila", icon: <Backpack />, onPress: () => setBackpack(true) },
            { key: "edit", label: "Editar datos", icon: <Pencil />, onPress: actions.onEdit },
            isLink
              ? { key: "portal", label: "Abrir el portal", icon: <ExternalLink />, onPress: () => void download(document) }
              : { key: "download", label: "Descargar", icon: <Download />, onPress: () => void download(document) },
          ]}
          // Deleting a document is undone from the 5 s toast, without a modal (MASTER §7).
          destructive={[{ key: "delete", label: "Eliminar documento", meta: "Puedes deshacerlo durante 5 s", icon: <Trash2 />, onPress: actions.onDelete }]}
        />
      ) : null}
      {backpack ? <AddToBackpackSheet documentId={document.id} onClose={() => setBackpack(false)} /> : null}
    </>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    // Kit `.card.tight`
    card: {
      gap: 10,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    row: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  });
}
