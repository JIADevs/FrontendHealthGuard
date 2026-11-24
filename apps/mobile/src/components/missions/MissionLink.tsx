import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { nativeFont, useAppTheme } from "@helu/ui";

/**
 * Text link of the mission screens («Adjuntar», «Compartir documentos», «Adjuntar documento»):
 * 44 px of visible target (MASTER §6) and the tint of a tapped control (movimiento §5), so the
 * tap is acknowledged where it happened.
 */
export function MissionLink({
  icon,
  label,
  onPress,
  center = false,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  center?: boolean;
}) {
  const t = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.link,
        center && { alignSelf: "center" },
        { backgroundColor: pressed ? t.brand.tint : "transparent" },
      ]}
    >
      {icon}
      <Text style={[styles.text, { color: t.brand.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 10, borderRadius: 12 },
  text: { fontSize: 13, fontFamily: nativeFont("body", 700) },
});
