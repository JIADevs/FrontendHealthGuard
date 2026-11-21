import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Plus } from "lucide-react-native";
import { colors, nativeFont, useAppTheme } from "@helu/ui";

/** Logo del kit (`logo()`): cuadro con «+» en degradado de marca y la palabra «helu». */
export function HeluWordmark({ size = 26 }: { size?: number }) {
  const t = useAppTheme();
  const box = size + 6;
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Helu"
    >
      <LinearGradient
        colors={[colors.primary[400], colors.primary[700]]}
        style={{ width: box, height: box, borderRadius: Math.round(box * 0.32), alignItems: "center", justifyContent: "center" }}
      >
        <Plus size={Math.round(size * 0.7)} color={colors.white} strokeWidth={4} />
      </LinearGradient>
      <Text style={{ fontSize: size, fontFamily: nativeFont("heading", 900), color: t.mode === "dark" ? t.text.primary : colors.primary[700] }}>
        helu
      </Text>
    </View>
  );
}
