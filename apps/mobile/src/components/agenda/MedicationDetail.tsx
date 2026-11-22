import { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Edit, Pill, Plus } from "lucide-react-native";
import {
  BottomSheet,
  Button,
  Chip,
  IconButton,
  IconTile,
  PressableScale,
  Skeleton,
  SkeletonGroup,
  TextField,
  contentEntering,
  fontSize,
  nativeFont,
  spacing,
  useAppTheme,
  useSkeletonVisible,
  type BottomSheetHandle,
  type ThemeContextValue,
} from "@helu/ui";
import { useMedicationByIdQuery, useUpdateMedicationMutation } from "@helu/api/hooks";
import type { Medication, MedicationCycle } from "@helu/api";
import { useQueryClient } from "@tanstack/react-query";
import { ScreenHeader } from "../ScreenHeader";
import { SkeletonHeaderAction } from "../SkeletonPieces";
import { notify } from "../../lib/notify";
import { PendingDoseButton } from "./PendingDoseButton";
import { CycleProgressBar } from "./CycleProgressBar";
import { doseStateForCycle } from "./doseRowState";
import { cycleDoseText } from "./medicationFormat";
import {
  CYCLE_STATUS_CHIP,
  cycleStatus,
  currentCycleOf,
  cycleDayProgress,
  formatCycleEnd,
  formatCycleRange,
  formatNextDose,
  isCycleActive,
} from "./medicationCycles";

export interface MedicationDetailProps {
  id: string;
  onBack: () => void;
  /** «Nuevo ciclo»: a new cycle for this medication */
  onAddCycle: (medicationName: string) => void;
  onOpenCycle: (cycleId: string, medicationName: string) => void;
}

function newestFirst(cycles: MedicationCycle[]): MedicationCycle[] {
  return [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));
}

/**
 * Mockup «Detalle de medicamento» (v2): header «Medicamento» with «Editar»; a card with the name, the
 * next dose and «Tomar» when one is pending (the screen's primary action); cycles grouped into
 * ACTIVOS / ANTERIORES with the green bar; «Nuevo ciclo» as a secondary action. Finishing or
 * deleting a cycle happens in its own detail.
 */
export function MedicationDetail({ id, onBack, onAddCycle, onOpenCycle }: MedicationDetailProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { data: med, isLoading } = useMedicationByIdQuery(id);
  const showSkeleton = useSkeletonVisible(isLoading);
  const [renaming, setRenaming] = useState(false);
  // The card the user tapped is in a cached list: it says how many cycles and whether «Tomar» shows,
  // so the skeleton has the shape of what arrives (§6c).
  const queryClient = useQueryClient();
  const hint = useMemo(() => {
    for (const [, data] of queryClient.getQueriesData<{ items?: Medication[] }>({ queryKey: ["medications"] })) {
      const found = data?.items?.find((m) => m.id === id);
      if (found) return found;
    }
    return undefined;
  }, [queryClient, id]);

  const sorted = useMemo(() => newestFirst(med?.cycles ?? []), [med?.cycles]);
  const active = sorted.filter((c) => isCycleActive(c));
  const finished = sorted.filter((c) => !isCycleActive(c));
  const doseCycle = med && active.length > 0 ? currentCycleOf(med) : undefined;

  if (showSkeleton) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader title="Medicamento" right={<SkeletonHeaderAction />} />
        <MedicationDetailSkeleton hint={hint} />
      </SafeAreaView>
    );
  }

  if (!med) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader title="Medicamento" />
        <View style={styles.centered}>
          <Text style={styles.h3}>No encontramos este medicamento</Text>
          <Text style={[styles.sub, styles.center]}>Puede que lo hayan eliminado.</Text>
          <Button variant="secondary" onPress={onBack}>
            Volver a Medicamentos
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const dose = doseCycle ? doseStateForCycle(doseCycle) : null;
  const next = doseCycle ? formatNextDose(doseCycle.nextIntakeTime) : "";
  // A pending dose whose slot already passed is overdue, not «next» (same wording as the list).
  const subtitle = next
    ? `${dose?.kind === "pending" ? "Toma pendiente" : "Próxima toma"}: ${next}`
    : doseCycle
      ? "Sin tomas pendientes"
      : formatCycleEnd(sorted[0]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Medicamento"
        right={
          <IconButton
            icon={<Edit size={17} color={t.text.onMuted} />}
            accessibilityLabel="Editar nombre del medicamento"
            onPress={() => setRenaming(true)}
          />
        }
      />

      <Animated.ScrollView entering={contentEntering} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <IconTile tone="medication" size="lg" icon={<Pill size={24} strokeWidth={2.2} color={t.accent.medFg} />} />
            <View style={styles.copy}>
              <Text style={styles.h2}>{med.name}</Text>
              <Text style={styles.sub}>{subtitle}</Text>
            </View>
          </View>
          {doseCycle ? <PendingDoseButton cycle={doseCycle} /> : null}
        </View>

        {active.length > 0 ? (
          <View style={styles.group}>
            <Text style={styles.eyebrow} accessibilityRole="header">
              Activos
            </Text>
            {active.map((cycle) => (
              <CycleSummaryCard key={cycle.id} cycle={cycle} active onPress={() => onOpenCycle(cycle.id, med.name)} />
            ))}
          </View>
        ) : null}

        {finished.length > 0 ? (
          <View style={styles.group}>
            <Text style={styles.eyebrow} accessibilityRole="header">
              Anteriores
            </Text>
            {finished.map((cycle) => (
              <CycleSummaryCard key={cycle.id} cycle={cycle} active={false} onPress={() => onOpenCycle(cycle.id, med.name)} />
            ))}
          </View>
        ) : null}

        <Button
          variant="secondary"
          fullWidth
          icon={<Plus size={17} strokeWidth={2.4} color={t.brand.text} />}
          onPress={() => onAddCycle(med.name)}
        >
          Nuevo ciclo
        </Button>
      </Animated.ScrollView>

      {renaming ? <RenameSheet id={med.id} name={med.name} onClose={() => setRenaming(false)} /> : null}
    </SafeAreaView>
  );
}

