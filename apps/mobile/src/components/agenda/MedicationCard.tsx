import { useMemo, useRef, useState, useCallback, type ComponentRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Pill, Check, MoreVertical, Trash2 } from "lucide-react-native";
import type { Medication } from "@helu/api";
import { Button, Card, Chip, FadeThrough, spacing, fontSize, nativeFont, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { AgendaRowActionsMenu, measureAgendaRowActionsMenuLeft } from "./AgendaRowActionsMenu";
import { formatDose, formatFrequency } from "./medicationFormat";
import { doseStateForCycle } from "./doseRowState";
import { CycleProgressBar } from "./CycleProgressBar";
import { currentCycleOf, cycleDayProgress, formatCycleEnd, formatNextDose, isMedicationActive } from "./medicationCycles";

export interface MedicationCardProps {
  medication: Medication;
  onPress: () => void;
  onDelete: () => void;
  onIntake: (cycleId: string) => void;
  intakePending?: boolean;
}

/**
 * Medication row (mockups `m2-agenda.js` · Medicamentos, inicio-agenda.md · Medicamentos v2).
 * Active: dose action (pending «Tomar», «Tomado», reason, «Más tarde»), green cycle progress,
 * next dose and «Ciclo: X de N días». Finished: grey tile, end date and a «Finalizado» chip.
 */
export function MedicationCard({
  medication: m,
  onPress,
  onDelete,
  onIntake,
  intakePending = false,
}: MedicationCardProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const active = isMedicationActive(m);
  const cycle = currentCycleOf(m);
  const doseState = active && cycle ? doseStateForCycle(cycle) : null;
  const progress = active && cycle ? cycleDayProgress(cycle) : null;

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

  const subtitle = active && cycle
    ? `${formatDose(cycle.doseAmount, cycle.doseUnit, cycle.dosage)} · ${formatFrequency(cycle.frequency, cycle.frequencyUnit)}`
    : formatCycleEnd(cycle);

  const nextDose = active ? formatNextDose(cycle?.nextIntakeTime) : "";
  // A pending dose whose slot already passed is overdue, not «next» (the API keeps the oldest untaken slot).
  const overdue = doseState?.kind === "pending";
  const doseLine = nextDose
    ? `${overdue ? "Toma pendiente" : "Próxima toma"}: ${nextDose}`
    : "Sin tomas pendientes";
  const cycleLabel = progress
    ? progress.total != null
      ? `Ciclo: ${progress.day} de ${progress.total} días`
      : `Día ${progress.day} del ciclo`
    : "";

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${m.name}, ${active ? "activo" : "finalizado"}`}
      >
        <Card
          title={m.name}
          subtitle={subtitle}
          icon={<Pill size={20} color={active ? t.accent.medFg : t.text.muted} />}
          iconBackground={active ? t.accent.medBg : t.surface.muted}
          actions={
            <View style={styles.headerActions}>
              {active ? (
                <FadeThrough value={doseState?.kind ?? "none"}>
                  {(kind) => (
                    <>
                      {cycle && kind === "pending" ? (
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
                      {kind === "taken" ? (
                        <Chip label="Tomado" tone="success" icon={<Check size={12} strokeWidth={3} color={t.status.successFg} />} />
                      ) : null}
                      {kind === "not-taken" ? (
                        <Chip label={doseState?.reasonLabel ?? "No tomado"} tone="danger" />
                      ) : null}
                      {kind === "later" && cycle?.nextIntakeTime ? <Chip label="Más tarde" tone="neutral" /> : null}
                    </>
                  )}
                </FadeThrough>
              ) : (
                <Chip label="Finalizado" tone="neutral" />
              )}
              <View ref={menuTriggerRef} collapsable={false}>
                <TouchableOpacity
                  onPress={openMenu}
                  style={styles.menuButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Opciones de ${m.name}`}
                >
                  <MoreVertical size={20} color={t.text.muted} />
                </TouchableOpacity>
              </View>
            </View>
          }
          footerDivider={false}
          footer={
            progress ? (
              // Mockup: the bar and the meta row span the whole card, below the header row.
              <View style={styles.progress}>
                {progress.ratio != null ? (
                  <CycleProgressBar ratio={progress.ratio} accessibilityLabel={cycleLabel} />
                ) : null}
                <View style={styles.metaRow}>
                  <Text style={[styles.metaText, styles.metaGrow, overdue && styles.metaOverdue]} numberOfLines={1}>
                    {doseLine}
                  </Text>
                  <Text style={styles.metaText} numberOfLines={1}>{cycleLabel}</Text>
                </View>
              </View>
            ) : undefined
          }
        />
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
    progress: { flex: 1, gap: spacing[2] },
    metaGrow: { flex: 1 },
    metaOverdue: { color: t.status.warningFg },
    metaRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing[3] },
    metaText: { flexShrink: 1, fontSize: fontSize.sm, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
    // MASTER §6: 44 × 44 visibles
    menuButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  });
}
