import { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { motion, motionEasing, useAppTheme } from "@helu/ui";

export interface CycleProgressBarProps {
  /** 0–1 */
  ratio: number;
  accessibilityLabel: string;
}

/**
 * Green cycle progress (inicio-agenda.md · Medicamentos v2). Per movimiento-interacciones §6c it
 * grows from 0 only the first time it mounts (600–900 ms, `emphasis`) and changes without
 * animating after that. Only `transform` animates; reduced motion shows the final value.
 */
export function CycleProgressBar({ ratio, accessibilityLabel }: CycleProgressBarProps) {
  const t = useAppTheme();
  const reduced = useReducedMotion();
  const clamped = Math.min(1, Math.max(0, ratio));
  const grown = useRef(false);
  const scale = useSharedValue(reduced ? clamped : 0);

  useEffect(() => {
    if (grown.current || reduced) {
      scale.value = clamped;
      return;
    }
    grown.current = true;
    scale.value = withTiming(clamped, { duration: motion.emphasis, easing: motionEasing.out });
  }, [clamped, reduced, scale]);

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: scale.value }] }));

  return (
    <View
      style={[styles.track, { backgroundColor: t.border.default }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View style={[styles.fill, { backgroundColor: t.status.successGraphic }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 999, overflow: "hidden" },
  fill: { ...StyleSheet.absoluteFill, borderRadius: 999, transformOrigin: "left" },
});
