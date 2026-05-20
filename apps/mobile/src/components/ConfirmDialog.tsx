import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { useAppTheme, spacing, colors } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { useMemo, type ReactNode } from "react";

interface ConfirmDialogProps {
  visible: boolean;
  icon?: ReactNode;
  title: string;
  message: string;
  cancelText?: string;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  visible,
  icon,
  title,
  message,
  cancelText = "Cancelar",
  confirmText,
  onCancel,
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {icon && (
            <View style={[styles.iconContainer, destructive && styles.iconContainerDestructive]}>
              {icon}
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={onCancel}
            >
              <Text style={styles.buttonCancelText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonConfirm,
                destructive && styles.buttonDestructive,
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.buttonConfirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (t: ThemeContextValue) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: spacing[4],
    },
    dialog: {
      backgroundColor: t.surface.bgCard,
      borderRadius: 16,
      padding: spacing[5],
      width: "100%",
      maxWidth: 320,
      alignItems: "center",
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.error[100],
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing[4],
    },
    iconContainerDestructive: {
      backgroundColor: colors.error[100],
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: t.text.primary,
      textAlign: "center",
      marginBottom: spacing[2],
    },
    message: {
      fontSize: 14,
      color: t.text.secondary,
      textAlign: "center",
      marginBottom: spacing[5],
    },
    buttonRow: {
      flexDirection: "row",
      gap: spacing[2],
      width: "100%",
    },
    button: {
      flex: 1,
      paddingVertical: spacing[3],
      borderRadius: 8,
      alignItems: "center",
    },
    buttonCancel: {
      backgroundColor: t.surface.bg,
      borderWidth: 1,
      borderColor: t.border.medium,
    },
    buttonCancelText: {
      fontSize: 16,
      fontWeight: "500",
      color: t.text.primary,
    },
    buttonConfirm: {
      backgroundColor: t.brand.bg,
    },
    buttonDestructive: {
      backgroundColor: colors.error[600],
    },
    buttonConfirmText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.white,
    },
  });
