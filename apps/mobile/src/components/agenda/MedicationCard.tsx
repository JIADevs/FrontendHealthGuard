import { useMemo, useRef, useState, useCallback, type ComponentRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Pill, Check, MoreVertical, Trash2 } from "lucide-react-native";
import type { Medication } from "@helu/api";
import { Button, Card, Chip, FadeThrough, PressableScale, Skeleton, radii, spacing, fontSize, nativeFont, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { AgendaRowActionsMenu, measureAgendaRowActionsMenuLeft } from "./AgendaRowActionsMenu";
import { formatDose, formatFrequency } from "./medicationFormat";
import { doseStateForCycle } from "./doseRowState";
import { CycleProgressBar } from "./CycleProgressBar";
import { currentCycleOf, cycleDayProgress, formatCycleEnd, formatNextDose, isMedicationActive, recentAdherence } from "./medicationCycles";

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
  // Without an end date there is no «X de N días»: the bar shows the last 7 days' doses instead.
  const adherence = progress && progress.total == null && cycle ? recentAdherence(cycle) : null;

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
      : adherence
        ? `${adherence.taken} de ${adherence.due} ${adherence.due === 1 ? "toma" : "tomas"} en ${adherence.days === 1 ? "1 día" : `${adherence.days} días`}`
        : `Día ${progress.day} del ciclo`
    : "";
  const barRatio = progress?.ratio ?? (adherence ? adherence.taken / adherence.due : null);
  const barLabel = adherence
    ? `Tomaste ${adherence.taken} de ${adherence.due} dosis en los últimos ${adherence.days === 1 ? "1 día" : `${adherence.days} días`}`
    : cycleLabel;

  return (
    <>
      {/* Tarjeta tocable (movimiento-interacciones.md §5): escala 0,98 + tinte, como la de Citas. */}
      <PressableScale
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
                          size="sm"
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
                {barRatio != null ? <CycleProgressBar ratio={barRatio} accessibilityLabel={barLabel} /> : null}
                {/* MASTER principle 4: dose times are clinical data, never cut — the row wraps instead. */}
                <View style={styles.metaRow}>
                  <Text style={[styles.metaText, overdue && styles.metaOverdue]}>{doseLine}</Text>
                  <Text style={styles.metaText}>{cycleLabel}</Text>
                </View>
              </View>
            ) : undefined
          }
        />
      </PressableScale>

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
    metaOverdue: { color: t.status.warningFg },
    metaRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", columnGap: spacing[3], rowGap: 2 },
    metaText: { fontSize: fontSize.sm, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
    // MASTER §6: 44 × 44 visibles
    menuButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  });
}

/**
 * A `MedicationCard` while it loads (§6c): same card, 40 px tile, name and two lines of dose, the
 * status chip and «⋯», and — for an active one — the cycle bar with «Próxima toma · Ciclo».
 */
export function MedicationCardSkeleton({ active = true }: { active?: boolean }) {
  const t = useAppTheme();
  return (
    <View
      style={{
        backgroundColor: t.surface.bgCard,
        borderRadius: radii.card,
        borderWidth: 1,
        borderBottomWidth: 4,
        borderColor: t.border.default,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing[3], padding: spacing[4] }}>
        <Skeleton width={40} height={40} radius={13} />
        <View style={{ flex: 1, gap: 6, paddingTop: 2 }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="80%" height={13} />
          <Skeleton width="30%" height={13} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}>
          <Skeleton width={88} height={32} radius={16} />
          <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
            <Skeleton width={4} height={16} radius={2} />
          </View>
        </View>
      </View>
      {active ? (
        <View style={{ gap: spacing[2], paddingHorizontal: spacing[4], paddingBottom: spacing[3] }}>
          <Skeleton height={8} radius={4} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Skeleton width="45%" height={13} />
            <Skeleton width="28%" height={13} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
