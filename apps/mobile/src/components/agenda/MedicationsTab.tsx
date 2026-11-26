import { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, SectionList } from "react-native";
import { useDeleteMedicationMutation, useUpdateMedicationCycleMutation } from "@helu/api/hooks";
import type { Medication } from "@helu/api";
import {
  spacing,
  nativeFont,
  useAppTheme,
  Pagination,
  cardContentStyle,
  Skeleton,
  SkeletonGroup,
  useSkeletonVisible,
  ConfirmModal,
  Chip,
  PullRefreshIndicator,
  usePullRefresh,
  SwipeRowGroup,
} from "@helu/ui";
import type { SwipeRowGroupHandle, ThemeContextValue } from "@helu/ui";
import { Pill, Trash2 } from "lucide-react-native";

import { useMedicationsList } from "../../hooks/useMedicationsList";
import { AgendaEmpty } from "./AgendaEmpty";
import { AgendaFAB } from "./AgendaFAB";
import { useAgendaNavigation } from "./AgendaNavigation";
import { MedicationCard, MedicationCardSkeleton } from "./MedicationCard";
import { MedicationsFilterSheet } from "./MedicationsFilterSheet";
import { useTakeDose } from "./useTakeDose";
import { currentCycleOf, isMedicationActive, localTodayKey } from "./medicationCycles";
import { haptics } from "../../lib/haptics";
import { LoadError } from "../states/LoadError";
import { notify } from "../../lib/notify";
import { AgendaListToolbar } from "./AgendaListToolbar";
import { AgendaFilterEmpty } from "./AgendaFilterEmpty";

type MedicationSection = { title: string; data: Medication[] };

/**
 * Medicamentos (inicio-agenda.md · Medicamentos v2, mockup `m2-agenda.js` · Medicamentos):
 * one list grouped into «Activos» and «Finalizados». Cycles live in the medication detail
 * (ACTIVOS / ANTERIORES), so the old «Medicamentos / Ciclos» sub-tabs are gone.
 */
/** Measured on the real list: title 12 px from the toolbar and 29 px (center) to its first card; 46 px after a card. */
const SECTION_TITLE_SKELETON = { marginTop: spacing[3] + 1, marginBottom: spacing[3] };
const NEXT_SECTION_TITLE_SKELETON = { marginTop: 29, marginBottom: spacing[3] };

