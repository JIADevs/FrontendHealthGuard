import { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SectionList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {
  useAppointmentsQuery,
  useDeleteAppointmentMutation,
  useUpdateAppointmentStatusMutation,
  useMedicationsQuery,
  useDeleteMedicationMutation,
  useUpdateMedicationCycleMutation,
  useDeleteMedicationCycleMutation,
  useConfirmIntakeMutation,
} from "@helu/api/hooks";
import {
  isApiError,
  type Appointment,
  type Medication,
  type MedicationCycle,
  type DailyCheckIn,
} from "@helu/api";

import { useWellbeingScreen } from "../hooks/useWellbeingScreen";

import {
  colors, palette,
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  formatApptDate,
  Pagination,
  cardContentStyle,
  Typography,
  Button,
  Spinner,
  ConfirmModal,
  EmptyState,
  HeluAgendaCalendar,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  CalendarDays,
  Pill,
  Heart,
  Menu,
  ChevronLeft,
} from "lucide-react-native";

import {
  DailyCheckInListItem,
  DailyCheckInForm,
  WellbeingFAB,
  WellbeingHeader,
  AgendaMenuSheet,
  AgendaFAB,
  AgendaAddSheet,
  MedicationIntakeModal,
  AppointmentCard,
  MedicationCard,
  CycleCard,
  type AgendaView,
} from "../components/agenda";
import type { AgendaEvent } from "@helu/ui";

// ─── helpers ──────────────────────────────────────────────────────────────────

const LIST_VIEW_TITLES: Record<Exclude<AgendaView, "calendar">, string> = {
  appointments: "Citas",
  medications: "Medicamentos",
  wellbeing: "Bienestar",
};

function isAgendaView(value: string | undefined): value is AgendaView {
  return (
    value === "calendar" ||
    value === "appointments" ||
    value === "medications" ||
    value === "wellbeing"
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────

export function AgendaScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const route = useRoute();
  const navigation = useNavigation();
  const [view, setView] = useState<AgendaView>("calendar");
  const [menuOpen, setMenuOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [checkInFormOpen, setCheckInFormOpen] = useState(false);

  useEffect(() => {
    const initialTab = (route.params as { initialTab?: string } | undefined)?.initialTab;
    if (isAgendaView(initialTab)) {
      setView(initialTab);
    }
  }, [(route.params as { initialTab?: string } | undefined)?.initialTab]);

  const isListView = view !== "calendar";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        {isListView ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setView("calendar")}
            accessibilityLabel="Volver al calendario"
          >
            <ChevronLeft size={22} color={t.brand.fg} />
            <Text style={styles.backLabel}>Calendario</Text>
          </TouchableOpacity>
        ) : (
          <Typography variant="h2">Agenda Médica</Typography>
        )}

        {isListView && view !== "wellbeing" ? (
          <Typography variant="h3">{LIST_VIEW_TITLES[view]}</Typography>
        ) : !isListView ? (
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuOpen(true)}
            accessibilityLabel="Abrir menú de agenda"
          >
            <Menu size={22} color={t.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {view === "calendar" ? (
        <CalendarTab />
      ) : view === "appointments" ? (
        <AppointmentsTab />
      ) : view === "medications" ? (
        <MedicationsTab />
      ) : (
        <WellbeingTab />
      )}

      {view === "calendar" ? (
        <>
          <AgendaFAB onPress={() => setAddSheetOpen(true)} />

          <AgendaAddSheet
            visible={addSheetOpen}
            onClose={() => setAddSheetOpen(false)}
            onAddAppointment={() => navigation.navigate("AppointmentForm" as never)}
            onAddMedication={() => navigation.navigate("MedicationForm" as never)}
            onAddCheckIn={() => setCheckInFormOpen(true)}
          />

          {checkInFormOpen ? (
            <DailyCheckInForm onClose={() => setCheckInFormOpen(false)} />
          ) : null}
        </>
      ) : null}

      <AgendaMenuSheet
        visible={menuOpen}
        activeView={view}
        onClose={() => setMenuOpen(false)}
        onSelect={setView}
      />
    </SafeAreaView>
  );
}

// ─── calendar tab ─────────────────────────────────────────────────────────────

function CalendarTab() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation();
  const [intakeEvent, setIntakeEvent] = useState<Extract<AgendaEvent, { type: "medication" }> | null>(null);
  const [checkInEvent, setCheckInEvent] = useState<Extract<AgendaEvent, { type: "checkin" }> | null>(null);

  return (
    <View style={styles.tabContent}>
      <HeluAgendaCalendar
        onMedicationPress={setIntakeEvent}
        onAppointmentPress={(event) =>
          navigation.navigate("AppointmentDetail" as never, { id: event.data.id } as never)
        }
        onCheckInPress={setCheckInEvent}
      />

      {intakeEvent ? (
        <MedicationIntakeModal event={intakeEvent} onClose={() => setIntakeEvent(null)} />
      ) : null}

      {checkInEvent ? (
        <DailyCheckInForm
          onClose={() => setCheckInEvent(null)}
          initialValues={checkInEvent.data}
        />
      ) : null}
    </View>
  );
}

// ─── appointments tab ─────────────────────────────────────────────────────────

function AppointmentsTab() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = require("@react-navigation/native").useNavigation();

  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);

  const appts = useAppointmentsQuery("", page, 10);
  const statusMut = useUpdateAppointmentStatusMutation();
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

  const handleStatusChange = useCallback(
    (id: string, status: string) => {
      statusMut.mutate({ id, status });
    },
    [statusMut]
  );

  const items = appts.data?.items ?? [];

  return (
    <View style={styles.tabContent}>
      {appts.isLoading ? (
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          contentContainerStyle={items.length === 0 ? styles.emptyListContent : cardContentStyle}
          refreshControl={
            <RefreshControl
              refreshing={appts.isRefetching}
              onRefresh={() => appts.refetch()}
              tintColor={t.brand.fg}
            />
          }
          renderItem={({ item: a }) => (
            <AppointmentCard
              appointment={a}
              onPress={() => navigation.navigate("AppointmentDetail", { id: a.id })}
              onEdit={() => navigation.navigate("AppointmentForm", { id: a.id })}
              onDelete={() => setDeleteTarget(a)}
              onStatusChange={(status) => handleStatusChange(a.id, status)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<CalendarDays size={48} color={t.border.medium} />}
              message="No tienes citas registradas."
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
          title="Eliminar Cita"
          message={`¿Eliminar la cita programada para el ${formatApptDate(deleteTarget.date)}?`}
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <AgendaFAB onPress={() => navigation.navigate("AppointmentForm")} />
    </View>
  );
}

// ─── medications tab (sub-tabs: Medicamentos / Ciclos) ───────────────────────

function MedicationsTab() {
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

  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Medication | null>(null);

  const meds = useMedicationsQuery(page, 10);
  const intakeMut = useConfirmIntakeMutation();
  const deleteMut = useDeleteMedicationMutation();

  const totalPages = meds.data?.totalPages ?? 1;

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

  const items = meds.data?.items ?? [];

  return (
    <View style={{ flex: 1 }}>
      {meds.isLoading ? (
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
              refreshing={meds.isRefetching}
              onRefresh={() => meds.refetch()}
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
              message="No tienes medicamentos registrados."
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

  const meds     = useMedicationsQuery(1, 100);
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

// ─── wellbeing tab ────────────────────────────────────────────────────────────

function WellbeingTab() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [formTarget, setFormTarget] = useState<DailyCheckIn | "new" | null>(null);
  const screen = useWellbeingScreen();

  const handleEndReached = useCallback(() => {
    if (screen.hasNextPage && !screen.isFetchingNextPage) {
      screen.fetchNextPage();
    }
  }, [screen.hasNextPage, screen.isFetchingNextPage, screen.fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: DailyCheckIn }) => (
      <DailyCheckInListItem
        checkIn={item}
        onEdit={(checkIn) => setFormTarget(checkIn)}
      />
    ),
    [],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <View style={styles.wellbeingSectionHeader}>
        <Text style={styles.wellbeingSectionTitle}>{section.title}</Text>
      </View>
    ),
    [styles.wellbeingSectionHeader, styles.wellbeingSectionTitle],
  );

  return (
    <View style={styles.tabContent}>
      <WellbeingHeader total={screen.total} isLoading={screen.isLoading} />

      {screen.isLoading ? (
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      ) : screen.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            Error al cargar check-ins. Verificá tu conexión.
          </Text>
          <TouchableOpacity onPress={() => screen.refetch()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : screen.items.length === 0 ? (
        <EmptyState
          icon={<Heart size={48} color={t.border.medium} />}
          message="No tenés check-ins registrados."
          action={
            <Button onPress={() => setFormTarget("new")}>
              Registrar check-in
            </Button>
          }
        />
      ) : (
        <SectionList
          sections={screen.sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          refreshControl={
            <RefreshControl
              refreshing={screen.isRefetching}
              onRefresh={screen.refetch}
              tintColor={t.brand.fg}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.wellbeingListContent}
          ItemSeparatorComponent={() => <View style={styles.wellbeingItemSeparator} />}
          SectionSeparatorComponent={() => <View style={styles.wellbeingSectionSeparator} />}
          ListFooterComponent={
            screen.isFetchingNextPage ? (
              <ActivityIndicator style={styles.wellbeingListFooter} color={t.brand.fg} />
            ) : null
          }
        />
      )}

      <WellbeingFAB onPress={() => setFormTarget("new")} />

      {formTarget !== null && (
        <DailyCheckInForm
          onClose={() => setFormTarget(null)}
          initialValues={formTarget === "new" ? undefined : formTarget}
        />
      )}
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:          { flex: 1, backgroundColor: t.surface.bg },
    header:             {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
      backgroundColor: t.surface.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: t.border.medium,
    },
    backBtn:            { flexDirection: "row", alignItems: "center", gap: spacing[1], flex: 1 },
    backLabel:          { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: t.brand.fg },
    menuBtn:            { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radii.md },
    headerSpacer:       { width: 40 },
    tabContent:         { flex: 1 },
    emptyListContent:   { flexGrow: 1 },
    subTabBar:          { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: t.border.medium, backgroundColor: t.surface.bgCard },
    subTab:             { flex: 1, alignItems: "center", paddingVertical: spacing[3], borderBottomWidth: 2, borderBottomColor: "transparent" },
    subTabActive:       { borderBottomColor: t.brand.fg },
    subTabText:         { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: t.text.secondary },
    subTabTextActive:   { fontWeight: fontWeight.semibold, color: t.brand.fg },
    wellbeingListContent: { paddingBottom: spacing[12] + 56 },
    wellbeingSectionHeader: {
      paddingHorizontal: spacing[4],
      paddingTop: spacing[4],
      paddingBottom: spacing[2],
      backgroundColor: t.surface.bg,
    },
    wellbeingSectionTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
      textTransform: "capitalize",
    },
    wellbeingItemSeparator: {
      height: 1,
      backgroundColor: t.border.light,
      marginLeft: spacing[4] + 44 + spacing[3],
    },
    wellbeingSectionSeparator: {
      height: spacing[2],
    },
    wellbeingListFooter: {
      paddingVertical: spacing[4],
    },
    center:{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[3], padding: spacing[6] },
    iconBtn:            { width: 34, height: 34, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: t.surface.bg },

    fieldLabel:         { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: t.text.primary, marginBottom: spacing[2] },
    errorText:          { color: t.status.errorFg, fontSize: fontSize.sm, marginTop: spacing[3], backgroundColor: t.status.errorBg, padding: spacing[3], borderRadius: radii.sm },
    retryText:          { color: t.brand.fg, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginTop: spacing[2] },
    typeRow:            { flexDirection: "row", gap: spacing[2] },
    typePill:           { flex: 1, paddingVertical: spacing[2], borderRadius: radii.md, alignItems: "center", backgroundColor: t.surface.bg, borderWidth: 1, borderColor: t.border.medium },
    typePillActive:     { backgroundColor: t.brand.fg, borderColor: t.brand.fg },
    typePillText:       { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: t.text.secondary },
    typePillTextActive: { color: colors.white },
  });
}
