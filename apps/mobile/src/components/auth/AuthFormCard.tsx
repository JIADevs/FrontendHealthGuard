import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { nativeFont, radii, spacing, useAppTheme } from "@helu/ui";

interface AuthFormCardProps {
  title: string;
  subtitle?: string;
  /** Banner de error del servidor, arriba de los campos (formularios.md §6). */
  banner?: ReactNode;
  children: ReactNode;
}

/** Tarjeta del formulario de acceso: superficie v2 (radio 18, canto inferior), padding 20, gap 14. */
export function AuthFormCard({ title, subtitle, banner, children }: AuthFormCardProps) {
  const t = useAppTheme();
  return (
    <View
      style={{
        backgroundColor: t.surface.bgCard,
        borderRadius: radii.card,
        borderWidth: 1,
        borderBottomWidth: 4,
        borderColor: t.border.default,
        padding: spacing[5],
        gap: 14,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text accessibilityRole="header" style={{ fontSize: 18, fontFamily: nativeFont("heading", 900), color: t.text.primary }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 14, lineHeight: 21, fontFamily: nativeFont("body", 400), color: t.text.secondary }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {banner}
      {children}
    </View>
  );
}
