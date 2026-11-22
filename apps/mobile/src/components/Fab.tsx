import { StyleSheet, View } from "react-native";
import { Plus } from "lucide-react-native";
import { PressableScale, spacing, useAppTheme } from "@helu/ui";

interface FabProps {
  onPress: () => void;
  accessibilityLabel: string;
}

/** Kit `.fab`: 58 px, radio 20 y canto inferior de 4 px del tono «edge». Agenda y Documentos. */
export function Fab({ onPress, accessibilityLabel }: FabProps) {
  const t = useAppTheme();
  // The anchor is absolute, not the button: PressableScale puts its style on an inner view, so the
  // outer Pressable used to sit in the flow and the FAB moved with the content above it (it jumped
  // when the skeleton turned into the list).
  return (
    <View style={styles.anchor} pointerEvents="box-none">
      <PressableScale
        style={[styles.fab, { backgroundColor: t.brand.solid, borderBottomColor: t.brand.edge }]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Plus color={t.text.onSolid} size={26} strokeWidth={2.6} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    right: spacing[5],
    bottom: spacing[6],
    zIndex: 90,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 20,
    borderBottomWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
