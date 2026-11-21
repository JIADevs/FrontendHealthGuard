import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Pill, Check } from "lucide-react-native";
import { Button, Chip, FadeThrough, IconTile, spacing, fontSize, nativeFont, useAppTheme, formatMedDose, formatClock } from "@helu/ui";
import type { ThemeContextValue, AgendaEvent } from "@helu/ui";
import { doseStateForEvent } from "../agenda/doseRowState";

type MedicationEvent = Extract<AgendaEvent, { type: "medication" }>;

interface MedicationDoseListItemProps {
  event: MedicationEvent;
  onPress: () => void;
  onTake?: () => void;
  taking?: boolean;
  isLast?: boolean;
}

export function MedicationDoseListItem({ event, onPress, onTake, taking = false, isLast }: MedicationDoseListItemProps) {
  const t = useAppTheme();
  const doseState = doseStateForEvent(event);
  const styles = useMemo(() => makeStyles(t), [t]);

  const dose = formatMedDose(event.data.doseAmount, event.data.doseUnit, event.data.dosage);

  return (
    <View style={[styles.item, !isLast && styles.itemBorder]}>
      <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
        {/* Mockup «Medicamentos de hoy»: cuadro ámbar de 40 px; el estado va a la derecha en texto. */}
        <IconTile tone="medication" icon={<Pill size={19} strokeWidth={2.2} color={t.accent.medFg} />} />
        <View style={styles.info}>
          <Text style={[styles.title, { color: t.text.primary }]} numberOfLines={1}>{event.data.name}</Text>
          <Text style={[styles.subtitle, { color: t.text.secondary }]}>
            {formatClock(event.intakeTime)} · {dose}
          </Text>
        </View>
      </TouchableOpacity>
      {/* «Tomar» → «✓ Tomado» con fade through (movimiento-interacciones.md §2 y §6). */}
      <FadeThrough value={doseState.kind}>
        {(kind) => (
          <>
            {kind === "pending" && onTake ? (
              <Button
                variant="success"
                icon={<Check size={16} strokeWidth={3} color={t.text.onSolid} />}
                onPress={onTake}
                disabled={taking}
                loading={taking}
                loadingLabel="Guardando…"
              >
                Tomar
              </Button>
            ) : null}
            {kind === "taken" ? (
              <Chip label="Tomado" tone="success" icon={<Check size={12} strokeWidth={3} color={t.status.successFg} />} />
            ) : null}
            {kind === "not-taken" ? <Chip label={doseState.reasonLabel ?? "No tomado"} tone="danger" /> : null}
            {kind === "later" ? <Chip label="Más tarde" tone="neutral" /> : null}
          </>
        )}
      </FadeThrough>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[1],
    },
    itemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: t.border.light,
    },
    row: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },
    info: {
      flex: 1,
      gap: 2,
    },
    // MASTER §5: dato en fila Inter 600, metadato Inter 400 13
    title: {
      fontSize: 14,
      fontFamily: nativeFont("body", 600),
    },
    subtitle: {
      fontSize: fontSize.sm,
      fontFamily: nativeFont("body", 400),
    },
  });
}
