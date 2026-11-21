import { View, Text } from "react-native";
import { FadeThrough, Skeleton, SkeletonGroup, nativeFont, radii, spacing, useAppTheme } from "@helu/ui";
import { Mascot, type MascotPose } from "../brand";

interface HomeGreetingProps {
  pose: MascotPose;
  title: string;
  message: string;
  /** Mientras llegan los datos del día, el mensaje es esqueleto (§6c): no cambia frente a la persona. */
  loading?: boolean;
}

/**
 * Saludo (inicio-agenda.md · bloque 1): mascota de 66 px y una tarjeta con lo siguiente del día.
 * Es local: se ve real desde el primer momento, nunca como esqueleto (§6c).
 */
export function HomeGreeting({ pose, title, message, loading = false }: HomeGreetingProps) {
  const t = useAppTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
      <FadeThrough value={pose}>{(p) => <Mascot pose={p} size={66} />}</FadeThrough>
      <View
        accessible
        accessibilityRole="summary"
        style={{
          flex: 1,
          backgroundColor: t.surface.bgCard,
          borderRadius: radii.card,
          borderWidth: 1,
          borderBottomWidth: 4,
          borderColor: t.border.default,
          paddingVertical: spacing[3],
          paddingHorizontal: spacing[4],
          gap: 2,
        }}
      >
        <Text style={{ fontSize: 20, lineHeight: 26, fontFamily: nativeFont("heading", 900), color: t.text.primary }}>{title}</Text>
        {loading ? (
          <SkeletonGroup label="Cargando tu día" style={{ gap: 6, paddingTop: 4 }}>
            <Skeleton width="90%" height={12} />
            <Skeleton width="60%" height={12} />
          </SkeletonGroup>
        ) : (
          <Text style={{ fontSize: 14, lineHeight: 21, fontFamily: nativeFont("body", 400), color: t.text.secondary }}>{message}</Text>
        )}
      </View>
    </View>
  );
}
