import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Pill } from "lucide-react-native";
import {
  colors,
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { Medication } from "@helu/api";

/** Extrae HH:mm de un datetime ISO o time-only string. */
function extractTime(value: string): string {
  // If it looks like a time-only string ("08:00" or "08:00:00"), just slice
  if (/^\d{2}:\d{2}/.test(value) && !value.includes("T")) {
    return value.slice(0, 5);
  }
  // Otherwise parse as datetime and extract hours:minutes
  const d = new Date(value);
  if (isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface MedicationListItemProps {
  medication: Medication;
  onTake: (id: string) => void;
  onPress?: () => void;
  isLast?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MedicationListItem({ medication, onTake, onPress, isLast }: MedicationListItemProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const cycle = medication.cycles?.[0];

  return (
    <View style={[styles.item, !isLast && styles.itemBorder]}>
      <TouchableOpacity
        style={styles.infoRow}
        activeOpacity={0.7}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={[styles.iconWrap, { backgroundColor: t.accent.medBg }]}>
          <Pill size={18} color={t.accent.medFg} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: t.text.primary }]}>
            {medication.name}
          </Text>
          {cycle && (
            <Text style={[styles.subtitle, { color: t.text.secondary }]}>
              {cycle.dosage} · cada {cycle.frequency}h
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.rightCol}>
        {cycle && (
          <Text style={[styles.timeLabel, { color: t.text.secondary }]}>
            {extractTime(cycle.nextIntakeTime ?? cycle.firstIntakeTime)}
          </Text>
        )}
        {cycle && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: t.accent.medFg }]}
            activeOpacity={0.7}
            onPress={() => onTake(cycle.id)}
          >
            <Text style={styles.actionBtnText}>Tomar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[1],
    },
    infoRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
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
    rightCol: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
    timeLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
    },
    actionBtn: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: radii.sm,
    },
    actionBtnText: {
      color: colors.white,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
    },
  });
}
