import { StyleSheet, Text, View } from "react-native";
import { Clock, Route } from "lucide-react-native";
import type { MissionNextStep } from "@helu/api";
import { Button, Chip, nativeFont, spacing, useAppTheme } from "@helu/ui";
import { MissionTypeIcon } from "./MissionTypeIcon";
import { stepAction, stepLabel, whenChip } from "./missionCopy";

/**
 * «Tu próximo paso» (lista H2, DU-37): el paso con fecha más cercana, con su única acción primaria,
 * que abre la hoja del paso. Sin fecha: chip «Sin fecha» y «Continuar».
 */
export function NextStepCard({ step, onAct }: { step: MissionNextStep; onAct: () => void }) {
  const t = useAppTheme();
  const dated = Boolean(step.dueAt);
  return (
    <View style={[styles.card, { backgroundColor: t.brand.tint, borderColor: t.brand.tintBorder }]}>
      <View style={styles.top}>
        <Chip
          label={whenChip(step.dueAt)}
          tone={dated ? "streak" : "neutral"}
          icon={dated ? <Clock size={12} color={t.motivation.streakText} /> : <Route size={12} color={t.text.onMuted} />}
        />
        <View style={{ flex: 1 }} />
        <Chip label={`Paso ${step.position} de ${step.total}`} tone="neutral" />
      </View>
      <Text style={[styles.title, { color: t.text.primary }]}>{step.label || stepLabel[step.stepKey]}</Text>
      {step.hint ? <Text style={[styles.hint, { color: t.text.secondary }]}>{step.hint}</Text> : null}
      <View style={styles.mission}>
        <MissionTypeIcon type={step.type} size={14} color={t.text.muted} />
        <Text style={[styles.missionText, { color: t.text.secondary }]} numberOfLines={1}>
          Misión: {step.missionTitle}
        </Text>
      </View>
      <Button variant="primary" fullWidth onPress={onAct}>
        {stepAction[step.stepKey] ?? "Continuar"}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, padding: spacing[4], borderRadius: 18, borderWidth: 1 },
  top: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  title: { fontSize: 19, lineHeight: 24, fontFamily: nativeFont("heading", 900) },
  hint: { fontSize: 14, lineHeight: 20, fontFamily: nativeFont("body", 400) },
  mission: { flexDirection: "row", alignItems: "center", gap: 6 },
  missionText: { flex: 1, fontSize: 13, fontFamily: nativeFont("body", 400) },
});
