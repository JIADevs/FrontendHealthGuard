import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Eye, MoreVertical, Pencil, Share2, Trash2 } from "lucide-react-native";
import type { Document } from "@helu/api";
import { Chip, IconTile, PressableScale, fontSize, nativeFont, spacing, useAppTheme, useHighlight, type ThemeContextValue } from "@helu/ui";
import { AgendaRowActionsMenu, measureAgendaRowActionsMenuLeft } from "../agenda/AgendaRowActionsMenu";
import { useRecentlySaved } from "../../lib/recentlySaved";
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
 * «28 oct · Resultado», «⋯» of 44 px and, below, the document's tags as grey chips.
 */
export function DocumentRow({ document, onPress, actions }: { document: Document; onPress: () => void; actions: DocumentRowActions }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const category = CATEGORY_META[categoryOf(document)];
  const Icon = category.icon;
  const meta = `${documentDateLabel(document)} · ${category.label}`;

  const menuTriggerRef = useRef<ComponentRef<typeof View>>(null);
  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null);
  const openMenu = useCallback(() => {
    // Otherwise iOS gives the focus back to the search field when the menu closes.
    Keyboard.dismiss();
    menuTriggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenu({ top: y + height + spacing[1], left: measureAgendaRowActionsMenuLeft(x, width) });
    });
  }, []);

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
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${document.title}, ${meta}`}
        style={styles.card}
      >
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
          <View ref={menuTriggerRef} collapsable={false}>
            <Pressable onPress={openMenu} style={styles.menuButton} accessibilityRole="button" accessibilityLabel="Opciones del documento">
              <MoreVertical size={18} color={t.text.muted} />
            </Pressable>
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

      <AgendaRowActionsMenu
        visible={menu !== null}
        top={menu?.top ?? 0}
        left={menu?.left ?? 0}
        onClose={() => setMenu(null)}
        actions={[
          { icon: Eye, label: "Ver detalle", onPress: actions.onView },
          { icon: Share2, label: "Compartir", onPress: actions.onShare },
          { icon: Pencil, label: "Editar", onPress: actions.onEdit },
          { icon: Trash2, label: "Eliminar", onPress: actions.onDelete, destructive: true },
        ]}
      />
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
    menuButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  });
}
