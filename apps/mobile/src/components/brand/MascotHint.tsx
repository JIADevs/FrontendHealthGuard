import { StyleSheet, Text, View } from "react-native";
import { nativeFont, useAppTheme } from "@helu/ui";
import { Mascot, type MascotPose } from "./Mascot";

/** Kit `.hint`: brand tint, radius 16, mascot at 32 px and a 13 px line («Arma una mochila…»). */
export function MascotHint({ text, pose = "point" }: { text: string; pose?: MascotPose }) {
  const t = useAppTheme();
  return (
    <View style={[styles.hint, { backgroundColor: t.brand.tint }]}>
      <Mascot pose={pose} size={32} />
      <Text style={[styles.text, { color: t.brand.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16 },
  text: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 500) },
});
