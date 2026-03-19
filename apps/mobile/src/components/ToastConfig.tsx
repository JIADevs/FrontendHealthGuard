import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react-native";
import type { ToastConfig } from "react-native-toast-message";

// ─── Colores por tipo ────────────────────────────────────────────────────────
const VARIANTS = {
  success: { icon: CheckCircle2, color: "#22c55e", bg: "#052e16", border: "#16a34a" },
  error:   { icon: XCircle,      color: "#f87171", bg: "#2d0a0a", border: "#dc2626" },
  warning: { icon: AlertTriangle, color: "#fbbf24", bg: "#1c1100", border: "#d97706" },
  info:    { icon: Info,          color: "#38bdf8", bg: "#0c1a2e", border: "#0284c7" },
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
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
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
      {/* Línea de color izquierda ya viene del borderLeftColor, más el ícono */}
      <View style={[styles.iconWrap, { backgroundColor: variant.border + "22" }]}>
        <Icon color={variant.color} size={20} strokeWidth={2.5} />
      </View>

      <View style={styles.textWrap}>
        {text1 ? (
          <Text style={styles.title} numberOfLines={1}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ─── Config exportable ───────────────────────────────────────────────────────
export const toastConfig: ToastConfig = {
  success: (props) => <ToastItem type="success" text1={props.text1} text2={props.text2} />,
  error:   (props) => <ToastItem type="error"   text1={props.text1} text2={props.text2} />,
  warning: (props) => <ToastItem type="warning" text1={props.text1} text2={props.text2} />,
  info:    (props) => <ToastItem type="info"    text1={props.text1} text2={props.text2} />,
};

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    width: "92%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    // Sombra
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: "#f1f5f9",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 17,
  },
});
