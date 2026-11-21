import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { CheckCircle2, XCircle, AlertTriangle, Info, Heart } from "lucide-react-native";
import Toast, { type ToastConfig } from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, useAppTheme, toneColors, nativeFont, spacing, type Tone } from "@helu/ui";

// ─── v2 (MASTER §7, «Toast») ────────────────────────────────────────────────
// Arriba, 320 px, tarjeta clara con borde y elevación 3, ícono en cuadro con el tinte del tono,
// Nunito 800 14. Dura 4 s; 5 s si trae acción («Deshacer»). Ver src/lib/notify.ts.
const VARIANTS = {
  success: { icon: CheckCircle2, tone: "success" },
  error:   { icon: XCircle,      tone: "danger" },
  warning: { icon: AlertTriangle, tone: "warning" },
  info:    { icon: Info,         tone: "info" },
  // Mockup «Racha sumada»: el check-in que suma a la racha
  streak:  { icon: Heart,        tone: "streak" },
} as const satisfies Record<string, { icon: unknown; tone: Tone }>;

type VariantKey = keyof typeof VARIANTS;

export interface ToastActionProps {
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastItemProps {
  text1?: string;
  text2?: string;
  type: VariantKey;
  action?: ToastActionProps;
}

function ToastItem({ text1, text2, type, action }: ToastItemProps) {
  const t = useAppTheme();
  const variant = VARIANTS[type];
  const Icon = variant.icon;
  const tone = toneColors(variant.tone, t.mode);

  const translateY = useRef(new Animated.Value(-12)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 9 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        { backgroundColor: t.surface.bgCard, borderColor: t.border.default, opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
        <Icon color={tone.fg} size={17} strokeWidth={2.4} />
      </View>

      <View style={styles.textWrap}>
        {text1 ? <Text style={[styles.title, { color: t.text.primary }]} numberOfLines={2}>{text1}</Text> : null}
        {text2 ? <Text style={[styles.subtitle, { color: t.text.secondary }]} numberOfLines={2}>{text2}</Text> : null}
      </View>

      {action?.actionLabel && action.onAction ? (
        <Pressable
          onPress={() => {
            action.onAction?.();
            Toast.hide();
          }}
          accessibilityRole="button"
          accessibilityLabel={action.actionLabel}
          style={styles.actionBtn}
        >
          <Text style={[styles.actionLabel, { color: t.brand.text }]}>{action.actionLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const item = (type: VariantKey) => (props: { text1?: string; text2?: string; props?: unknown }) => (
  <ToastItem type={type} text1={props.text1} text2={props.text2} action={props.props as ToastActionProps | undefined} />
);

export const toastConfig: ToastConfig = {
  success: item("success"),
  error: item("error"),
  warning: item("warning"),
  info: item("info"),
  streak: item("streak"),
};

/** Montar dentro de SafeAreaProvider: ubica el toast arriba, debajo de la barra de estado. */
export function HeluToast() {
  const insets = useSafeAreaInsets();
  return <Toast config={toastConfig} position="top" topOffset={insets.top + 8} visibilityTime={4000} />;
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    maxWidth: "92%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 3,
    shadowColor: colors.slate[900],
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: { flex: 1, gap: 2 },
  title: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("heading", 800) },
  subtitle: { fontSize: 13, lineHeight: 17, fontFamily: nativeFont("body", 400) },
  actionBtn: { minHeight: 44, minWidth: 44, paddingHorizontal: spacing[1], alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 14, fontFamily: nativeFont("heading", 900) },
});
