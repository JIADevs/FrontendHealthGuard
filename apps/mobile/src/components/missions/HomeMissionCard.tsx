import { StyleSheet, Text, View } from "react-native";
import type { MissionNextStep } from "@helu/api";
import { Button, nativeFont, spacing, useAppTheme } from "@helu/ui";
import { ProgressRing } from "../home/ProgressRing";
import { missionTypeShort } from "./missionCopy";

/**
 * Inicio, bloque 4 (inicio-agenda.md · Inicio, kit `proc()`): la misión del próximo paso con su anillo
 * y «Continuar la misión» como acción secundaria (la primaria de Inicio es «Tomar»). El eyebrow usa el
 * tipo corto: «Asistir a una cita médica» no cabe en una línea a 402 pt.
 */
export function HomeMissionCard({ step, onContinue }: { step: MissionNextStep; onContinue: () => void }) {
  const t = useAppTheme();
  const done = Math.max(step.position - 1, 0);
  const ratio = step.total ? done / step.total : 0;
  return (
    <View style={[styles.card, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}>
      <View style={styles.row}>
        <ProgressRing size={64} progress={ratio}>
          <Text style={[styles.ring, { color: t.text.primary }]}>{`${done}/${step.total}`}</Text>
        </ProgressRing>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.eyebrow, { color: t.text.secondary }]} numberOfLines={1}>
            TU MISIÓN · {missionTypeShort[step.type].toUpperCase()}
          </Text>
          <Text style={[styles.title, { color: t.text.primary }]} numberOfLines={2}>
            {step.missionTitle}
          </Text>
          <Text style={[styles.sub, { color: t.text.secondary }]} numberOfLines={2}>
            Sigue: {step.label.charAt(0).toLowerCase() + step.label.slice(1)}
          </Text>
        </View>
      </View>
      <Button variant="secondary" fullWidth onPress={onContinue}>
        Continuar la misión
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14, padding: spacing[4], borderRadius: 18, borderWidth: 1, borderBottomWidth: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing[4] },
  ring: { fontSize: 17, fontFamily: nativeFont("heading", 900) },
  eyebrow: { fontSize: 11, letterSpacing: 1, fontFamily: nativeFont("heading", 900) },
  title: { fontSize: 16, lineHeight: 21, fontFamily: nativeFont("heading", 800) },
  sub: { fontSize: 14, lineHeight: 19, fontFamily: nativeFont("body", 400) },
});
