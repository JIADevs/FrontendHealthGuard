import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import Toast from "react-native-toast-message";
import {
  useMedicationsQuery,
  useDeleteMedicationMutation,
  useUpdateMedicationCycleMutation,
  useDeleteMedicationCycleMutation,
  useConfirmIntakeMutation,
} from "@helu/api/hooks";
import { isApiError, type Medication, type MedicationCycle } from "@helu/api";
import {
  spacing,
  radii,
  fontSize,
  fontWeight,
  useAppTheme,
  Pagination,
  cardContentStyle,
  Spinner,
  ConfirmModal,
  EmptyState,
  SearchField,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { Pill, Filter } from "lucide-react-native";

import { useMedicationsList } from "../../hooks/useMedicationsList";
import { AgendaFAB } from "./AgendaFAB";
import { MedicationCard } from "./MedicationCard";
import { CycleCard } from "./CycleCard";
import { MedicationsFilterSheet } from "./MedicationsFilterSheet";

// ─── medications tab (sub-tabs: Medicamentos / Ciclos) ───────────────────────

export function MedicationsTab() {
  const [subTab, setSubTab] = useState<"meds" | "cycles">("meds");
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = require("@react-navigation/native").useNavigation();

  return (
    <View style={styles.tabContent}>
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[styles.subTab, subTab === "meds" && styles.subTabActive]}
          onPress={() => setSubTab("meds")}
        >
          <Text style={[styles.subTabText, subTab === "meds" && styles.subTabTextActive]}>
            Medicamentos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTab, subTab === "cycles" && styles.subTabActive]}
          onPress={() => setSubTab("cycles")}
        >
          <Text style={[styles.subTabText, subTab === "cycles" && styles.subTabTextActive]}>
            Ciclos
          </Text>
        </TouchableOpacity>
      </View>
      {subTab === "meds" ? <MedicationsList /> : <CyclesList />}

      <AgendaFAB onPress={() => navigation.navigate("MedicationForm")} />
    </View>
  );
}

// ─── medications list ─────────────────────────────────────────────────────────

