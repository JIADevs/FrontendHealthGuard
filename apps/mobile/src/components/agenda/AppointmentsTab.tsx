import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, SectionList } from "react-native";
import {
  useDeleteAppointmentMutation,
} from "@helu/api/hooks";
import type { Appointment } from "@helu/api";
import {
  spacing,
  nativeFont,
  useAppTheme,
  formatApptDate,
  Pagination,
  cardContentStyle,
  SkeletonGroup,
  Skeleton,
  SkeletonCard,
  useSkeletonVisible,
  ConfirmModal,
  PullRefreshIndicator,
  usePullRefresh,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { CalendarDays } from "lucide-react-native";

import { useAppointmentsList } from "../../hooks/useAppointmentsList";
import { AgendaFAB } from "./AgendaFAB";
import { AgendaEmpty } from "./AgendaEmpty";
import { useAgendaNavigation } from "./AgendaNavigation";
import { AppointmentCard } from "./AppointmentCard";
import { AppointmentsFilterSheet } from "./AppointmentsFilterSheet";
import { LoadError } from "../states/LoadError";
import { notify } from "../../lib/notify";
import { AgendaListToolbar } from "./AgendaListToolbar";
import { AgendaFilterEmpty } from "./AgendaFilterEmpty";

export function AppointmentsTab() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const nav = useAgendaNavigation();

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
    filters,
    clearFilters,
    filterSheetVisible,
    openFilterSheet,
    closeFilterSheet,
    applyFilters,
    hasActiveFilter,
  } = useAppointmentsList();

  const deleteMut = useDeleteAppointmentMutation();

  const totalPages = appts.data?.totalPages ?? 1;
  const pull = usePullRefresh(appts.refetch, appts.dataUpdatedAt || undefined);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        notify({ message: "Cita eliminada" });
      },
      onError: () => {
        // MASTER §8: what happened + what to do. The modal stays open, so «Eliminar» is the retry.
        notify({ tone: "error", message: "No se pudo eliminar la cita", description: "Revisa tu conexión e intenta de nuevo." });
      },
    });
  }, [deleteTarget, deleteMut]);

  const items = appts.data?.items ?? [];
  const showSkeleton = useSkeletonVisible(appts.isLoading);
  const sections = useMemo(() => splitAppointments(items), [items]);

  return (
    <View style={styles.tabContent}>
      <AgendaListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por nombre, especialidad o doctor..."
        noun="citas"
        hasActiveFilter={hasActiveFilter}
        onOpenFilters={openFilterSheet}
      />

      {showSkeleton ? (
        // §6c: el buscador y los filtros se ven reales; las tarjetas son esqueleto.
        <SkeletonGroup label="Cargando citas" style={[cardContentStyle, { gap: spacing[3] }]}>
          <Skeleton width={90} height={11} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </SkeletonGroup>
      ) : (
        <View style={{ flex: 1 }}>
          <SectionList
            sections={sections}
            keyExtractor={(a) => a.id}
            contentContainerStyle={items.length === 0 ? styles.emptyListContent : cardContentStyle}
            stickySectionHeadersEnabled={false}
            refreshControl={pull.refreshControl}
            onScroll={pull.onScroll}
            scrollEventThrottle={16}
            renderSectionHeader={({ section }) => (
              <Text style={[styles.sectionTitle, { color: t.text.secondary }]}>{section.title}</Text>
            )}
            renderItem={({ item: a }) => (
              <AppointmentCard
                appointment={a}
                onPress={() => nav.openAppointment(a.id)}
                onEdit={() => nav.editAppointment(a.id)}
                onDelete={() => setDeleteTarget(a)}
              />
            )}
            ListEmptyComponent={
              appts.isError && !appts.data ? (
                <LoadError title="No se pudieron cargar tus citas" onRetry={() => void appts.refetch()} retrying={appts.isRefetching} />
              ) : hasActiveFilter || search ? (
                <AgendaFilterEmpty
                  noun="citas"
                  allYour="todas tus"
                  search={search}
                  hasActiveFilter={hasActiveFilter}
                  onClearFilters={clearFilters}
                  onClearSearch={() => setSearch("")}
                />
              ) : (
                <AgendaEmpty
                  pose="happy"
                  title="Aún no tienes citas"
                  description="Agrega tu próxima cita y te la recordamos antes de que llegue."
                  actionLabel="Agregar cita"
                  onAction={nav.newAppointment}
                  example={{
                    tone: "appointment",
                    icon: <CalendarDays size={19} strokeWidth={2.2} color={t.accent.calFg} />,
                    title: "Control de odontología",
                    meta: "Jue 5 nov · 10:00 a. m. · Consultorio 204",
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
        // MASTER §7: question + consequence; «Eliminar» borra la cita (≠ «Cancelar cita», que la conserva).
        <ConfirmModal
          title="¿Eliminar esta cita?"
          message={`Se borra la cita del ${formatApptDate(deleteTarget.date)} con sus recordatorios. No queda en tu historial y no se puede deshacer.`}
          keepLabel="Mantener cita"
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {filterSheetVisible ? (
        <AppointmentsFilterSheet
          initial={filters}
          doctors={doctors}
          treatments={treatments}
          specialties={specialties}
          onApply={applyFilters}
          onClose={closeFilterSheet}
        />
      ) : null}

      <AgendaFAB onPress={nav.newAppointment} />
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
  });
}
