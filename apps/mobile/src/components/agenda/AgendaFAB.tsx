import { useMemo } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Plus } from "lucide-react-native";
import { spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface AgendaFABProps {
  onPress: () => void;
}

export function AgendaFAB({ onPress }: AgendaFABProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Agregar a agenda"
    >
      <Plus color={t.text.onSolid} size={26} strokeWidth={2.6} />
    </TouchableOpacity>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    // Kit `.fab`: 58 px, radio 20 y canto inferior de 4 px del tono «edge».
    fab: {
      position: "absolute",
      right: spacing[5],
      bottom: spacing[6],
      width: 58,
      height: 58,
      borderRadius: 20,
      backgroundColor: t.brand.solid,
      borderBottomWidth: 4,
      borderBottomColor: t.brand.edge,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 90,
    },
  });
}
