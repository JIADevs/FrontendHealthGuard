import { useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, Upload, X } from "lucide-react-native";
import { colors, fontSize, fontWeight, overlay, radii, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

export interface DocumentsAddSheetProps {
  visible: boolean;
  onClose: () => void;
  onUpload: () => void;
  onScan: () => void;
}

export function DocumentsAddSheet({
  visible,
  onClose,
  onUpload,
  onScan,
}: DocumentsAddSheetProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();

  const handleUpload = () => {
    onClose();
    onUpload();
  };

  const handleScan = () => {
    onClose();
    onScan();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdropTouch} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={[styles.modalSheet, { paddingBottom: spacing[5] + insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar documento</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <X size={22} color={t.text.secondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={handleUpload}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Subir documento"
          >
            <View style={styles.optionIcon}>
              <Upload size={22} color={t.brand.fg} strokeWidth={2.25} />
            </View>
            <Text style={styles.optionLabel}>Subir documento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={handleScan}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Escanear"
          >
            <View style={styles.optionIcon}>
              <Camera size={22} color={t.brand.fg} strokeWidth={2.25} />
            </View>
            <Text style={styles.optionLabel}>Escanear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalBackdropTouch: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: overlay.darker,
    },
    modalSheet: {
      backgroundColor: t.surface.bgCard,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      padding: spacing[5],
      gap: spacing[2],
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 16,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing[2],
    },
    modalTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: t.text.primary,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[2],
      borderRadius: radii.md,
    },
    optionIcon: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: t.surface.bg,
      alignItems: "center",
      justifyContent: "center",
    },
    optionLabel: {
      flex: 1,
      fontSize: fontSize.base,
      fontWeight: fontWeight.medium,
      color: t.text.primary,
    },
  });
}
