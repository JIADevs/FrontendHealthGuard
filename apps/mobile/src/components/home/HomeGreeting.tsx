import { View, Text } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { FadeThrough, Skeleton, SkeletonGroup, motion, motionEasing, nativeFont, radii, spacing, useAppTheme } from "@helu/ui";
import { Mascot, type MascotPose } from "../brand";

interface HomeGreetingProps {
  pose: MascotPose;
  title: string;
  message: string;
  /** Mientras llegan los datos del día, el mensaje es esqueleto (§6c): no cambia frente a la persona. */
  loading?: boolean;
}

/** The card grows or shrinks smoothly when the new message has another number of lines. */
export const homeBlockLayout = LinearTransition.duration(motion.base).easing(motionEasing.standard);

/**
 * Saludo (inicio-agenda.md · bloque 1): mascota de 66 px y una tarjeta con lo siguiente del día.
 * Es local: se ve real desde el primer momento, nunca como esqueleto (§6c).
 */
function titleStyle(t: ReturnType<typeof useAppTheme>) {
  return { fontSize: 20, lineHeight: 26, fontFamily: nativeFont("heading", 900), color: t.text.primary } as const;
}

export function HomeGreeting({ pose, title, message, loading = false }: HomeGreetingProps) {
  const t = useAppTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
      <FadeThrough value={pose}>{(p) => <Mascot pose={p} size={66} />}</FadeThrough>
      <Animated.View
        layout={homeBlockLayout}
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
        {loading ? (
          <>
            <Text style={titleStyle(t)}>{title}</Text>
            <SkeletonGroup label="Cargando tu día" style={{ gap: 6, paddingTop: 4 }}>
              <Skeleton width="90%" height={12} />
              <Skeleton width="60%" height={12} />
            </SkeletonGroup>
          </>
        ) : (
          // Same place, other content: fade through (§2). Title and message change together; the old
          // greeting leaves before the new one enters, and the card resizes with `homeBlockLayout`.
          <FadeThrough value={`${title}\n${message}`} style={{ gap: 2 }}>
            {(shown) => {
              const [shownTitle, ...rest] = shown.split("\n");
              return (
                <>
                  <Text style={titleStyle(t)}>{shownTitle}</Text>
                  <Text style={{ fontSize: 14, lineHeight: 21, fontFamily: nativeFont("body", 400), color: t.text.secondary }}>
                    {rest.join("\n")}
                  </Text>
                </>
              );
            }}
          </FadeThrough>
        )}
      </Animated.View>
    </View>
  );
}
