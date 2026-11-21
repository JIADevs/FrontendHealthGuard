import { useId } from "react";
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Circle } from "react-native-svg";
import { colors } from "@helu/ui";

/** Poses de MASTER §9. `joy` es «Celebra» en su versión estática. */
export type MascotPose = "wave" | "happy" | "point" | "think" | "joy";

const ARMS: Record<MascotPose, [string, string]> = {
  happy: ["M30 78 Q14 86 18 102", "M90 78 Q106 86 102 102"],
  wave: ["M30 78 Q14 86 18 102", "M90 76 Q110 64 106 40"],
  point: ["M30 78 Q14 86 18 102", "M90 78 Q108 76 116 66"],
  joy: ["M30 76 Q10 62 14 38", "M90 76 Q110 62 106 38"],
  think: ["M30 78 Q14 86 18 102", "M90 78 Q104 70 86 58"],
};

// Colores fijos del personaje (MASTER §9): cápsula #60A5FA → #2563EB, brazos #1D4ED8.
const BODY_TOP = colors.primary[400];
const BODY_BOTTOM = colors.primary[600];
const ARM = colors.primary[700];
const INK = colors.slate[900];
const CHEEK = colors.pink[300];

export interface MascotProps {
  pose?: MascotPose;
  /** Ancho en px. Tamaños: 30–40 hint · 60–80 saludo · 100–130 vacío, celebración, acceso. */
  size?: number;
}

/**
 * La mascota de Helu (kit `mas()`), sin animación. Es decorativa: el lector de pantalla la ignora
 * y el texto de al lado dice lo importante. Una por pantalla, como máximo.
 */
export function Mascot({ pose = "happy", size = 100 }: MascotProps) {
  const gradientId = `mascot-${useId().replace(/:/g, "")}`;
  const [left, right] = ARMS[pose];

  return (
    <Svg
      width={size}
      height={Math.round((size * 140) / 120)}
      viewBox="0 0 120 140"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={BODY_TOP} />
          <Stop offset="1" stopColor={BODY_BOTTOM} />
        </LinearGradient>
      </Defs>
      <Ellipse cx={60} cy={134} rx={30} ry={5} fill={INK} fillOpacity={0.12} />
      <G>
        <Path d={left} stroke={ARM} strokeWidth={12} strokeLinecap="round" fill="none" />
        <Path d={right} stroke={ARM} strokeWidth={12} strokeLinecap="round" fill="none" />
        <Rect x={24} y={16} width={72} height={112} rx={36} fill={`url(#${gradientId})`} />
        <Ellipse cx={44} cy={30} rx={11} ry={6} fill={colors.white} fillOpacity={0.3} transform="rotate(-20 44 30)" />
        <Rect x={38} y={68} width={44} height={46} rx={20} fill={colors.white} />
        {pose === "joy" ? (
          <Path d="M42 48 Q48 40 54 48 M66 48 Q72 40 78 48" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
        ) : (
          <>
            <Ellipse cx={48} cy={46} rx={6} ry={7.5} fill={INK} />
            <Ellipse cx={72} cy={46} rx={6} ry={7.5} fill={INK} />
            <Circle cx={50} cy={43.5} r={2.2} fill={colors.white} />
            <Circle cx={74} cy={43.5} r={2.2} fill={colors.white} />
          </>
        )}
        <Ellipse cx={37} cy={58} rx={6} ry={3.5} fill={CHEEK} />
        <Ellipse cx={83} cy={58} rx={6} ry={3.5} fill={CHEEK} />
        {pose === "joy" ? (
          <Path d="M51 57 Q60 70 69 57 Z" fill={INK} />
        ) : pose === "think" ? (
          <Path d="M54 60 H66" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
        ) : (
          <Path d="M53 58 Q60 65 67 58" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        )}
      </G>
    </Svg>
  );
}
