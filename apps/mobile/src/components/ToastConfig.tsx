import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react-native";
import type { ToastConfig } from "react-native-toast-message";
import { colors, toastBg, radii, spacing, fontSize, fontWeight } from "@healthguard/ui";

// ─── Colores por tipo (dark toasts) ──────────────────────────────────────────
const VARIANTS = {
  success: { icon: CheckCircle2,  color: colors.success[500], bg: toastBg.success, border: colors.success[600] },
  error:   { icon: XCircle,       color: colors.error[400],   bg: toastBg.error,   border: colors.error[600] },
  warning: { icon: AlertTriangle, color: colors.warning[500], bg: toastBg.warning, border: colors.amber[600] },
  info:    { icon: Info,           color: colors.sky[400],     bg: toastBg.info,    border: colors.sky[600] },
} as const;

type VariantKey = keyof typeof VARIANTS;

interface ToastItemProps {
  text1?: string;
  text2?: string;
  type: VariantKey;
}

function ToastItem({ text1, text2, type }: ToastItemProps) {
  const variant = VARIANTS[type];
  const Icon = variant.icon;

  const translateY = useRef(new Animated.Value(20)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 9 }),
      Animated.spring(scale,      { toValue: 1, useNativeDriver: true, tension: 80, friction: 9 }),
      Animated.timing(opacity,    { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: variant.bg,
          borderLeftColor: variant.border,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: variant.border + "22" }]}>
        <Icon color={variant.color} size={20} strokeWidth={2.5} />
      </View>

      <View style={styles.textWrap}>
        {text1 ? <Text style={styles.title} numberOfLines={1}>{text1}</Text> : null}
        {text2 ? <Text style={styles.subtitle} numberOfLines={2}>{text2}</Text> : null}
      </View>
    </Animated.View>
  );
}

export const toastConfig: ToastConfig = {
  success: (props) => <ToastItem type="success" text1={props.text1} text2={props.text2} />,
  error:   (props) => <ToastItem type="error"   text1={props.text1} text2={props.text2} />,
  warning: (props) => <ToastItem type="warning" text1={props.text1} text2={props.text2} />,
  info:    (props) => <ToastItem type="info"    text1={props.text1} text2={props.text2} />,
};

const styles = StyleSheet.create({
  container: {
    width: "92%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: 14,
    paddingHorizontal: spacing[4],
    borderRadius: 14,
    borderLeftWidth: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: { flex: 1, gap: 2 },
  title:    { color: colors.slate[100], fontSize: 14, fontWeight: fontWeight.bold, letterSpacing: 0.1 },
  subtitle: { color: colors.slate[400], fontSize: fontSize.xs, lineHeight: 17 },
});
