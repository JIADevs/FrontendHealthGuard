import { useEffect, useMemo, useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Backpack as BackpackIcon, Clock, Ellipsis, Eye, FileText, Pencil, Plus, QrCode, Share2, Trash2 } from "lucide-react-native";
import type { Backpack } from "@helu/api";
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
import { documentCountLabel } from "./backpackCopy";

export interface BackpackCardActions {
  onView: () => void;
  onShare: () => void;
  onEdit: () => void;
  onAddDocuments: () => void;
  onDelete: () => void;
}

/**
 * Mockup «Mochilas» (helper `bp`): teal tile, name and the description on one line; below, grey
 * «N documentos» and, for a temporary backpack, amber «Temporal» (#46, decision 3: no expiry date
 * until Compartir). Its actions go in the swipe (MASTER §7, #127): «Más» + «Compartir» to the left
 * («Agregar documentos» while it is empty, since an empty backpack has nothing to share); nothing
 * to the right.
 */
export function BackpackCard({ backpack, onPress, actions }: { backpack: Backpack; onPress: () => void; actions: BackpackCardActions }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const count = backpack.documentCount ?? 0;

  const [sheet, setSheet] = useState(false);
  const WHITE = { size: 22, strokeWidth: 2.2, color: t.text.onSolid };
  // Otherwise iOS gives the focus back to the search field when the sheet closes.
  const openSheet = () => {
    Keyboard.dismiss();
    setSheet(true);
  };

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
      <SwipeRow
        id={backpack.id}
        accessibilityLabel={`${backpack.name}, ${documentCountLabel(count)}${temporary ? ", temporal" : ""}`}
        onPress={onPress}
        endActions={[
          { key: "more", tone: "more", label: "Más", icon: <Ellipsis {...WHITE} />, onPress: openSheet },
          count > 0
            ? { key: "share", tone: "primary", label: "Compartir", icon: <Share2 {...WHITE} />, onPress: actions.onShare }
            : { key: "add", tone: "primary", label: "Agregar", icon: <Plus {...WHITE} />, onPress: actions.onAddDocuments },
        ]}
        onLongPress={openSheet}
        onHaptic={swipeHaptic}
      >
        <PressableScale onPress={onPress} accessible={false} style={styles.card}>
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
          </View>
          <View style={styles.chips}>
            <Chip label={documentCountLabel(count)} tone="neutral" icon={<FileText size={12} color={t.text.onMuted} />} />
            {temporary ? <Chip label="Temporal" tone="warning" icon={<Clock size={12} color={t.status.warningFg} />} /> : null}
          </View>
          <Animated.View pointerEvents="none" style={highlight} />
        </PressableScale>

      </SwipeRow>

      {sheet ? (
        <ActionSheet
          title={backpack.name}
          eyebrow={`Mochila · ${documentCountLabel(count)}`.toUpperCase()}
          tone="backpack"
          icon={<BackpackIcon />}
          onClose={() => setSheet(false)}
          actions={[
            { key: "view", label: "Ver mochila", icon: <Eye />, onPress: actions.onView },
            ...(count > 0 ? [{ key: "share", label: "Compartir con QR", icon: <QrCode />, onPress: actions.onShare }] : []),
            { key: "add", label: "Agregar documentos", icon: <Plus />, onPress: actions.onAddDocuments },
            { key: "edit", label: "Editar nombre", icon: <Pencil />, onPress: actions.onEdit },
          ]}
          destructive={[{ key: "delete", label: "Eliminar mochila", meta: "Tus documentos no se borran", icon: <Trash2 />, onPress: actions.onDelete }]}
        />
      ) : null}
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
  });
}