/** Compact cycle card: range, dose, status chip and, for an active cycle with an end, the green bar. */
function CycleSummaryCard({ cycle, active, onPress }: { cycle: MedicationCycle; active: boolean; onPress: () => void }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const progress = active ? cycleDayProgress(cycle) : null;
  const range = formatCycleRange(cycle);
  const doseText = cycleDoseText(cycle);
  const days = progress ? (progress.total != null ? `${progress.day} de ${progress.total} días` : `Día ${progress.day}`) : "";

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ciclo ${range}, ${doseText}, ${active ? "en curso" : "finalizado"}${days ? `, ${days}` : ""}`}
      style={[styles.card, styles.cardTight]}
    >
      <View style={styles.cycleRow}>
        <View style={styles.copy}>
          <Text style={styles.rowTitle}>{`Ciclo · ${range}`}</Text>
          <Text style={styles.meta}>{doseText}</Text>
        </View>
        <Chip label={CYCLE_STATUS_CHIP[cycleStatus(cycle)].label} tone={CYCLE_STATUS_CHIP[cycleStatus(cycle)].tone} />
      </View>
      {progress?.ratio != null ? (
        <CycleProgressBar ratio={progress.ratio} accessibilityLabel={`Ciclo: ${days}`} />
      ) : null}
      {days ? <Text style={styles.meta}>{days}</Text> : null}
    </PressableScale>
  );
}

/** «Editar» in the header: rename the medication (the only field the medication itself has). */
function RenameSheet({ id, name, onClose }: { id: string; name: string; onClose: () => void }) {
  const t = useAppTheme();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [value, setValue] = useState(name);
  const [submitted, setSubmitted] = useState(false);
  const mutation = useUpdateMedicationMutation();
  const error = submitted && !value.trim() ? "Escribe el nombre del medicamento." : undefined;

  const save = () => {
    setSubmitted(true);
    if (!value.trim()) return;
    if (value.trim() === name) return sheetRef.current?.close(onClose);
    mutation.mutate(
      { id, name: value.trim() },
      {
        onSuccess: () => sheetRef.current?.close(() => {
          onClose();
          notify({ message: "Nombre actualizado", description: value.trim() });
        }),
        onError: () =>
          notify({
            tone: "error",
            message: "No se pudo guardar",
            description: "Revisa tu conexión e intenta de nuevo.",
            action: { label: "Reintentar", onPress: save },
          }),
      },
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      eyebrow="MEDICAMENTO"
      title="Editar nombre"
      icon={<IconTile tone="medication" size="lg" round icon={<Pill size={24} strokeWidth={2.4} color={t.accent.medFg} />} />}
      dirty={value.trim() !== name}
      onClose={onClose}
    >
      <View style={{ gap: spacing[5] }}>
        <TextField label="Nombre" value={value} onChange={setValue} autoCapitalize="words" error={error} autoFocus />
        <Button size="lg" fullWidth onPress={save} loading={mutation.isPending} loadingLabel="Guardando…" disabled={mutation.isPending}>
          Guardar nombre
        </Button>
      </View>
    </BottomSheet>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing[3], padding: spacing[6] },
    // Kit `.card`: radio 18, borde 1 px + canto inferior, padding 16 y separación 12
    card: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      padding: spacing[4],
      gap: spacing[3],
    },
    cardTight: { gap: spacing[2] },
    summaryRow: { flexDirection: "row", alignItems: "center", gap: spacing[4] },
    cycleRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    group: { gap: spacing[3] },
    h2: { fontSize: 19, lineHeight: 23, fontFamily: nativeFont("heading", 900), color: t.text.primary },
    h3: { fontSize: fontSize.md, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    sub: { fontSize: 14, lineHeight: 21, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    center: { textAlign: "center" },
    // MASTER §5: eyebrow Nunito 900 11, mayúsculas, .08em
    eyebrow: {
      fontSize: fontSize.xs,
      fontFamily: nativeFont("heading", 900),
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: t.text.secondary,
    },
    rowTitle: { fontSize: 15, lineHeight: 20, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
  });
}

/** The detail while it loads: same cards, as many cycles as the cached card says, «Nuevo ciclo». */
function MedicationDetailSkeleton({ hint }: { hint?: Medication }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const cycles = hint?.cycles ?? [];
  const activeCount = hint ? cycles.filter((c) => isCycleActive(c)).length : 1;
  const finishedCount = hint ? cycles.length - activeCount : 0;
  const doseCycle = hint && activeCount > 0 ? currentCycleOf(hint) : undefined;
  const doseKind = doseCycle ? doseStateForCycle(doseCycle).kind : undefined;
  const showTake = Boolean(doseCycle?.nextIntakeTime) && (doseKind === "pending" || doseKind === "taken");
  return (
    <SkeletonGroup label="Cargando el medicamento" style={styles.content}>
      <View style={styles.card}>
        <View style={styles.summaryRow}>
          <Skeleton width={52} height={52} radius={16} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="60%" height={20} />
            <Skeleton width="55%" height={13} />
          </View>
        </View>
        {showTake ? <Skeleton height={52} radius={14} /> : null}
      </View>
      {activeCount > 0 ? (
        <View style={styles.group}>
          <Skeleton width={60} height={11} />
          {Array.from({ length: activeCount }, (_, i) => (
            <CycleCardSkeleton key={i} active />
          ))}
        </View>
      ) : null}
      {finishedCount > 0 ? (
        <View style={styles.group}>
          <Skeleton width={80} height={11} />
          {Array.from({ length: Math.min(finishedCount, 3) }, (_, i) => (
            <CycleCardSkeleton key={i} active={false} />
          ))}
        </View>
      ) : null}
      <Skeleton height={48} radius={14} />
    </SkeletonGroup>
  );
}

function CycleCardSkeleton({ active }: { active: boolean }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={[styles.card, styles.cardTight]}>
      <View style={styles.cycleRow}>
        {/* Blocks as tall as the text lines (20 and 18 px) so the card keeps its real height. */}
        <View style={[styles.copy, { gap: 6 }]}>
          <Skeleton width="65%" height={18} />
          <Skeleton width="45%" height={14} />
        </View>
        <Skeleton width={72} height={26} radius={13} />
      </View>
      {active ? (
        <>
          <Skeleton height={8} radius={4} />
          <Skeleton width="25%" height={16} />
        </>
      ) : null}
    </View>
  );
}
