import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SectionList } from "react-native";
import Toast from "react-native-toast-message";
import { useDeleteMedicationMutation } from "@helu/api/hooks";
import { isApiError, type Medication } from "@helu/api";
import {
  spacing,
  radii,
  nativeFont,
  useAppTheme,
  Pagination,
  cardContentStyle,
  Skeleton,
  SkeletonGroup,
  SkeletonCard,
  useSkeletonVisible,
  ConfirmModal,
  Chip,
  EmptyState,
  SearchField,
  PullRefreshIndicator,
  usePullRefresh,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { Pill, Filter } from "lucide-react-native";

import { useMedicationsList } from "../../hooks/useMedicationsList";
import { AgendaEmpty } from "./AgendaEmpty";
import { AgendaFAB } from "./AgendaFAB";
import { useAgendaNavigation } from "./AgendaNavigation";
import { MedicationCard } from "./MedicationCard";
import { MedicationsFilterSheet } from "./MedicationsFilterSheet";
import { useTakeDose } from "./useTakeDose";
import { currentCycleOf, isMedicationActive } from "./medicationCycles";

type MedicationSection = { title: string; data: Medication[] };

/**
 * Medicamentos (inicio-agenda.md · Medicamentos v2, mockup `m2-agenda.js` · Medicamentos):
 * one list grouped into «Activos» and «Finalizados». Cycles live in the medication detail
 * (ACTIVOS / ANTERIORES), so the old «Medicamentos / Ciclos» sub-tabs are gone.
 */
export function MedicationsTab() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const nav = useAgendaNavigation();

  const [deleteTarget, setDeleteTarget] = useState<Medication | null>(null);

  const {
    page,
    setPage,
    search,
    setSearch,
    items,
    totalPages,
    isLoading,
    refetch,
    updatedAt,
    treatments,
    draftFilters,
    setDraftFilters,
    clearDraftFilters,
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
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        Toast.show({ type: "success", text1: "Medicamento eliminado" });
      },
      onError: (err) => {
        Toast.show({
          type: "error",
          text1: "Error al eliminar",
          text2: isApiError(err) ? err.message : "Intenta de nuevo",
        });
      },
    });
  }, [deleteTarget, deleteMut]);

  return (
    <View style={styles.tabContent}>
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre..."
            accessibilityLabel="Buscar medicamentos"
          />
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilter && styles.filterBtnActive]}
          onPress={openFilterSheet}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Abrir filtros de medicamentos"
          accessibilityState={{ selected: hasActiveFilter }}
        >
          <Filter size={18} color={hasActiveFilter ? t.brand.fg : t.text.secondary} />
        </TouchableOpacity>
      </View>

      {showSkeleton ? (
        // §6c: buscador y filtros reales; el grupo y las tarjetas, con el bloque de su botón.
        <SkeletonGroup label="Cargando medicamentos" style={[cardContentStyle, { gap: spacing[3] }]}>
          <Skeleton width={70} height={11} />
          <SkeletonCard lines={2} action />
          <SkeletonCard lines={2} action />
          <SkeletonCard lines={2} action />
        </SkeletonGroup>
      ) : (
        <View style={{ flex: 1 }}>
          <SectionList
            sections={sections}
            keyExtractor={(m) => m.id}
            contentContainerStyle={items.length === 0 ? styles.emptyListContent : cardContentStyle}
            stickySectionHeadersEnabled={false}
            refreshControl={pull.refreshControl}
            onScroll={pull.onScroll}
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
              />
            )}
            ListEmptyComponent={
              hasActiveFilter || search ? (
                <EmptyState
                  icon={<Pill size={48} color={t.border.medium} />}
                  message="No hay medicamentos que coincidan con los filtros."
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
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Eliminar Medicamento"
          message={`¿Eliminar "${deleteTarget.name}"? Los ciclos y recordatorios también se eliminarán.`}
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <MedicationsFilterSheet
        visible={filterSheetVisible}
        draft={draftFilters}
        onChangeDraft={setDraftFilters}
        onClear={clearDraftFilters}
        onApply={applyFilters}
        onClose={closeFilterSheet}
        treatments={treatments}
      />

      <AgendaFAB onPress={nav.newMedication} />
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
    toolbar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      paddingHorizontal: spacing[4],
      paddingTop: spacing[3],
    },
    searchWrap: {
      flex: 1,
    },
    // Mockup: 46 × 46, radio 14 (MASTER §6: mínimo 44)
    filterBtn: {
      width: 46,
      height: 46,
      borderRadius: radii.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.border.light,
      borderWidth: 1,
      borderColor: t.border.medium,
    },
    filterBtnActive: {
      backgroundColor: t.brand.tint,
      borderColor: t.brand.tintBorder,
    },
  });
}
