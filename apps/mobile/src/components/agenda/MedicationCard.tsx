import { useMemo, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Pill, Clock, Check, MoreVertical, Trash2 } from "lucide-react-native";
import type { Medication } from "@helu/api";
import { Card, spacing, fontSize, fontWeight, radii, colors, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { AgendaRowActionsMenu, measureAgendaRowActionsMenuLeft } from "./AgendaRowActionsMenu";
import { formatDose, formatFrequency } from "./medicationFormat";

export interface MedicationCardProps {
  medication: Medication;
  onPress: () => void;
  onDelete: () => void;
  onIntake: (cycleId: string) => void;
  intakePending?: boolean;
}

export function MedicationCard({
  medication: m,
  onPress,
  onDelete,
  onIntake,
  intakePending = false,
}: MedicationCardProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const cycle = m.cycles?.[0];

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

  return (
    <>
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <Card
          title={m.name}
          subtitle={
            cycle
              ? `${formatDose(cycle.doseAmount, cycle.doseUnit, cycle.dosage)} — ${formatFrequency(cycle.frequency, cycle.frequencyUnit)}`
              : "Sin ciclo activo"
          }
          icon={<Pill size={20} color={t.status.warningFg} />}
          iconBackground={t.status.warningBg}
          actions={
            <View ref={menuTriggerRef} collapsable={false}>
              <TouchableOpacity
                onPress={openMenu}
                style={styles.menuButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Opciones de ${m.name}`}
              >
                <MoreVertical size={20} color={t.text.muted} />
              </TouchableOpacity>
            </View>
          }
        >
          {cycle?.reason ? <Text style={styles.cardMetaText}>{cycle.reason}</Text> : null}
          {cycle?.nextIntakeTime ? (
            <View style={styles.cardMeta}>
              <Clock size={12} color={t.text.secondary} />
              <Text style={styles.cardMetaText}>
                {new Date(cycle.nextIntakeTime).toLocaleString("es-CO", {
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ) : null}
          {cycle ? (
            <TouchableOpacity
              style={styles.intakeBtn}
              onPress={() => onIntake(cycle.id)}
              disabled={intakePending}
            >
              <Check size={13} color={colors.white} />
              <Text style={styles.intakeBtnText}>Tomado</Text>
            </TouchableOpacity>
          ) : null}
        </Card>
      </TouchableOpacity>

      <AgendaRowActionsMenu
        visible={menuVisible}
        top={menuTop}
        left={menuLeft}
        onClose={closeMenu}
        actions={[{ icon: Trash2, label: "Eliminar", onPress: onDelete, destructive: true }]}
      />
    </>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    cardMeta: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
    cardMetaText: { fontSize: fontSize.sm, color: t.text.secondary },
    menuButton: { padding: spacing[1] },
    intakeBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
      marginTop: spacing[1],
      backgroundColor: t.accent.notifFg,
      alignSelf: "flex-start",
      paddingHorizontal: spacing[3],
      paddingVertical: 4,
      borderRadius: radii.full,
    },
    intakeBtnText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  });
}
