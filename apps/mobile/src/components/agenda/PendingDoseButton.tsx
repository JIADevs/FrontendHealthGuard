import { View, Text, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";
import type { MedicationCycle } from "@helu/api";
import { Button, FadeThrough, formatClock, fontSize, nativeFont, spacing, useAppTheme } from "@helu/ui";
import { doseStateForCycle } from "./doseRowState";
import { useTakeDose } from "./useTakeDose";

export interface PendingDoseButtonProps {
  cycle: MedicationCycle;
}

/** «la 1:00 p. m.» / «las 9:00 p. m.» */
function withArticle(clock: string): string {
  return `${clock.startsWith("1:") ? "la" : "las"} ${clock}`;
}

/**
 * Detail-level «Tomar» (inicio-agenda.md · Medicamentos v2: «El detalle ofrece "Tomar" cuando hay
 * una toma pendiente»). It is the screen's primary action while the dose is pending and fades
 * through to «✓ Tomado» once it is registered. Renders nothing for a future dose.
 */
export function PendingDoseButton({ cycle }: PendingDoseButtonProps) {
  const t = useAppTheme();
  const takeDose = useTakeDose();
  const state = doseStateForCycle(cycle);
  const taking = takeDose.takingCycleId === cycle.id;
  const visible = state.kind === "pending" || state.kind === "taken";

  if (!visible || !cycle.nextIntakeTime) return null;

  const clock = formatClock(new Date(cycle.nextIntakeTime));

  return (
    <FadeThrough value={state.kind}>
      {(kind) =>
        kind === "pending" ? (
          <Button
            variant="success"
            size="lg"
            fullWidth
            icon={<Check size={18} strokeWidth={3} color={t.text.onSolid} />}
            loading={taking}
            loadingLabel="Guardando…"
            disabled={taking}
            onPress={() => takeDose.take(cycle.id)}
          >
            {`Tomar la dosis de ${withArticle(clock)}`}
          </Button>
        ) : (
          <View
            style={[styles.taken, { backgroundColor: t.status.successBg }]}
            accessibilityRole="text"
            accessibilityLabel={`Dosis de ${withArticle(clock)} tomada`}
          >
            <Check size={18} strokeWidth={3} color={t.status.successFg} />
            <Text style={[styles.takenText, { color: t.status.successFg }]}>Tomado</Text>
          </View>
        )
      }
    </FadeThrough>
  );
}

const styles = StyleSheet.create({
  taken: {
    minHeight: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
  },
  takenText: { fontSize: fontSize.base, fontFamily: nativeFont("heading", 800) },
});
