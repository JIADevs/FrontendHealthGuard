import { Pressable, Text } from "react-native";
import { nativeFont, useAppTheme } from "@helu/ui";

/** «Ver todas» (kit `.link`, 13 px) con área de 44 px. */
export function SeeAllLink({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="link"
      style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", opacity: pressed ? 0.6 : 1, marginVertical: -8 })}
    >
      <Text style={{ fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.brand.text }}>{label}</Text>
    </Pressable>
  );
}
