import type { ReactNode } from "react";
import { View, Text, type StyleProp, type ViewStyle } from "react-native";
import { nativeFont, radii, spacing, useAppTheme } from "@helu/ui";

interface HomeCardProps {
  title?: string;
  /** A la derecha del título: «Ver todas», un chip de conteo. */
  right?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Tarjeta de Inicio (kit `.card`): radio 18, borde de 1 px con canto inferior, padding 16, gap 12. */
export function HomeCard({ title, right, children, style }: HomeCardProps) {
  const t = useAppTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.surface.bgCard,
          borderRadius: radii.card,
          borderWidth: 1,
          borderBottomWidth: 4,
          borderColor: t.border.default,
          padding: spacing[4],
          gap: spacing[3],
        },
        style,
      ]}
    >
      {title ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2], minHeight: 28 }}>
          <Text accessibilityRole="header" style={{ flex: 1, fontSize: 16, lineHeight: 20, fontFamily: nativeFont("heading", 800), color: t.text.primary }}>
            {title}
          </Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}
