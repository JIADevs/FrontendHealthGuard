import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Pill, CheckCircle2, XCircle } from "lucide-react-native";
import { radii, spacing, fontSize, fontWeight, useAppTheme, formatMedDose } from "@helu/ui";
import type { ThemeContextValue, AgendaEvent } from "@helu/ui";

type MedicationEvent = Extract<AgendaEvent, { type: "medication" }>;

interface MedicationDoseListItemProps {
  event: MedicationEvent;
  onPress: () => void;
  isLast?: boolean;
}

function statusColors(t: ThemeContextValue, status: "TAKEN" | "NOT_TAKEN" | "PENDING") {
  if (status === "TAKEN") return { fg: t.status.successFg, bg: t.status.successBg };
  if (status === "NOT_TAKEN") return { fg: t.status.errorFg, bg: t.status.errorBg };
  return { fg: t.accent.medFg, bg: t.accent.medBg };
}

export function MedicationDoseListItem({ event, onPress, isLast }: MedicationDoseListItemProps) {
  const t = useAppTheme();
  const status = event.intake?.status ?? "PENDING";
  const { fg, bg } = statusColors(t, status);
  const styles = useMemo(() => makeStyles(t), [t]);

  const dose = formatMedDose(event.data.doseAmount, event.data.doseUnit, event.data.dosage);
  const statusLabel = status === "TAKEN" ? "Tomado" : status === "NOT_TAKEN" ? "No tomado" : "Pendiente";
  const StatusIcon = status === "TAKEN" ? CheckCircle2 : status === "NOT_TAKEN" ? XCircle : Pill;

  return (
    <TouchableOpacity
      style={[styles.item, !isLast && styles.itemBorder]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <StatusIcon size={18} color={fg} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: t.text.primary }]}>{event.data.name}</Text>
        <Text style={[styles.subtitle, { color: t.text.secondary }]}>
          {dose} · {event.intakeTime}
        </Text>
      </View>
      <Text style={[styles.statusLabel, { color: fg }]}>{statusLabel}</Text>
    </TouchableOpacity>
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
    statusLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
    },
  });
}
