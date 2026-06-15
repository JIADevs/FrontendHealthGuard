import { useMemo, useRef, useState, useCallback } from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { Backpack as BackpackIcon, MoreVertical } from "lucide-react-native";
import type { Backpack } from "@helu/api";
import {
  Typography,
  spacing,
  radii,
  shadows,
  palette,
  formatShortDate,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  BackpackQuickActionsMenu,
  measureBackpackQuickActionsMenuLeft,
} from "./BackpackQuickActionsMenu";

export interface BackpackListItemActions {
  onView: () => void;
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
  shareLoading?: boolean;
}

interface BackpackListItemProps {
  backpack: Backpack;
  onPress: () => void;
  actions: BackpackListItemActions;
}

export function BackpackListItem({ backpack, onPress, actions }: BackpackListItemProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const menuTriggerRef = useRef<View>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const [menuLeft, setMenuLeft] = useState(0);

  const docLabel =
    backpack.documentCount === 1
      ? "1 documento"
      : `${backpack.documentCount} documentos`;
  const meta = `${docLabel} · ${formatShortDate(backpack.createdAt)}`;

  const openMenu = useCallback(() => {
    menuTriggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuTop(y + height + spacing[1]);
      setMenuLeft(measureBackpackQuickActionsMenuLeft(x, width));
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
          accessibilityLabel={`Abrir mochila ${backpack.name}`}
        >
          <View style={styles.iconWrap}>
            <BackpackIcon size={22} color={palette.accent.backpack[600]} strokeWidth={2} />
          </View>

          <View style={styles.content}>
            <Typography variant="body" numberOfLines={1}>
              {backpack.name}
            </Typography>
            <Text style={styles.metaText}>{meta}</Text>
          </View>
        </TouchableOpacity>

        <View ref={menuTriggerRef} collapsable={false}>
          <TouchableOpacity
            onPress={openMenu}
            style={styles.menuButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Opciones de ${backpack.name}`}
          >
            <MoreVertical size={20} color={t.text.muted} />
          </TouchableOpacity>
        </View>
      </View>

      <BackpackQuickActionsMenu
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
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      backgroundColor: palette.accent.backpack[50],
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
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
