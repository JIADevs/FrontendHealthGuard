import { useMemo, type ReactNode } from "react";
import {
  View,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
} from "react-native";
import { Eye, Pencil, Share, Trash2 } from "lucide-react-native";
import { spacing, radii, fontSize, fontWeight, shadows, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

export interface DocumentQuickActionsMenuProps {
  visible: boolean;
  top: number;
  left: number;
  onClose: () => void;
  onView: () => void;
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
  shareLoading?: boolean;
}

const MENU_WIDTH = 200;

export function DocumentQuickActionsMenu({
  visible,
  top,
  left,
  onClose,
  onView,
  onEdit,
  onShare,
  onDelete,
  shareLoading = false,
}: DocumentQuickActionsMenuProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const defaultFg = t.text.primary;

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
          <MenuItem
            icon={<Eye size={18} color={defaultFg} />}
            label="Ver detalle"
            onPress={onView}
            styles={styles}
          />
          <MenuItem
            icon={<Pencil size={18} color={defaultFg} />}
            label="Editar"
            onPress={onEdit}
            styles={styles}
          />
          <MenuItem
            icon={
              shareLoading ? (
                <ActivityIndicator size="small" color={defaultFg} />
              ) : (
                <Share size={18} color={defaultFg} />
              )
            }
            label="Compartir"
            onPress={onShare}
            disabled={shareLoading}
            styles={styles}
          />
          <MenuItem
            icon={<Trash2 size={18} color={t.status.errorFg} />}
            label="Eliminar"
            destructive
            onPress={onDelete}
            styles={styles}
          />
        </View>
      </View>
    </Modal>
  );
}

export function measureQuickActionsMenuLeft(anchorX: number, anchorWidth: number): number {
  return anchorX + anchorWidth - MENU_WIDTH;
}

function MenuItem({
  icon,
  label,
  destructive = false,
  onPress,
  disabled,
  styles,
}: {
  icon: ReactNode;
  label: string;
  destructive?: boolean;
  onPress: () => void;
  disabled?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text style={destructive ? styles.itemLabelDestructive : styles.itemLabel}>{label}</Text>
    </TouchableOpacity>
  );
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
