import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { AlertCircle } from "lucide-react-native";
import { motion, nativeFont, radii, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";

/**
 * formularios.md §6 «Error de red o 5xx» inside the «Nuevo tratamiento» sheet: «No pudimos guardar.
 * Revisa tu conexión e intenta de nuevo.» + «Reintentar», above the button, and what was typed stays.
 * The sheet uses it instead of the toast because on iOS the toast renders under the sheet's `Modal`.
 * Fades in over 150 ms (§5) and is read out at once.
 */
export function TreatmentSaveBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <Animated.View
      entering={FadeIn.duration(motion.fast)}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={styles.banner}
    >
      <AlertCircle size={18} color={t.status.errorFg} />
      <View style={styles.copy}>
        <Text style={styles.text}>{message}</Text>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    // Kit `.banner` on danger-bg, as the agenda form's error banner.
    banner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing[2],
      paddingHorizontal: spacing[3],
      paddingTop: spacing[3],
      paddingBottom: spacing[1],
      borderRadius: radii.input,
      borderWidth: 1,
      borderColor: t.status.dangerBorder,
      backgroundColor: t.status.errorBg,
    },
    copy: { flex: 1, minWidth: 0 },
    text: { fontSize: 14, lineHeight: 20, fontFamily: nativeFont("body", 500), color: t.status.errorFg },
    // 44 px touch area (#35); the text sits at the banner's left edge.
    retry: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
    pressed: { opacity: 0.6 },
    retryText: { fontSize: 14, fontFamily: nativeFont("heading", 800), color: t.status.errorFg, textDecorationLine: "underline" },
  });
}
