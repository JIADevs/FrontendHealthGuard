import { StyleSheet } from "react-native";
import { Plus } from "lucide-react-native";
import { PressableScale, spacing, useAppTheme } from "@helu/ui";

interface FabProps {
  onPress: () => void;
  accessibilityLabel: string;
}

/** Kit `.fab`: 58 px, radio 20 y canto inferior de 4 px del tono «edge». Agenda y Documentos. */
export function Fab({ onPress, accessibilityLabel }: FabProps) {
  const t = useAppTheme();
  return (
    <PressableScale
      style={[styles.fab, { backgroundColor: t.brand.solid, borderBottomColor: t.brand.edge }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Plus color={t.text.onSolid} size={26} strokeWidth={2.6} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: spacing[5],
    bottom: spacing[6],
    width: 58,
    height: 58,
    borderRadius: 20,
    borderBottomWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 90,
  },
});
