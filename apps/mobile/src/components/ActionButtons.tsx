import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface ActionButtonsProps {
  onReschedule?: () => void;
  onCancel?: () => void;
}

export function ActionButtons({ onReschedule, onCancel }: ActionButtonsProps) {
  const t = useAppTheme();
  const styles = makeStyles(t);

  return (
    <View style={styles.row}>
      {onReschedule && (
        <TouchableOpacity style={styles.button} onPress={onReschedule}>
          <Text style={styles.buttonText}>Reprogramar</Text>
        </TouchableOpacity>
      )}
      {onCancel && (
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
          <Text style={[styles.buttonText, styles.cancelText]}>Cancelar cita</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (t: ThemeContextValue) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: spacing[2],
    },
    button: {
      flex: 1,
      paddingVertical: spacing[3],
      alignItems: "center",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.border.medium,
      backgroundColor: t.surface.bgCard,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: "600",
      color: t.text.primary,
    },
    cancelButton: {
      borderColor: t.status.errorFg,
    },
    cancelText: {
      color: t.status.errorFg,
    },
  });