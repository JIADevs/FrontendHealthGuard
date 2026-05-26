import { useMemo, useRef, useState, useCallback } from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { MoreVertical } from "lucide-react-native";
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
import {
  DocumentQuickActionsMenu,
  measureQuickActionsMenuLeft,
} from "./DocumentQuickActionsMenu";

export interface DocumentListItemActions {
  onView: () => void;
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
  shareLoading?: boolean;
}

interface DocumentListItemProps {
  document: Document;
  onPress: () => void;
  actions: DocumentListItemActions;
}

export function DocumentListItem({ document, onPress, actions }: DocumentListItemProps) {
  const t = useAppTheme();
  const category = useMemo(() => resolveDocumentTheme(document, t), [document, t]);
  const styles = useMemo(() => makeStyles(t), [t]);

  const menuTriggerRef = useRef<View>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const [menuLeft, setMenuLeft] = useState(0);

  const dateStr = document.documentDate ?? document.uploadedAt;
  const meta = `${formatShortDate(dateStr)} · ${formatFileSize(document.fileSizeBytes)}`;

  const openMenu = useCallback(() => {
    menuTriggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuTop(y + height + spacing[1]);
      setMenuLeft(measureQuickActionsMenuLeft(x, width));
      setMenuVisible(true);
    });
  }, []);

  const closeMenu = useCallback(() => setMenuVisible(false), []);

  const runAction = useCallback(
    (action: () => void) => {
      closeMenu();
      action();
    },
    [closeMenu],
  );

  return (
    <>
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
        </TouchableOpacity>

        <View ref={menuTriggerRef} collapsable={false}>
          <TouchableOpacity
            onPress={openMenu}
            style={styles.menuButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Opciones de ${document.title}`}
          >
            <MoreVertical size={20} color={t.text.muted} />
          </TouchableOpacity>
        </View>
      </View>

      <DocumentQuickActionsMenu
        visible={menuVisible}
        top={menuTop}
        left={menuLeft}
        onClose={closeMenu}
        onView={() => runAction(actions.onView)}
        onEdit={() => runAction(actions.onEdit)}
        onShare={() => runAction(actions.onShare)}
        onDelete={() => runAction(actions.onDelete)}
        shareLoading={actions.shareLoading}
      />
    </>
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
    mainPress: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
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
    menuButton: {
      padding: spacing[1],
    },
  });
}
