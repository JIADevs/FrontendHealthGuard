import { View, Text, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Info } from "lucide-react-native";
import { motion, nativeFont, spacing, useAppTheme } from "@helu/ui";

export interface AuthBannerProps {
  message: string;
  action?: { label: string; onPress: () => void };
}

/**
 * Banner de error del formulario (kit `.banner` sobre `danger-bg`): entra con fundido de 150 ms,
 * se anuncia al lector de pantalla y no dice cuál campo falló cuando son credenciales.
 */
export function AuthBanner({ message, action }: AuthBannerProps) {
  const t = useAppTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(motion.fast)}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: t.status.errorBg,
      }}
    >
      <Info size={18} color={t.status.dangerSolid} />
      <View style={{ flex: 1, gap: spacing[1] }}>
        <Text style={{ fontSize: 14, lineHeight: 20, fontFamily: nativeFont("body", 500), color: t.status.errorFg }}>
          {message}
        </Text>
        {action ? (
          <Pressable onPress={action.onPress} hitSlop={10} accessibilityRole="button" style={{ alignSelf: "flex-start" }}>
            <Text style={{ fontSize: 14, fontFamily: nativeFont("heading", 800), color: t.status.errorFg, textDecorationLine: "underline" }}>
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}
