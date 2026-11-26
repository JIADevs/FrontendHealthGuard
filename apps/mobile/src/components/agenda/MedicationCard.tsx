import { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pill, Check, CircleX, Ellipsis, History, Pencil, Plus, Trash2 } from "lucide-react-native";
import type { Medication } from "@helu/api";
import {
  ActionSheet,
  Button,
  Card,
  Chip,
  FadeThrough,
  PressableScale,
  Skeleton,
  SwipeRow,
  radii,
  spacing,
  fontSize,
  nativeFont,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { swipeHaptic } from "../../lib/haptics";
import { formatDose, formatFrequency } from "./medicationFormat";
import { doseStateForCycle } from "./doseRowState";
import { CycleProgressBar } from "./CycleProgressBar";
import { currentCycleOf, cycleDayProgress, formatCycleEnd, formatNextDose, isMedicationActive, recentAdherence } from "./medicationCycles";

export interface MedicationCardProps {
  medication: Medication;
  onPress: () => void;
  onDelete: () => void;
  /** The cycle and the dose being taken (its scheduled slot), so the server records that dose. */
  onIntake: (cycleId: string, scheduledTime?: string | null) => void;
  intakePending?: boolean;
  /** Edit the current cycle (swipe «Editar», sheet «Editar») */
  onEditCycle: (cycleId: string) => void;
  onNewCycle: () => void;
  /** The cycle's detail, which holds «Historial de tomas» */
  onOpenCycle: (cycleId: string) => void;
  /** Asks to end the current cycle today (its own `ConfirmModal`) */
  onFinishCycle: (cycleId: string) => void;
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
  onEditCycle,
  onNewCycle,
  onOpenCycle,
  onFinishCycle,
}: MedicationCardProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const active = isMedicationActive(m);
  const cycle = currentCycleOf(m);
  const doseState = active && cycle ? doseStateForCycle(cycle) : null;
  const progress = active && cycle ? cycleDayProgress(cycle) : null;
  // Without an end date there is no «X de N días»: the bar shows the last 7 days' doses instead.
  const adherence = progress && progress.total == null && cycle ? recentAdherence(cycle) : null;

  const [sheet, setSheet] = useState(false);
  const WHITE = { size: 22, strokeWidth: 2.2, color: t.text.onSolid };
  const canTake = !!cycle && doseState?.kind === "pending" && !intakePending;
  const take = () => cycle && onIntake(cycle.id, cycle.nextIntakeTime);

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
      {/* Tarjeta tocable (movimiento-interacciones.md §5): escala 0,98 + tinte, como la de Citas.
          Acciones al deslizar (MASTER §7, #127): «Más» + «Editar» a la izquierda, «Tomar» a la derecha. */}
      <SwipeRow
        id={m.id}
        accessibilityLabel={`${m.name}, ${active ? "activo" : "finalizado"}`}
        onPress={onPress}
        endActions={[
          { key: "more", tone: "more", label: "Más", icon: <Ellipsis {...WHITE} />, onPress: () => setSheet(true) },
          ...(cycle ? [{ key: "edit", tone: "primary" as const, label: "Editar", icon: <Pencil {...WHITE} />, onPress: () => onEditCycle(cycle.id) }] : []),
        ]}
        startAction={canTake ? { key: "take", tone: "positive", label: "Tomar", icon: <Check {...WHITE} strokeWidth={3} />, onPress: take } : undefined}
        onLongPress={() => setSheet(true)}
        onHaptic={swipeHaptic}
      >
        <PressableScale onPress={onPress} accessible={false}>
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
                            onPress={() => onIntake(cycle.id, cycle.nextIntakeTime)}
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

      </SwipeRow>

      {sheet ? (
        <ActionSheet
          title={m.name}
          eyebrow={(active && cycle ? `Medicamento · ${formatFrequency(cycle.frequency, cycle.frequencyUnit)}` : "Medicamento · finalizado").toUpperCase()}
          tone="medication"
          icon={<Pill />}
          onClose={() => setSheet(false)}
          actions={[
            ...(canTake ? [{ key: "take", label: "Registrar toma", meta: nextDose ? `${overdue ? "Pendiente" : "Próxima"}: ${nextDose}` : undefined, icon: <Check />, onPress: take }] : []),
            ...(cycle ? [{ key: "edit", label: "Editar", icon: <Pencil />, onPress: () => onEditCycle(cycle.id) }] : []),
            { key: "new-cycle", label: "Nuevo ciclo", icon: <Plus />, onPress: onNewCycle },
            ...(cycle ? [{ key: "history", label: "Historial de tomas", icon: <History />, onPress: () => onOpenCycle(cycle.id) }] : []),
            // Finishing keeps the history, so it is not destructive (mockup module 14).
            ...(active && cycle
              ? [{ key: "finish", label: "Finalizar ciclo", meta: "Dejamos de recordarte las tomas", icon: <CircleX />, onPress: () => onFinishCycle(cycle.id) }]
              : []),
          ]}
          destructive={[
            { key: "delete", label: "Eliminar medicamento", meta: "Se borran sus ciclos, tomas y recordatorios", icon: <Trash2 />, onPress: onDelete },
          ]}
        />
      ) : null}
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
  });
}

/**
 * A `MedicationCard` while it loads (§6c): same card, 40 px tile, name and two lines of dose, the
 * status chip, and — for an active one — the cycle bar with «Próxima toma · Ciclo».
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
        <Skeleton width={88} height={32} radius={16} />
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
