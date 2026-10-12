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
import { Stethoscope, Pill, Heart, X } from "lucide-react-native";
import { colors, fontSize, fontWeight, overlay, radii, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

export interface AgendaAddSheetProps {
  visible: boolean;
  onClose: () => void;
  onAddAppointment: () => void;
  onAddMedication: () => void;
  onAddCheckIn: () => void;
}

export function AgendaAddSheet({
  visible,
  onClose,
  onAddAppointment,
  onAddMedication,
  onAddCheckIn,
}: AgendaAddSheetProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();

  const handleAppointment = () => {
    onClose();
    onAddAppointment();
  };

  const handleMedication = () => {
    onClose();
    onAddMedication();
  };

  const handleCheckIn = () => {
    onClose();
    onAddCheckIn();
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
            <Text style={styles.modalTitle}>Agregar a agenda</Text>
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
            onPress={handleAppointment}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Nueva cita"
          >
            <View style={[styles.optionIcon, { backgroundColor: t.brand.tint }]}>
              <Stethoscope size={22} color={t.brand.fg} strokeWidth={2.25} />
            </View>
            <Text style={styles.optionLabel}>Nueva cita</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={handleMedication}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Nuevo medicamento"
          >
            <View style={[styles.optionIcon, { backgroundColor: t.accent.medBg }]}>
              <Pill size={22} color={t.accent.medFg} strokeWidth={2.25} />
            </View>
            <Text style={styles.optionLabel}>Nuevo medicamento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={handleCheckIn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Registrar check-in"
          >
            <View style={[styles.optionIcon, { backgroundColor: t.brand.tint }]}>
              <Heart size={22} color={t.brand.fg} strokeWidth={2.25} />
            </View>
            <Text style={styles.optionLabel}>Registrar check-in</Text>
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