export function MedicationsTab() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const nav = useAgendaNavigation();

  const [deleteTarget, setDeleteTarget] = useState<Medication | null>(null);
  const [finishTarget, setFinishTarget] = useState<{ medication: Medication; cycleId: string } | null>(null);
  const rows = useRef<SwipeRowGroupHandle>(null);

  const {
    page,
    setPage,
    search,
    setSearch,
    items,
    totalPages,
    isLoading,
    isError,
    isRefetching,
    refetch,
    updatedAt,
    treatments,
    filters,
    clearFilters,
    filterSheetVisible,
    openFilterSheet,
    closeFilterSheet,
    applyFilters,
    hasActiveFilter,
  } = useMedicationsList();
  const pull = usePullRefresh(refetch, updatedAt);
  const showSkeleton = useSkeletonVisible(isLoading);
  const sections = useMemo(() => splitMedications(items), [items]);

  const deleteMut = useDeleteMedicationMutation();
  const takeDose = useTakeDose();

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteMut.mutate(target.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        notify({ message: "Medicamento eliminado", description: target.name });
      },
      onError: () => {
        // MASTER §8: what happened + what to do. The modal stays open, so «Eliminar» is the retry.
        notify({ tone: "error", message: "No se pudo eliminar el medicamento", description: "Revisa tu conexión e intenta de nuevo." });
      },
    });
  }, [deleteTarget, deleteMut]);

  // «Finalizar ciclo» from the «Más» sheet: same dialog and copy as the cycle detail.
  const finishMut = useUpdateMedicationCycleMutation();
  const handleFinish = useCallback(() => {
    if (!finishTarget) return;
    const { medication, cycleId } = finishTarget;
    finishMut.mutate(
      { id: cycleId, cycle: { endDate: localTodayKey() } },
      {
        onSuccess: () => {
          setFinishTarget(null);
          haptics.success();
          notify({ message: "Ciclo finalizado", description: medication.name });
        },
        onError: () => {
          // The modal stays open, so «Finalizar ciclo» is the retry.
          notify({ tone: "error", message: "No se pudo finalizar el ciclo", description: "Revisa tu conexión e intenta de nuevo." });
        },
      },
    );
  }, [finishTarget, finishMut]);

  return (
    <View style={styles.tabContent}>
      <AgendaListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por nombre..."
        noun="medicamentos"
        hasActiveFilter={hasActiveFilter}
        onOpenFilters={openFilterSheet}
      />

      {showSkeleton ? (
        // §6c: buscador y filtros reales; el grupo y las tarjetas, con el bloque de su botón.
        <SkeletonGroup label="Cargando medicamentos" style={[cardContentStyle, { gap: spacing[3] }]}>
          {/* Group titles sit like `styles.sectionTitle`: 12 px above, 8 px to the first card. */}
          <Skeleton width={70} height={11} style={SECTION_TITLE_SKELETON} />
          <MedicationCardSkeleton />
          <MedicationCardSkeleton />
          <Skeleton width={90} height={11} style={NEXT_SECTION_TITLE_SKELETON} />
          <MedicationCardSkeleton active={false} />
        </SkeletonGroup>
      ) : (
        <SwipeRowGroup ref={rows}>
          <View style={{ flex: 1 }}>
            <SectionList
              sections={sections}
              keyExtractor={(m) => m.id}
              contentContainerStyle={items.length === 0 ? styles.emptyListContent : cardContentStyle}
              stickySectionHeadersEnabled={false}
              refreshControl={pull.refreshControl}
              onScroll={pull.onScroll}
              onScrollBeginDrag={() => rows.current?.closeAll()}
              scrollEventThrottle={16}
              renderSectionHeader={({ section }) => (
                <Text style={[styles.sectionTitle, { color: t.text.secondary }]} accessibilityRole="header">
                  {section.title}
                </Text>
              )}
              renderItem={({ item: m }) => (
                <MedicationCard
                  medication={m}
                  onPress={() => nav.openMedication(m.id)}
                  onDelete={() => setDeleteTarget(m)}
                  onIntake={takeDose.take}
                  intakePending={!!takeDose.takingCycleId && takeDose.takingCycleId === currentCycleOf(m)?.id}
                  onEditCycle={(cycleId) => nav.editMedicationCycle(m.id, m.name, cycleId)}
                  onNewCycle={() => nav.newMedicationCycle(m.id, m.name)}
                  onOpenCycle={(cycleId) => nav.openMedicationCycle(m.id, m.name, cycleId)}
                  onFinishCycle={(cycleId) => setFinishTarget({ medication: m, cycleId })}
                />
              )}
              ListEmptyComponent={
                isError ? (
                  <LoadError title="No se pudieron cargar tus medicamentos" onRetry={() => void refetch()} retrying={isRefetching} />
                ) : hasActiveFilter || search ? (
                  <AgendaFilterEmpty
                    noun="medicamentos"
                    allYour="todos tus"
                    search={search}
                    hasActiveFilter={hasActiveFilter}
                    onClearFilters={clearFilters}
                    onClearSearch={() => setSearch("")}
                  />
                ) : (
                  <AgendaEmpty
                    pose="point"
                    title="Aún no tienes medicamentos"
                    description="Registra uno y te avisamos en cada toma. Tú solo tocas «Tomar»."
                    actionLabel="Agregar medicamento"
                    onAction={nav.newMedication}
                    example={{
                      tone: "medication",
                      icon: <Pill size={19} strokeWidth={2.2} color={t.accent.medFg} />,
                      title: "Losartán 50 mg",
                      meta: "Cada 12 horas · 7:00 a. m. y 7:00 p. m.",
                      trailing: <Chip label="Tomar" tone="success" />,
                    }}
                  />
                )
              }
              ListFooterComponent={
                items.length > 0 ? (
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                ) : undefined
              }
            />
            <PullRefreshIndicator state={pull} />
          </View>
        </SwipeRowGroup>
      )}

      {finishTarget ? (
        <ConfirmModal
          title="¿Finalizar ciclo?"
          message="El ciclo termina hoy y dejamos de recordarte las tomas. Seguirás viéndolo en «Anteriores»."
          keepLabel="Mantener ciclo"
          confirmLabel="Finalizar ciclo"
          confirmVariant="primary"
          icon={<Pill />}
          iconTone="warning"
          loading={finishMut.isPending}
          onCancel={() => setFinishTarget(null)}
          onConfirm={handleFinish}
        />
      ) : null}

      {deleteTarget && (
        // MASTER §7 «Diálogo de confirmación»: question + consequence, the safe option first with its own name.
        <ConfirmModal
          title="¿Eliminar este medicamento?"
          message={`Se borran «${deleteTarget.name}», sus ciclos, las tomas registradas y los recordatorios. No se puede deshacer.`}
          keepLabel="Mantener medicamento"
          icon={<Trash2 />}
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {filterSheetVisible ? (
        <MedicationsFilterSheet initial={filters} treatments={treatments} onApply={applyFilters} onClose={closeFilterSheet} />
      ) : null}

      {/* One primary action (MASTER §2): an empty list already offers «Agregar …» in its empty state. */}
      {!showSkeleton && !isError && items.length === 0 && !hasActiveFilter && !search ? null : <AgendaFAB onPress={nav.newMedication} />}
    </View>
  );
}

/** «Activos» first (server order), then «Finalizados»; empty groups are left out. */
function splitMedications(items: Medication[]): MedicationSection[] {
  const now = Date.now();
  const active = items.filter((m) => isMedicationActive(m, now));
  const finished = items.filter((m) => !isMedicationActive(m, now));
  return [
    active.length > 0 ? { title: "Activos", data: active } : null,
    finished.length > 0 ? { title: "Finalizados", data: finished } : null,
  ].filter((section): section is MedicationSection => section !== null);
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    tabContent: { flex: 1 },
    emptyListContent: { flexGrow: 1 },
    // Mockup: eyebrow «ACTIVOS» / «FINALIZADOS» (Nunito 900 11, mayúsculas, .08em), como en Citas
    sectionTitle: {
      fontSize: 11,
      fontFamily: nativeFont("heading", 900),
      letterSpacing: 0.9,
      textTransform: "uppercase",
      marginTop: spacing[3],
      marginBottom: spacing[2],
    },
  });
}
