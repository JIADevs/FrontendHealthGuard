import { useMemo, useRef, useState, useCallback, type ComponentRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Pill, Clock, Check, MoreVertical, Trash2 } from "lucide-react-native";
import type { Medication } from "@helu/api";
import { Button, Card, Chip, spacing, fontSize, nativeFont, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { AgendaRowActionsMenu, measureAgendaRowActionsMenuLeft } from "./AgendaRowActionsMenu";
import { formatDose, formatFrequency } from "./medicationFormat";
import { doseStateForCycle } from "./doseRowState";

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
  const doseState = cycle ? doseStateForCycle(cycle) : null;

  const menuTriggerRef = useRef<ComponentRef<typeof View>>(null);
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
          icon={<Pill size={20} color={t.accent.medFg} />}
          iconBackground={t.accent.medBg}
          actions={
            <View style={styles.headerActions}>
              {cycle && doseState?.kind === "pending" ? (
                <Button
                  variant="success"
                  onPress={() => onIntake(cycle.id)}
                  disabled={intakePending}
                  loading={intakePending}
                  loadingLabel="Guardando…"
                >
                  Tomar
                </Button>
              ) : null}
              {doseState?.kind === "taken" ? (
                <Chip label="Tomado" tone="success" icon={<Check size={12} strokeWidth={3} color={t.status.successFg} />} />
              ) : null}
              {doseState?.kind === "not-taken" ? (
                <Chip label={doseState.reasonLabel ?? "No tomado"} tone="danger" />
              ) : null}
              {doseState?.kind === "later" && cycle?.nextIntakeTime ? <Chip label="Más tarde" tone="neutral" /> : null}
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
    cardMetaText: { fontSize: fontSize.sm, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
    // MASTER §6: 44 × 44 visibles
    menuButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  });
}
