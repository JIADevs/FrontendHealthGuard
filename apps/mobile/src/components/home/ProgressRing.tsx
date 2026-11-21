import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useAppTheme } from "@helu/ui";

interface ProgressRingProps {
  size: number;
  /** 0 a 1 */
  progress: number;
  children?: ReactNode;
}

/** Anillo de progreso (kit `ring()`): pista gris, trazo verde, contenido centrado. */
export function ProgressRing({ size, progress, children }: ProgressRingProps) {
  const t = useAppTheme();
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden={!children}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.motivation.track} strokeWidth={8} />
        {/* With no progress the rounded cap would still draw a green dot: draw only the track. */}
        {p > 0 ? <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={t.status.successGraphic}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${(c * p).toFixed(1)} ${c.toFixed(1)}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        /> : null}
      </Svg>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
        {children}
      </View>
    </View>
  );
}
