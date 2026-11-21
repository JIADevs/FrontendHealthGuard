import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SectionList, RefreshControl } from "react-native";
import Toast from "react-native-toast-message";
import {
  useDeleteAppointmentMutation,
} from "@helu/api/hooks";
import { isApiError, type Appointment } from "@helu/api";
import {
  spacing,
  nativeFont,
  radii,
  useAppTheme,
  formatApptDate,
  Pagination,
  cardContentStyle,
  Spinner,
  ConfirmModal,
  EmptyState,
  SearchField,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { CalendarDays, Filter } from "lucide-react-native";

import { useAppointmentsList } from "../../hooks/useAppointmentsList";
import { AgendaFAB } from "./AgendaFAB";
import { AppointmentCard } from "./AppointmentCard";
import { AppointmentsFilterSheet } from "./AppointmentsFilterSheet";

export function AppointmentsTab() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = require("@react-navigation/native").useNavigation();

  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);

  const {
    page,
    setPage,
    search,
    setSearch,
    appts,
    doctors,
    treatments,
    specialties,
    draftFilters,
    setDraftFilters,
    clearDraftFilters,
    filterSheetVisible,
    openFilterSheet,
    closeFilterSheet,
    applyFilters,
    hasActiveFilter,
  } = useAppointmentsList();

  const deleteMut = useDeleteAppointmentMutation();

  const totalPages = appts.data?.totalPages ?? 1;

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        Toast.show({ type: "success", text1: "Cita eliminada" });
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

  const items = appts.data?.items ?? [];
  const sections = useMemo(() => splitAppointments(items), [items]);

  return (
    <View style={styles.tabContent}>
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, especialidad o doctor..."
            accessibilityLabel="Buscar citas"
          />
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilter && styles.filterBtnActive]}
          onPress={openFilterSheet}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Abrir filtros de citas"
          accessibilityState={{ selected: hasActiveFilter }}
        >
          <Filter size={18} color={hasActiveFilter ? t.brand.fg : t.text.secondary} />
        </TouchableOpacity>
      </View>

      {appts.isLoading ? (
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(a) => a.id}
          contentContainerStyle={items.length === 0 ? styles.emptyListContent : cardContentStyle}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={appts.isRefetching}
              onRefresh={() => { void appts.refetch(); }}
              tintColor={t.brand.fg}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionTitle, { color: t.text.secondary }]}>{section.title}</Text>
          )}
          renderItem={({ item: a }) => (
            <AppointmentCard
              appointment={a}
              onPress={() => navigation.navigate("AppointmentDetail", { id: a.id })}
              onEdit={() => navigation.navigate("AppointmentForm", { id: a.id })}
              onDelete={() => setDeleteTarget(a)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<CalendarDays size={48} color={t.border.medium} />}
              message={
                hasActiveFilter
                  ? "No hay citas que coincidan con los filtros."
                  : "No tienes citas registradas."
              }
            />
          }
          ListFooterComponent={
            items.length > 0 ? (
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            ) : undefined
          }
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Eliminar Cita"
          message={`¿Eliminar la cita programada para el ${formatApptDate(deleteTarget.date)}?`}
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <AppointmentsFilterSheet
        visible={filterSheetVisible}
        draft={draftFilters}
        onChangeDraft={setDraftFilters}
        onClear={clearDraftFilters}
        onApply={applyFilters}
        onClose={closeFilterSheet}
        doctors={doctors}
        treatments={treatments}
        specialties={specialties}
      />

      <AgendaFAB onPress={() => navigation.navigate("AppointmentForm")} />
    </View>
  );
}

function appointmentStartMs(appointment: Appointment): number {
  const date = appointment.date?.slice(0, 10);
  const time = appointment.time?.slice(0, 5) ?? "00:00";
  if (!date) return 0;
  const ms = new Date(`${date}T${time}`).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function splitAppointments(items: Appointment[]) {
  const now = Date.now();
  const upcoming = items
    .filter((appointment) => appointmentStartMs(appointment) >= now)
    .sort((a, b) => appointmentStartMs(a) - appointmentStartMs(b));
  const previous = items
    .filter((appointment) => appointmentStartMs(appointment) < now)
    .sort((a, b) => appointmentStartMs(b) - appointmentStartMs(a));
  return [
    upcoming.length > 0 ? { title: "Próximas", data: upcoming } : null,
    previous.length > 0 ? { title: "Anteriores", data: previous } : null,
  ].filter((section): section is { title: string; data: Appointment[] } => section !== null);
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    tabContent: { flex: 1 },
    emptyListContent: { flexGrow: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[3], padding: spacing[6] },
    // Mockup: eyebrow «PRÓXIMAS» / «ANTERIORES» (Nunito 900 11, mayúsculas, .08em)
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
