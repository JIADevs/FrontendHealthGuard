import { useMemo } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Plus } from "lucide-react-native";
import { colors, palette, radii, spacing } from "@helu/ui";

interface DocumentsFABProps {
  onPress: () => void;
}

export function DocumentsFAB({ onPress }: DocumentsFABProps) {
  const styles = useMemo(() => makeStyles(), []);

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Subir documento"
    >
      <Plus color={colors.white} size={28} />
    </TouchableOpacity>
  );
}

function makeStyles() {
  return StyleSheet.create({
    fab: {
      position: "absolute",
      right: spacing[5],
      bottom: spacing[6],
      width: 56,
      height: 56,
      borderRadius: radii.full,
      backgroundColor: palette.brand[500],
      alignItems: "center",
      justifyContent: "center",
      elevation: 8,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      zIndex: 90,
    },
  });
}
