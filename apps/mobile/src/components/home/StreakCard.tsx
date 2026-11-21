import { useEffect, useRef } from "react";
import { View, Text } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Check, CheckCircle2, Heart } from "lucide-react-native";
import { Button, motion, motionEasing, nativeFont, radii, spacing, useAppTheme } from "@helu/ui";
import { LinearGradient } from "expo-linear-gradient";
import { Flame } from "./Flame";

export interface StreakDay {
  key: string;
  initial: string;
  done: boolean;
  isToday: boolean;
}

interface StreakCardProps {
  current: number;
  longest: number;
  week: StreakDay[];
  doneToday: boolean;
  /** El servidor ya sumó el día de hoy a la racha (hasta entonces no se promete el número de mañana). */
  confirmedToday: boolean;
  onCheckIn: () => void;
  /** Cambia cuando el servidor confirmó un check-in de esta sesión: dispara la celebración. */
  celebrateKey: number;
}

/**
 * Tarjeta de racha (inicio-agenda.md · bloque 3, mockup «Inicio» / «Racha sumada»).
 * Su botón de check-in es secundario: «Tomar» es la única acción primaria de Inicio.
 * Al sumar el día, la llama escala 1 → 1,6 → 1 en 600 ms y después el número rebota
 * (movimiento-interacciones.md §6). Con movimiento reducido no se mueve nada.
 */
export function StreakCard({ current, longest, week, doneToday, confirmedToday, onCheckIn, celebrateKey }: StreakCardProps) {
  const t = useAppTheme();
  const reduced = useReducedMotion();
  const flame = useSharedValue(1);
  const number = useSharedValue(1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced || celebrateKey === 0) return;
    flame.value = withSequence(
      withTiming(1.6, { duration: 300, easing: motionEasing.out }),
      withTiming(1, { duration: 300, easing: motionEasing.standard }),
    );
    number.value = withDelay(
      motion.slow,
      withSequence(withTiming(1.15, { duration: 120, easing: motionEasing.spring }), withTiming(1, { duration: 130 })),
    );
  }, [celebrateKey, reduced, flame, number]);

  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: flame.value }] }));
  const numberStyle = useAnimatedStyle(() => ({ transform: [{ scale: number.value }] }));

  return (
    // Kit `.card` con borde naranja: 1 px de `streak-border` alrededor y debajo el mismo canto gris
    // de 3 px que el resto de tarjetas (`box-shadow: 0 3px 0 var(--line)`), dibujado como un fondo
    // desplazado para que siga el radio.
    <View style={{ borderRadius: radii.card, backgroundColor: t.border.default, paddingBottom: 3 }}>
    <View
      style={{
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: t.motivation.streakBorder,
        overflow: "hidden",
      }}
    >
      <LinearGradient colors={[t.motivation.streakBg, t.surface.bgCard]} style={{ padding: spacing[4], gap: spacing[4] }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[4] }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: t.surface.bgCard,
              borderWidth: 1.5,
              borderColor: t.motivation.streakBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Animated.View style={flameStyle}>
              <Flame size={34} />
            </Animated.View>
          </View>
          {/* Con 0 días el texto invita a empezar, nunca marca lo que falta (MASTER §8, copy en positivo). */}
          <View
            style={{ flex: 1 }}
            accessible
            accessibilityLabel={current === 0 ? "Empieza hoy tu racha" : `${current} ${current === 1 ? "día" : "días"} de racha cuidándote`}
          >
            <Animated.Text
              style={[
                { alignSelf: "flex-start", fontSize: 28, lineHeight: 32, fontFamily: nativeFont("heading", 900), color: t.motivation.streakSolid },
                numberStyle,
              ]}
            >
              {current === 0 ? "Empieza hoy" : `${current} ${current === 1 ? "día" : "días"}`}
            </Animated.Text>
            <Text style={{ fontSize: 14, fontFamily: nativeFont("body", 400), color: t.motivation.streakEdge }}>
              {current > 0 ? "de racha cuidándote" : doneToday ? "Ya hiciste tu check-in de hoy" : "Haz tu check-in para sumar el primer día"}
            </Text>
          </View>
          {longest > 0 ? (
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: t.surface.bgCard,
                borderWidth: 1,
                borderColor: t.motivation.streakBorder,
              }}
            >
              <Text style={{ fontSize: 12, fontFamily: nativeFont("heading", 800), color: t.motivation.streakText }}>Récord {longest}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }} accessibilityLabel="Check-ins de esta semana">
          {week.map((day) => (
            <View key={day.key} style={{ alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: t.surface.bgCard,
                  borderWidth: day.isToday && !day.done ? 2.5 : day.done ? 0 : 1.5,
                  borderColor: day.isToday ? t.motivation.streak : t.motivation.streakBorder,
                }}
              >
                {day.done ? (
                  // El punto del día se llena con fundido cuando el servidor confirma.
                  <Animated.View
                    entering={reduced ? undefined : FadeIn.duration(motion.fast)}
                    style={{
                      position: "absolute",
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: t.motivation.streak,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={16} strokeWidth={3} color={t.text.onSolid} />
                  </Animated.View>
                ) : null}
              </View>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: nativeFont("heading", 800),
                  color: day.done || day.isToday ? t.motivation.streakSolid : t.text.secondary,
                }}
              >
                {day.initial}
              </Text>
            </View>
          ))}
        </View>

        {doneToday ? (
          <Animated.View
            entering={reduced ? undefined : FadeIn.duration(motion.fast)}
            accessibilityRole="text"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[3],
              borderRadius: 16,
              paddingVertical: 12,
              paddingHorizontal: 14,
              backgroundColor: t.status.successBg,
            }}
          >
            <CheckCircle2 size={18} color={t.status.successFg} />
            <Text style={{ flex: 1, fontSize: 14, fontFamily: nativeFont("heading", 800), color: t.status.successFg }}>
              {confirmedToday ? `Check-in hecho. Mañana sumas el día ${current + 1}.` : "Check-in hecho."}
            </Text>
          </Animated.View>
        ) : (
          <Button variant="secondary" fullWidth icon={<Heart size={17} strokeWidth={2.4} color={t.brand.text} />} onPress={onCheckIn}>
            Hacer check-in de hoy
          </Button>
        )}
      </LinearGradient>
    </View>
    </View>
  );
}
