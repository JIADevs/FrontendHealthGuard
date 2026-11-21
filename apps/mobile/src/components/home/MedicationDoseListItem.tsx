import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Pill, CheckCircle2, XCircle } from "lucide-react-native";
import { Button, radii, spacing, fontSize, fontWeight, useAppTheme, formatMedDose } from "@helu/ui";
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

function statusColors(t: ThemeContextValue, status: "TAKEN" | "NOT_TAKEN" | "PENDING") {
  if (status === "TAKEN") return { fg: t.status.successFg, bg: t.status.successBg };
  if (status === "NOT_TAKEN") return { fg: t.status.errorFg, bg: t.status.errorBg };
  return { fg: t.accent.medFg, bg: t.accent.medBg };
}

export function MedicationDoseListItem({ event, onPress, onTake, taking = false, isLast }: MedicationDoseListItemProps) {
  const t = useAppTheme();
  const doseState = doseStateForEvent(event);
  const status = doseState.kind === "taken" ? "TAKEN" : doseState.kind === "not-taken" ? "NOT_TAKEN" : "PENDING";
  const { fg, bg } = statusColors(t, status);
  const styles = useMemo(() => makeStyles(t), [t]);

  const dose = formatMedDose(event.data.doseAmount, event.data.doseUnit, event.data.dosage);
  const StatusIcon = status === "TAKEN" ? CheckCircle2 : status === "NOT_TAKEN" ? XCircle : Pill;

  return (
    <View style={[styles.item, !isLast && styles.itemBorder]}>
      <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
        <View style={[styles.iconWrap, { backgroundColor: bg }]}>
          <StatusIcon size={18} color={fg} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: t.text.primary }]}>{event.data.name}</Text>
          <Text style={[styles.subtitle, { color: t.text.secondary }]}>
            {dose} · {event.intakeTime}
          </Text>
        </View>
      </TouchableOpacity>
      {doseState.kind === "pending" && onTake ? (
        <Button
          variant="success"
          onPress={onTake}
          disabled={taking}
          loading={taking}
          loadingLabel="Guardando…"
        >
          Tomar
        </Button>
      ) : null}
      {doseState.kind === "taken" ? <Text style={styles.takenText}>Tomado</Text> : null}
      {doseState.kind === "not-taken" ? (
        <View style={styles.missedChip}>
          <Text style={styles.missedText}>{doseState.reasonLabel ?? "No tomado"}</Text>
        </View>
      ) : null}
      {doseState.kind === "later" ? (
        <View style={styles.laterChip}>
          <Text style={styles.laterText}>Más tarde</Text>
        </View>
      ) : null}
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
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
    },
    info: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.bold,
    },
    subtitle: {
      fontSize: fontSize.sm,
    },
    takenText: {
      color: t.status.successFg,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    missedChip: {
      alignSelf: "flex-start",
      backgroundColor: t.status.errorBg,
      borderRadius: radii.full,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
    },
    missedText: {
      color: t.status.errorFg,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    laterChip: {
      alignSelf: "flex-start",
      backgroundColor: t.border.light,
      borderRadius: radii.full,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
    },
    laterText: {
      color: t.text.secondary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
  });
}
