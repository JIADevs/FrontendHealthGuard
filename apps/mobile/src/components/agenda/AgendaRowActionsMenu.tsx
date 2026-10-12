import { useMemo } from "react";
import { View, Modal, Pressable, TouchableOpacity, StyleSheet, Text } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { spacing, radii, fontSize, fontWeight, shadows, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

export interface AgendaRowAction {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface AgendaRowActionsMenuProps {
  visible: boolean;
  top: number;
  left: number;
  onClose: () => void;
  actions: AgendaRowAction[];
}

const MENU_WIDTH = 200;

export function AgendaRowActionsMenu({
  visible,
  top,
  left,
  onClose,
  actions,
}: AgendaRowActionsMenuProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar menú"
        />
        <View
          style={[styles.menu, { top, left: Math.max(spacing[3], left) }]}
          accessibilityViewIsModal
        >
          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.item}
              onPress={() => {
                onClose();
                action.onPress();
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <action.icon size={18} color={action.destructive ? t.status.errorFg : t.text.primary} />
              <Text style={action.destructive ? styles.itemLabelDestructive : styles.itemLabel}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

export function measureAgendaRowActionsMenuLeft(anchorX: number, anchorWidth: number): number {
  return anchorX + anchorWidth - MENU_WIDTH;
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
    },
    menu: {
      position: "absolute",
      width: MENU_WIDTH,
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: t.border.light,
      paddingVertical: spacing[1],
      ...shadows.lg,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    itemLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: t.text.primary,
    },
    itemLabelDestructive: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: t.status.errorFg,
    },
  });
}
