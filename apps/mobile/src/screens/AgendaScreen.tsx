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

import { useMedicationForm } from "../hooks/useMedicationForm";
import { useWellbeingScreen } from "../hooks/useWellbeingScreen";

import {
  colors, palette,
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  appointmentStatusLabel,
  formatApptDate,
  Pagination,
  Card,
  cardContentStyle,
  Typography,
  ActionButton,
  Spinner,
  ConfirmModal,
  EmptyState,
  HeluAgendaCalendar,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  CalendarDays,
  Pill,
  Plus,
  Clock,
  MapPin,
  User,
  Check,
  CheckCircle,
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
  type AgendaView,
} from "../components/agenda";

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUSES = ["PROGRAMADA", "ASISTI", "CANCELADA", "NO_ASISTI"] as const;

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
  const [view, setView] = useState<AgendaView>("calendar");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const initialTab = (route.params as { initialTab?: string } | undefined)?.initialTab;
    if (isAgendaView(initialTab)) {
      setView(initialTab);
    }
  }, [(route.params as { initialTab?: string } | undefined)?.initialTab]);

  const isListView = view !== "calendar";

  return (
    <SafeAreaView style={styles.container}>
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
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [medicationFormOpen, setMedicationFormOpen] = useState(false);
  const [checkInFormOpen, setCheckInFormOpen] = useState(false);

  return (
    <View style={styles.tabContent}>
      <HeluAgendaCalendar />

      <AgendaFAB onPress={() => setAddSheetOpen(true)} />

      <AgendaAddSheet
        visible={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onAddAppointment={() => navigation.navigate("AppointmentForm" as never)}
        onAddMedication={() => setMedicationFormOpen(true)}
        onAddCheckIn={() => setCheckInFormOpen(true)}
      />

      {medicationFormOpen ? (
        <MedicationFormModal
          initial={null}
          onClose={() => setMedicationFormOpen(false)}
        />
      ) : null}

      {checkInFormOpen ? (
        <DailyCheckInForm onClose={() => setCheckInFormOpen(false)} />
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
      <View style={styles.addRow}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("AppointmentForm")}
        >
          <Plus size={16} color={colors.white} />
          <Text style={styles.addBtnText}>Nueva Cita</Text>
        </TouchableOpacity>
      </View>

      {appts.isLoading ? (
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={48} color={t.border.medium} />}
          message="No tienes citas registradas."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          contentContainerStyle={cardContentStyle}
          renderItem={({ item: a }) => (
            <TouchableOpacity onPress={() => navigation.navigate("AppointmentDetail", { id: a.id })}>
              <Card
                title={a.name || a.specialty || "Cita médica"}
                subtitle={
                <View style={{ gap: spacing[1] }}>
                  {a.doctor && (
                    <View style={styles.cardMeta}>
                      <User size={12} color={t.text.secondary} />
                      <Text style={styles.cardMetaText}>{a.doctor}</Text>
                    </View>
                  )}
                  {(a.location || a.videoCallLink) && (
                    <View style={styles.cardMeta}>
                      <MapPin size={12} color={t.text.secondary} />
                      <Text style={styles.cardMetaText}>
                        {a.modality === "VIRTUAL" ? "Virtual" : a.modality === "DOMICILIARIA" ? "Domiciliaria" : a.location}
                      </Text>
                    </View>
                  )}
                  <View style={styles.cardMeta}>
                    <Clock size={12} color={t.text.secondary} />
                    <Text style={styles.cardMetaText}>{formatApptDate(a.date)} {a.time?.slice(0, 5)}</Text>
                  </View>
                  {a.specialty && (
                    <Text style={styles.cardMetaText}>• {a.specialty}</Text>
                  )}
                  {a.cost && (
                    <Text style={styles.cardMetaText}>💰 ${a.cost}</Text>
                  )}
                </View>
              }
              icon={<CalendarDays size={20} color={t.brand.fg} />}
              iconBackground={t.brand.tintMed}
              actions={
                <View style={styles.cardActions}>
                  <ActionButton action="edit" size="sm" onPress={() => navigation.navigate("AppointmentForm", { id: a.id })} />
                  <ActionButton action="delete" size="sm" onPress={() => setDeleteTarget(a)} />
                </View>
              }
            >
              <View style={styles.statusRow}>
                {STATUSES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusPill, a.status === s && styles.statusPillActive]}
                    onPress={() => handleStatusChange(a.id, s)}
                  >
                    <Text style={[styles.statusPillText, a.status === s && styles.statusPillTextActive]}>
                      {appointmentStatusLabel(s)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
    </View>
  );
}

// ─── medications tab (sub-tabs: Medicamentos / Ciclos) ───────────────────────

function MedicationsTab() {
  const [subTab, setSubTab] = useState<"meds" | "cycles">("meds");
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

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
      <View style={styles.addRow}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("MedicationForm")}
        >
          <Plus size={16} color={colors.white} />
          <Text style={styles.addBtnText}>Nuevo Ciclo</Text>
        </TouchableOpacity>
      </View>

      {meds.isLoading ? (
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Pill size={48} color={t.border.medium} />}
          message="No tienes medicamentos registrados."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          contentContainerStyle={cardContentStyle}
          renderItem={({ item: m }) => {
            const cycle = m.cycles?.[0];
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate("MedicationDetail" as never, { id: m.id } as never)}
              >
                <Card
                  title={m.name}
                  subtitle={cycle ? `${formatDose(cycle.doseAmount, cycle.doseUnit, cycle.dosage)} — ${formatFrequency(cycle.frequency, cycle.frequencyUnit)}` : "Sin ciclo activo"}
                  icon={<Pill size={20} color={t.status.warningFg} />}
                  iconBackground={t.status.warningBg}
                  actions={
                    <View style={styles.cardActions}>
                      <ActionButton action="delete" size="sm" onPress={() => setDeleteTarget(m)} />
                    </View>
                  }
                >
                  {cycle?.reason ? (
                    <Text style={styles.cardMetaText}>{cycle.reason}</Text>
                  ) : null}
                  {cycle?.nextIntakeTime ? (
                    <View style={styles.cardMeta}>
                      <Clock size={12} color={t.text.secondary} />
                      <Text style={styles.cardMetaText}>
                        {new Date(cycle.nextIntakeTime).toLocaleString("es-CO", {
                          month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  ) : null}
                  {cycle ? (
                    <TouchableOpacity
                      style={styles.intakeBtn}
                      onPress={() => handleIntake(cycle.id)}
                      disabled={intakeMut.isPending}
                    >
                      <Check size={13} color={colors.white} />
                      <Text style={styles.intakeBtnText}>Tomado</Text>
                    </TouchableOpacity>
                  ) : null}
                </Card>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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

const DOSE_UNIT_LABELS_ES: Record<string, string> = {
  TABLET: "tableta(s)",
  ML:     "ml",
  DROPS:  "gotas",
  GRAMS:  "gramos",
  MG:     "mg",
  UNITS:  "unidad(es)",
};

function formatFrequency(freq: number, unit: string): string {
  const labels: Record<string, [string, string]> = {
    HOUR:  ["hora",    "horas"],
    DAY:   ["día",     "días"],
    WEEK:  ["semana",  "semanas"],
    MONTH: ["mes",     "meses"],
    YEAR:  ["año",     "años"],
  };
  const [s, p] = labels[unit] ?? [unit.toLowerCase(), unit.toLowerCase()];
  return `cada ${freq} ${freq === 1 ? s : p}`;
}

function formatDose(doseAmount: number | null | undefined, doseUnit: string | null | undefined, fallback: string): string {
  const unitLabel = doseUnit ? (DOSE_UNIT_LABELS_ES[doseUnit] ?? doseUnit.toLowerCase()) : "";
  if (doseAmount != null && unitLabel) return `${doseAmount} ${unitLabel}`;
  if (doseAmount != null) return String(doseAmount);
  return fallback;
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
      <View style={styles.addRow}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("MedicationForm")}
        >
          <Plus size={16} color={colors.white} />
          <Text style={styles.addBtnText}>Nuevo Ciclo</Text>
        </TouchableOpacity>
      </View>

      {meds.isLoading ? (
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      ) : cycleItems.length === 0 ? (
        <EmptyState
          icon={<Pill size={48} color={t.border.medium} />}
          message="No hay ciclos registrados."
        />
      ) : (
        <FlatList
          data={cycleItems}
          keyExtractor={(item) => item.cycle.id}
          contentContainerStyle={[cardContentStyle, { paddingBottom: 24 }]}
          renderItem={({ item }: { item: CycleItem }) => {
            const { cycle, medicationId, medicationName } = item;
            const active = isCycleActive(cycle);
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.cycleCard, { borderColor: t.border.light }]}
                onPress={() =>
                  navigation.navigate("CycleDetail" as never, {
                    cycleId: cycle.id,
                    medicationId,
                    medicationName,
                  } as never)
                }
              >
                {/* Encabezado */}
                <View style={styles.cycleCardHeader}>
                  <View style={styles.cycleCardTitleRow}>
                    <Pill size={14} color={t.accent.medFg} />
                    <Text style={[styles.cycleCardMedName, { color: t.text.primary }]} numberOfLines={1}>
                      {medicationName}
                    </Text>
                  </View>
                  <View style={styles.cycleCardRight}>
                    <View style={[
                      styles.cycleBadge,
                      { backgroundColor: active ? (t.status.successBg ?? t.accent.medBg) : t.surface.bg },
                    ]}>
                      <Text style={[
                        styles.cycleBadgeText,
                        { color: active ? (t.status.successFg ?? t.accent.medFg) : t.text.muted },
                      ]}>
                        {active ? "Activo" : "Finalizado"}
                      </Text>
                    </View>
                    <View style={styles.cycleCardActions}>
                      <ActionButton
                        action="edit"
                        size="sm"
                        onPress={() =>
                          navigation.navigate("MedicationForm", {
                            cycleId: cycle.id,
                            medicationId,
                            medicationName,
                          })
                        }
                      />
                      {active && (
                        <TouchableOpacity
                          style={[styles.finalizeIconBtn, { backgroundColor: t.status.warningBg ?? "#FFF3CD" }]}
                          activeOpacity={0.7}
                          onPress={() => setFinalizingItem(item)}
                        >
                          <CheckCircle size={14} color={t.status.warningFg ?? "#856404"} strokeWidth={2} />
                        </TouchableOpacity>
                      )}
                      <ActionButton
                        action="delete"
                        size="sm"
                        onPress={() => setDeletingItem(item)}
                      />
                    </View>
                  </View>
                </View>

                {/* Datos */}
                <View style={styles.cycleCardBody}>
                  <Text style={[styles.cycleCardDosage, { color: t.text.primary }]}>
                    {formatDose(cycle.doseAmount, cycle.doseUnit, cycle.dosage)}
                    <Text style={[styles.cycleCardFreq, { color: t.text.secondary }]}>
                      {" · "}{formatFrequency(cycle.frequency, cycle.frequencyUnit)}
                    </Text>
                  </Text>
                  <Text style={[styles.cycleCardDates, { color: t.text.secondary }]}>
                    {new Date(cycle.startDate).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                    {" → "}
                    {cycle.endDate
                      ? new Date(cycle.endDate).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
                      : "en curso"}
                  </Text>
                  {cycle.reason ? (
                    <Text style={[styles.cycleCardNote, { color: t.text.muted }]} numberOfLines={1}>
                      {cycle.reason}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
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

// ─── medication form modal ────────────────────────────────────────────────────

function MedicationFormModal({
  initial,
  onClose,
}: {
  initial: Medication | null;
  onClose: () => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const form = useMedicationForm({ initial, onClose });

  return (
    <Modal
      title={form.isEdit ? "Editar Medicamento" : "Nuevo Medicamento"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onPress={onClose}>Cancelar</Button>
          <Button onPress={form.handleSave} disabled={form.saving} loading={form.saving}>
            {form.isEdit ? "Guardar Cambios" : "Registrar"}
          </Button>
        </>
      }
    >
          <TextField label="Nombre del medicamento" value={form.name} onChange={form.setName} placeholder="Ej: Ibuprofeno 400mg" />
          <TextField label="Dosis" value={form.dosage} onChange={form.setDosage} placeholder="Ej: 1 tableta" />
          <TextField label="Frecuencia (horas)" value={form.frequency} onChange={form.setFrequency} placeholder="8" keyboardType="number-pad" />
          <DateTimePicker
            label="Inicio y primera toma"
            value={form.startDate && form.firstIntakeTime ? `${form.startDate}T${form.firstIntakeTime}` : ""}
            onChange={(v) => { form.setStartDate(v.slice(0, 10)); form.setFirstIntakeTime(v.slice(11, 16)); }}
            required
          />
          <TextField label="Indicaciones (opcional)" value={form.indications} onChange={form.setIndications} placeholder="Ej: Tomar con alimentos" />

          {form.error && <Text style={styles.errorText}>{form.error}</Text>}
    </Modal>
  );
}


// ConfirmModal is now available from @helu/ui — use <ConfirmModal /> when needed


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
    addRow:             { flexDirection: "row", justifyContent: "flex-end", padding: spacing[4] },
    addBtn:             { flexDirection: "row", alignItems: "center", gap: spacing[2], backgroundColor: t.brand.fg, paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radii.md },
    addBtnText:         { color: colors.white, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
    center:             { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[3], padding: spacing[6] },
    cardMeta:           { flexDirection: "row", alignItems: "center", gap: spacing[1] },
    cardMetaText:       { fontSize: fontSize.sm, color: t.text.secondary },
    cardActions:        { gap: spacing[2] },
    iconBtn:            { width: 34, height: 34, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: t.surface.bg },
    statusRow:          { flexDirection: "row", flexWrap: "wrap", gap: spacing[1], marginTop: spacing[1] },
    statusPill:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.full, backgroundColor: t.border.light, borderWidth: 1, borderColor: t.border.medium },
    statusPillActive:   { backgroundColor: t.brand.fg, borderColor: t.brand.fg },
    statusPillText:     { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: t.text.secondary },
    statusPillTextActive: { color: colors.white },
    intakeBtn:          { flexDirection: "row", alignItems: "center", gap: spacing[1], marginTop: spacing[1], backgroundColor: t.accent.notifFg, alignSelf: "flex-start", paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: radii.full },
    intakeBtnText:      { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },

    // Cycle card (CyclesTab)
    cycleCard:          { backgroundColor: t.surface.bgCard, borderRadius: radii.lg, borderWidth: 1, overflow: "hidden", marginHorizontal: spacing[4], marginBottom: spacing[3] },
    cycleCardHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing[3], paddingTop: spacing[3], paddingBottom: spacing[1] },
    cycleCardTitleRow:  { flexDirection: "row", alignItems: "center", gap: spacing[2], flex: 1, marginRight: spacing[2] },
    cycleCardMedName:   { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, flex: 1 },
    cycleBadge:         { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radii.full },
    cycleBadgeText:     { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
    cycleCardBody:      { paddingHorizontal: spacing[3], paddingBottom: spacing[3], gap: spacing[1] },
    cycleCardDosage:    { fontSize: fontSize.base, fontWeight: fontWeight.medium },
    cycleCardFreq:      { fontSize: fontSize.sm, fontWeight: fontWeight.normal },
    cycleCardDates:     { fontSize: fontSize.xs },
    cycleCardNote:      { fontSize: fontSize.xs },
    cycleCardRight:     { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    cycleCardActions:   { flexDirection: "column", alignItems: "center", gap: spacing[1] },
    finalizeIconBtn:    { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },

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