function MedicationsList() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = require("@react-navigation/native").useNavigation();

  const [deleteTarget, setDeleteTarget] = useState<Medication | null>(null);

  const {
    page,
    setPage,
    search,
    setSearch,
    items,
    totalPages,
    isLoading,
    isRefetching,
    refetch,
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

  const intakeMut = useConfirmIntakeMutation();
  const deleteMut = useDeleteMedicationMutation();

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

  const handleIntake = useCallback(
    (cycleId: string) => {
      intakeMut.mutate(cycleId, {
        onSuccess: () =>
          Toast.show({ type: "success", text1: "Toma confirmada" }),
        onError: () =>
          Toast.show({ type: "error", text1: "Error al confirmar toma" }),
      });
    },
    [intakeMut]
  );

  return (
    <View style={{ flex: 1 }}>
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

      {isLoading ? (
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          contentContainerStyle={items.length === 0 ? styles.emptyListContent : cardContentStyle}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={t.brand.fg}
            />
          }
          renderItem={({ item: m }) => (
            <MedicationCard
              medication={m}
              onPress={() => navigation.navigate("MedicationDetail" as never, { id: m.id } as never)}
              onDelete={() => setDeleteTarget(m)}
              onIntake={handleIntake}
              intakePending={intakeMut.isPending}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Pill size={48} color={t.border.medium} />}
              message={
                hasActiveFilter
                  ? "No hay medicamentos que coincidan con los filtros."
                  : "No tienes medicamentos registrados."
              }
            />
          }
          ListFooterComponent={
            items.length > 0 ? (
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            ) : null
          }
        />
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
    </View>
  );
}

// ─── cycles list ─────────────────────────────────────────────────────────────

type CycleItem = {
  cycle: MedicationCycle;
  medicationId: string;
  medicationName: string;
};

function isCycleActive(cycle: MedicationCycle): boolean {
  if (!cycle.endDate) return true;
  return new Date(cycle.endDate) >= new Date();
}

function CyclesList() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = require("@react-navigation/native").useNavigation();

  const [finalizingItem, setFinalizingItem] = useState<CycleItem | null>(null);
  const [deletingItem, setDeletingItem]     = useState<CycleItem | null>(null);

  const meds     = useMedicationsQuery("", 1, 100);
  const updateMut = useUpdateMedicationCycleMutation();
  const deleteMut = useDeleteMedicationCycleMutation();

  const cycleItems: CycleItem[] = useMemo(() => {
    const all = meds.data?.items ?? [];
    const flat: CycleItem[] = [];
    for (const med of all) {
      for (const cycle of med.cycles ?? []) {
        flat.push({ cycle, medicationId: med.id, medicationName: med.name });
      }
    }
    return flat.sort(
      (a, b) => new Date(b.cycle.startDate).getTime() - new Date(a.cycle.startDate).getTime(),
    );
  }, [meds.data]);

  function handleFinalize() {
    if (!finalizingItem) return;
    const today = new Date().toISOString().slice(0, 10);
    updateMut.mutate(
      { id: finalizingItem.cycle.id, cycle: { endDate: today } },
      {
        onSuccess: () => {
          setFinalizingItem(null);
          Toast.show({ type: "success", text1: "Ciclo finalizado" });
        },
        onError: (err) => Toast.show({
          type: "error",
          text1: "Error al finalizar",
          text2: isApiError(err) ? err.message : "Intenta de nuevo",
        }),
      },
    );
  }

  function handleDelete() {
    if (!deletingItem) return;
    deleteMut.mutate(deletingItem.cycle.id, {
      onSuccess: () => {
        setDeletingItem(null);
        Toast.show({ type: "success", text1: "Ciclo eliminado" });
      },
      onError: (err) => Toast.show({
        type: "error",
        text1: "Error al eliminar",
        text2: isApiError(err) ? err.message : "Intenta de nuevo",
      }),
    });
  }

  return (
    <View style={{ flex: 1 }}>
      {meds.isLoading ? (
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      ) : (
        <FlatList
          data={cycleItems}
          keyExtractor={(item) => item.cycle.id}
          contentContainerStyle={
            cycleItems.length === 0 ? styles.emptyListContent : [cardContentStyle, { paddingBottom: 24 }]
          }
          refreshControl={
            <RefreshControl
              refreshing={meds.isRefetching}
              onRefresh={() => meds.refetch()}
              tintColor={t.brand.fg}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Pill size={48} color={t.border.medium} />}
              message="No hay ciclos registrados."
            />
          }
          renderItem={({ item }: { item: CycleItem }) => {
            const { cycle, medicationId, medicationName } = item;
            const active = isCycleActive(cycle);
            return (
              <CycleCard
                cycle={cycle}
                medicationName={medicationName}
                active={active}
                onPress={() =>
                  navigation.navigate("CycleDetail" as never, {
                    cycleId: cycle.id,
                    medicationId,
                    medicationName,
                  } as never)
                }
                onEdit={() =>
                  navigation.navigate("MedicationForm", {
                    cycleId: cycle.id,
                    medicationId,
                    medicationName,
                  })
                }
                onFinalize={() => setFinalizingItem(item)}
                onDelete={() => setDeletingItem(item)}
              />
            );
          }}
        />
      )}

      {finalizingItem && (
        <ConfirmModal
          title="Finalizar ciclo"
          message={`¿Finalizar el ciclo de "${finalizingItem.medicationName}"? Se establecerá hoy como fecha de fin.`}
          confirmLabel="Finalizar"
          loading={updateMut.isPending}
          onConfirm={handleFinalize}
          onCancel={() => setFinalizingItem(null)}
        />
      )}

      {deletingItem && (
        <ConfirmModal
          title="Eliminar ciclo"
          message={`¿Eliminar este ciclo de "${deletingItem.medicationName}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeletingItem(null)}
        />
      )}
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    tabContent: { flex: 1 },
    emptyListContent: { flexGrow: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[3], padding: spacing[6] },
    subTabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: t.border.medium, backgroundColor: t.surface.bgCard },
    subTab: { flex: 1, alignItems: "center", paddingVertical: spacing[3], borderBottomWidth: 2, borderBottomColor: "transparent" },
    subTabActive: { borderBottomColor: t.brand.fg },
    subTabText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: t.text.secondary },
    subTabTextActive: { fontWeight: fontWeight.semibold, color: t.brand.fg },
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
    filterBtn: {
      width: 40,
      height: 40,
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
