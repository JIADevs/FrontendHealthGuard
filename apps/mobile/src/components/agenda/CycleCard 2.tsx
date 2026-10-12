import { useMemo, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Pill, MoreVertical, Pencil, CheckCircle, Trash2 } from "lucide-react-native";
import type { MedicationCycle } from "@helu/api";
import { spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { AgendaRowActionsMenu, measureAgendaRowActionsMenuLeft, type AgendaRowAction } from "./AgendaRowActionsMenu";
import { formatDose, formatFrequency } from "./medicationFormat";

export interface CycleCardProps {
  cycle: MedicationCycle;
  medicationName: string;
  active: boolean;
  onPress: () => void;
  onEdit: () => void;
  onFinalize: () => void;
  onDelete: () => void;
}

export function CycleCard({
  cycle,
  medicationName,
  active,
  onPress,
  onEdit,
  onFinalize,
  onDelete,
}: CycleCardProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const menuTriggerRef = useRef<View>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const [menuLeft, setMenuLeft] = useState(0);

  const openMenu = useCallback(() => {
    menuTriggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuTop(y + height + spacing[1]);
      setMenuLeft(measureAgendaRowActionsMenuLeft(x, width));
      setMenuVisible(true);
    });
  }, []);

  const closeMenu = useCallback(() => setMenuVisible(false), []);

  const menuActions: AgendaRowAction[] = [
    { icon: Pencil, label: "Editar", onPress: onEdit },
    ...(active ? [{ icon: CheckCircle, label: "Finalizar", onPress: onFinalize }] : []),
    { icon: Trash2, label: "Eliminar", onPress: onDelete, destructive: true },
  ];

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.cycleCard, { borderColor: t.border.light }]}
        onPress={onPress}
      >
        <View style={styles.cycleCardHeader}>
          <View style={styles.cycleCardTitleRow}>
            <Pill size={14} color={t.accent.medFg} />
            <Text style={[styles.cycleCardMedName, { color: t.text.primary }]} numberOfLines={1}>
              {medicationName}
            </Text>
          </View>
          <View style={styles.cycleCardRight}>
            <View
              style={[
                styles.cycleBadge,
                { backgroundColor: active ? (t.status.successBg ?? t.accent.medBg) : t.surface.bg },
              ]}
            >
              <Text
                style={[
                  styles.cycleBadgeText,
                  { color: active ? (t.status.successFg ?? t.accent.medFg) : t.text.muted },
                ]}
              >
                {active ? "Activo" : "Finalizado"}
              </Text>
            </View>

            <View ref={menuTriggerRef} collapsable={false}>
              <TouchableOpacity
                onPress={openMenu}
                style={styles.menuButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Opciones del ciclo de ${medicationName}`}
              >
                <MoreVertical size={18} color={t.text.muted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.cycleCardBody}>
          <Text style={[styles.cycleCardDosage, { color: t.text.primary }]}>
            {formatDose(cycle.doseAmount, cycle.doseUnit, cycle.dosage)}
            <Text style={[styles.cycleCardFreq, { color: t.text.secondary }]}>
              {" · "}
              {formatFrequency(cycle.frequency, cycle.frequencyUnit)}
            </Text>
          </Text>
          <Text style={[styles.cycleCardDates, { color: t.text.secondary }]}>
            {new Date(cycle.startDate).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
            {" → "}
            {cycle.endDate
              ? new Date(cycle.endDate).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
              : "en curso"}
          </Text>
          {cycle.reason ? (
            <Text style={[styles.cycleCardNote, { color: t.text.muted }]} numberOfLines={1}>
              {cycle.reason}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>

      <AgendaRowActionsMenu
        visible={menuVisible}
        top={menuTop}
        left={menuLeft}
        onClose={closeMenu}
        actions={menuActions}
      />
    </>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    cycleCard: {
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      borderWidth: 1,
      overflow: "hidden",
      marginHorizontal: spacing[4],
      marginBottom: spacing[3],
    },
    cycleCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing[3],
      paddingTop: spacing[3],
      paddingBottom: spacing[1],
    },
    cycleCardTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing[2], flex: 1, marginRight: spacing[2] },
    cycleCardMedName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, flex: 1 },
    cycleBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radii.full },
    cycleBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
    cycleCardBody: { paddingHorizontal: spacing[3], paddingBottom: spacing[3], gap: spacing[1] },
    cycleCardDosage: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
    cycleCardFreq: { fontSize: fontSize.sm, fontWeight: fontWeight.normal },
    cycleCardDates: { fontSize: fontSize.xs },
    cycleCardNote: { fontSize: fontSize.xs },
    cycleCardRight: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    menuButton: { padding: spacing[1] },
  });
}
