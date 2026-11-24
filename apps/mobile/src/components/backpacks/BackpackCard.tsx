import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Backpack as BackpackIcon, Clock, Eye, FileText, MoreVertical, Pencil, Share2, Trash2 } from "lucide-react-native";
import type { Backpack } from "@helu/api";
import { Chip, IconTile, PressableScale, fontSize, nativeFont, spacing, useAppTheme, useHighlight, type ThemeContextValue } from "@helu/ui";
import { AgendaRowActionsMenu, measureAgendaRowActionsMenuLeft } from "../agenda/AgendaRowActionsMenu";
import { useRecentlySaved } from "../../lib/recentlySaved";
import { documentCountLabel } from "./backpackCopy";

export interface BackpackCardActions {
  onView: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Mockup «Mochilas» (helper `bp`): teal tile, name, the description on one line and a 44 px «⋯»;
 * below, grey «N documentos» and, for a temporary backpack, amber «Temporal» (#46, decision 3: no
 * expiry date until Compartir).
 */
export function BackpackCard({ backpack, onPress, actions }: { backpack: Backpack; onPress: () => void; actions: BackpackCardActions }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const count = backpack.documentCount ?? 0;

  const menuTriggerRef = useRef<ComponentRef<typeof View>>(null);
  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null);
  const openMenu = useCallback(() => {
    Keyboard.dismiss();
    menuTriggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenu({ top: y + height + spacing[1], left: measureAgendaRowActionsMenuLeft(x, width) });
    });
  }, []);

  // Just created or saved: blue border that fades in 1.2 s (movimiento-interacciones.md §6).
  const justSaved = useRecentlySaved((s) => s.backpackId === backpack.id);
  const highlight = useHighlight(justSaved);
  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => useRecentlySaved.getState().clearBackpack(), 1300);
    return () => clearTimeout(timer);
  }, [justSaved]);

  const temporary = backpack.type === "TEMPORARY_SHARE";

  return (
    <>
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${backpack.name}, ${documentCountLabel(count)}${temporary ? ", temporal" : ""}`}
        style={styles.card}
      >
        <View style={styles.row}>
          <IconTile tone="backpack" icon={<BackpackIcon size={19} strokeWidth={2.2} color={t.accent.backpackFg} />} />
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={1}>
              {backpack.name}
            </Text>
            {backpack.description ? (
              <Text style={styles.meta} numberOfLines={1}>
                {backpack.description}
              </Text>
            ) : null}
          </View>
          <View ref={menuTriggerRef} collapsable={false}>
            <Pressable onPress={openMenu} style={styles.menuButton} accessibilityRole="button" accessibilityLabel="Opciones de la mochila">
              <MoreVertical size={18} color={t.text.muted} />
            </Pressable>
          </View>
        </View>
        <View style={styles.chips}>
          <Chip label={documentCountLabel(count)} tone="neutral" icon={<FileText size={12} color={t.text.onMuted} />} />
          {temporary ? <Chip label="Temporal" tone="warning" icon={<Clock size={12} color={t.status.warningFg} />} /> : null}
        </View>
        <Animated.View pointerEvents="none" style={highlight} />
      </PressableScale>

      <AgendaRowActionsMenu
        visible={menu !== null}
        top={menu?.top ?? 0}
        left={menu?.left ?? 0}
        onClose={() => setMenu(null)}
        actions={[
          { icon: Eye, label: "Ver detalle", onPress: actions.onView },
          ...(count > 0 ? [{ icon: Share2, label: "Compartir", onPress: actions.onShare }] : []),
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
    title: { fontSize: 15, lineHeight: 20, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    menuButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  });
}
