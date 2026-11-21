import { View, Text } from "react-native";
import { FadeThrough, nativeFont, spacing, useAppTheme } from "@helu/ui";
import { HeluWordmark, Mascot, type MascotPose } from "../brand";

interface AuthHeaderProps {
  title: string;
  /** «Saluda» en el inicio de sesión, «Feliz» en el registro, «Pensativa» cuando algo falló (MASTER §9). */
  pose: MascotPose;
}

/** Marca + mascota de 100 px + título (m1 · «Inicio de sesión», «Registro»). */
export function AuthHeader({ title, pose }: AuthHeaderProps) {
  const t = useAppTheme();
  return (
    <View style={{ alignItems: "center", gap: 10, paddingTop: spacing[2] }}>
      <HeluWordmark size={26} />
      {/* La pose cambia con fundido cruzado: mismo lugar, otro estado (§1b). */}
      <FadeThrough value={pose}>{(p) => <Mascot pose={p} size={100} />}</FadeThrough>
      <Text
        accessibilityRole="header"
        style={{ fontSize: 26, lineHeight: 34, fontFamily: nativeFont("heading", 900), color: t.text.primary, textAlign: "center" }}
      >
        {title}
      </Text>
      <Text style={{ fontSize: 14, fontFamily: nativeFont("body", 400), color: t.text.secondary }}>
        Tu salud, en un solo lugar
      </Text>
    </View>
  );
}
