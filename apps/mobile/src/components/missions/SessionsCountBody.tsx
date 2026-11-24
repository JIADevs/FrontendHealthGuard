import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import type { Mission } from "@helu/api";
import { Button, nativeFont, spacing, useAppTheme } from "@helu/ui";

const MAX = 200;

/**
 * «¿Cuántas sesiones te ordenaron?» (mockup «Cantidad de sesiones»). El total puede quedar pendiente
 * (RF-40) y nunca baja de las sesiones ya asistidas (RF-39).
 */
export function SessionsCountBody({
  mission,
  onSave,
  saving,
}: {
  mission: Mission;
  /** `null` = «Todavía no lo sé». */
  onSave: (total: number | null) => void;
  saving?: boolean;
}) {
  const t = useAppTheme();
  const attended = mission.sessions?.attended ?? 0;
  const min = Math.max(attended, 1);
  const [total, setTotal] = useState(Math.max(mission.sessions?.total ?? 10, min));

  const stepButton = (label: string, icon: React.ReactNode, disabled: boolean, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.stepBtn,
        // Icon button (movimiento §5): `surface-muted` while pressed; disabled at 50 % (MASTER §7).
        { borderColor: t.border.default, backgroundColor: pressed ? t.surface.muted : t.surface.bgCard, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      {icon}
    </Pressable>
  );

  return (
    <View style={styles.body}>
      <View style={styles.stepper} accessibilityRole="adjustable" accessibilityValue={{ min, max: MAX, now: total }}>
        {stepButton("Menos sesiones", <Minus size={22} strokeWidth={2.6} color={t.text.primary} />, total <= min, () =>
          setTotal((n) => Math.max(min, n - 1)),
        )}
        <Text style={[styles.value, { color: t.text.primary }]}>{total}</Text>
        {stepButton("Más sesiones", <Plus size={22} strokeWidth={2.6} color={t.text.primary} />, total >= MAX, () =>
          setTotal((n) => Math.min(MAX, n + 1)),
        )}
      </View>
      <Button variant="primary" fullWidth loading={saving} loadingLabel="Guardando…" onPress={() => onSave(total)}>
        Guardar
      </Button>
      {attended === 0 ? (
        <Button variant="ghost" fullWidth onPress={() => onSave(null)}>
          Todavía no lo sé
        </Button>
      ) : null}
      <Text style={[styles.meta, { color: t.text.secondary }]}>
        {attended > 0
          ? `Ya asististe a ${attended}: el total no puede ser menor.`
          : "Puedes cambiarlo después. Sin el total no mostramos porcentaje ni cerramos la misión."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[3] },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing[6], paddingVertical: spacing[2] },
  stepBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  value: { fontSize: 40, minWidth: 72, textAlign: "center", fontFamily: nativeFont("heading", 900) },
  meta: { fontSize: 13, lineHeight: 18, textAlign: "center", fontFamily: nativeFont("body", 400) },
});
