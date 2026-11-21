import { View, Text, Pressable } from "react-native";
import { nativeFont, useAppTheme } from "@helu/ui";

interface AuthFooterLinkProps {
  text: string;
  linkText: string;
  onPress: () => void;
}

/** «¿No tienes cuenta? Regístrate ahora ›» en una fila, con el enlace de 44 px de alto (kit `.link`). */
export function AuthFooterLink({ text, linkText, onPress }: AuthFooterLinkProps) {
  const t = useAppTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
      <Text style={{ fontSize: 14, fontFamily: nativeFont("body", 400), color: t.text.secondary }}>{text}</Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="link"
        style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", opacity: pressed ? 0.6 : 1 })}
      >
        <Text style={{ fontSize: 14, fontFamily: nativeFont("heading", 800), color: t.brand.text }}>{linkText}</Text>
      </Pressable>
    </View>
  );
}
