import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  useAppointmentsQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useDeleteAppointmentMutation,
  useUpdateAppointmentStatusMutation,
  useMedicationsQuery,
  useCreateMedicationMutation,
  useUpdateMedicationMutation,
  useDeleteMedicationMutation,
  useConfirmIntakeMutation,
} from "@healthguard/api/hooks";
import {
  isApiError,
  type Appointment,
  type AppointmentCreate,
  type Medication,
  type MedicationCreate,
} from "@healthguard/api";
import {
  colors,
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  appointmentStatusLabel,
} from "@healthguard/ui";
import type { ThemeContextValue } from "@healthguard/ui";
import {
  CalendarDays,
  Pill,
  Plus,
  Clock,
  MapPin,
  User,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatApptDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

const STATUSES = ["PENDING", "COMPLETED", "CANCELLED", "RESCHEDULED"] as const;
type ApptStatus = (typeof STATUSES)[number];

// ─── main screen ──────────────────────────────────────────────────────────────

export function AgendaScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [tab, setTab] = useState<"appointments" | "medications">("appointments");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda Médica</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "appointments" && styles.tabActive]}
          onPress={() => setTab("appointments")}
        >
          <CalendarDays
            size={14}
            color={tab === "appointments" ? colors.sky[500] : t.text.secondary}
          />
          <Text
            style={[
              styles.tabText,
              tab === "appointments" && styles.tabTextActive,
            ]}
          >
            Citas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "medications" && styles.tabActive]}
          onPress={() => setTab("medications")}
        >
          <Pill
            size={14}
            color={tab === "medications" ? colors.sky[500] : t.text.secondary}
          />
          <Text
            style={[
              styles.tabText,
              tab === "medications" && styles.tabTextActive,
            ]}
          >
            Medicamentos
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "appointments" ? <AppointmentsTab /> : <MedicationsTab />}
    </SafeAreaView>
  );
}

// ─── appointments tab ─────────────────────────────────────────────────────────

function AppointmentsTab() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
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
          onPress={() => {
            setEditTarget(null);
            setShowForm(true);
          }}
        >
          <Plus size={16} color={colors.white} />
          <Text style={styles.addBtnText}>Nueva Cita</Text>
        </TouchableOpacity>
      </View>

      {appts.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.sky[500]} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <CalendarDays size={48} color={t.border.medium} />
          <Text style={styles.emptyText}>No tienes citas registradas.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          renderItem={({ item: a }) => (
            <View style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: colors.sky[100] }]}>
                <CalendarDays size={20} color={colors.sky[500]} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{a.specialty}</Text>
                <View style={styles.cardMeta}>
                  <User size={12} color={t.text.secondary} />
                  <Text style={styles.cardMetaText}>{a.doctor}</Text>
                  <MapPin size={12} color={t.text.secondary} />
                  <Text style={styles.cardMetaText}>{a.location}</Text>
                </View>
                <View style={styles.cardMeta}>
                  <Clock size={12} color={t.text.secondary} />
                  <Text style={styles.cardMetaText}>
                    {formatApptDate(a.date)} {a.time?.slice(0, 5)}
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  {STATUSES.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusPill,
                        a.status === s && styles.statusPillActive,
                      ]}
                      onPress={() => handleStatusChange(a.id, s)}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          a.status === s && styles.statusPillTextActive,
                        ]}
                      >
                        {appointmentStatusLabel(s)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => {
                    setEditTarget(a);
                    setShowForm(true);
                  }}
                >
                  <Edit3 size={16} color={t.text.secondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => setDeleteTarget(a)}
                >
                  <Trash2 size={16} color={colors.error[500]} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                  disabled={page <= 1}
                  onPress={() => setPage(page - 1)}
                >
                  <ChevronLeft size={18} color={page <= 1 ? t.border.medium : colors.sky[500]} />
                </TouchableOpacity>
                <Text style={styles.pageText}>
                  {page} / {totalPages}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    page >= totalPages && styles.pageBtnDisabled,
                  ]}
                  disabled={page >= totalPages}
                  onPress={() => setPage(page + 1)}
                >
                  <ChevronRight
                    size={18}
                    color={page >= totalPages ? t.border.medium : colors.sky[500]}
                  />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {showForm && (
        <AppointmentFormModal
          initial={editTarget}
          onClose={() => {
            setShowForm(false);
            setEditTarget(null);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Eliminar Cita"
          message={`¿Eliminar la cita de ${deleteTarget.specialty} el ${formatApptDate(deleteTarget.date)}?`}
          loading={deleteMut.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </View>
  );
}

// ─── appointment form modal ───────────────────────────────────────────────────

function AppointmentFormModal({
  initial,
  onClose,
}: {
  initial: Appointment | null;
  onClose: () => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const isEdit = !!initial;

  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [doctor, setDoctor] = useState(initial?.doctor ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [date, setDate] = useState(
    initial?.date ?? new Date().toISOString().split("T")[0]!
  );
  const [time, setTime] = useState(initial?.time?.slice(0, 5) ?? "09:00");
  const [type, setType] = useState<"APPOINTMENT" | "EXAM">(
    initial?.type ?? "APPOINTMENT"
  );
  const [examType, setExamType] = useState(initial?.examType ?? "");
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateAppointmentMutation();
  const updateMut = useUpdateAppointmentMutation();
  const loading = createMut.isPending || updateMut.isPending;

  function handleSubmit() {
    if (!specialty.trim() || !doctor.trim() || !location.trim() || !date || !time) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    const payload: AppointmentCreate = {
      specialty,
      doctor,
      location,
      date,
      time,
      type,
      status: initial?.status ?? "PENDING",
      examType: type === "EXAM" ? examType : undefined,
      tags: [],
      reminderOffsets: [],
    };
    if (isEdit) {
      updateMut.mutate(
        { id: initial!.id, appt: payload },
        {
          onSuccess: () => {
            Toast.show({ type: "success", text1: "Cita actualizada" });
            onClose();
          },
          onError: (err) =>
            setError(isApiError(err) ? err.message : "Error actualizando cita"),
        }
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Cita agendada" });
          onClose();
        },
        onError: (err) =>
          setError(isApiError(err) ? err.message : "Error guardando cita"),
      });
    }
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {isEdit ? "Editar Cita" : "Nueva Cita"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={20} color={t.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          <Text style={styles.fieldLabel}>Tipo de evento</Text>
          <View style={styles.typeRow}>
            {(["APPOINTMENT", "EXAM"] as const).map((tp) => (
              <TouchableOpacity
                key={tp}
                style={[styles.typePill, type === tp && styles.typePillActive]}
                onPress={() => setType(tp)}
              >
                <Text
                  style={[
                    styles.typePillText,
                    type === tp && styles.typePillTextActive,
                  ]}
                >
                  {tp === "APPOINTMENT" ? "Cita Médica" : "Examen"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {type === "EXAM" && (
            <>
              <Text style={styles.fieldLabel}>Tipo de examen</Text>
              <TextInput
                style={styles.input}
                value={examType}
                onChangeText={setExamType}
                placeholder="Ej: Resonancia, Hemograma..."
                placeholderTextColor={t.text.muted}
              />
            </>
          )}

          <Text style={styles.fieldLabel}>Especialidad *</Text>
          <TextInput
            style={styles.input}
            value={specialty}
            onChangeText={setSpecialty}
            placeholder="Ej: Neurología"
            placeholderTextColor={t.text.muted}
          />

          <Text style={styles.fieldLabel}>Médico *</Text>
          <TextInput
            style={styles.input}
            value={doctor}
            onChangeText={setDoctor}
            placeholder="Dr. nombre"
            placeholderTextColor={t.text.muted}
          />

          <Text style={styles.fieldLabel}>Lugar *</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Hospital / Clínica"
            placeholderTextColor={t.text.muted}
          />

          <Text style={styles.fieldLabel}>Fecha * (AAAA-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2025-12-31"
            placeholderTextColor={t.text.muted}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.fieldLabel}>Hora * (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="09:00"
            placeholderTextColor={t.text.muted}
            keyboardType="numbers-and-punctuation"
          />

          {error && <Text style={styles.errorText}>{error}</Text>}
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>
                {isEdit ? "Guardar Cambios" : "Agendar Cita"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── medications tab ──────────────────────────────────────────────────────────

function MedicationsTab() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Medication | null>(null);
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
    (id: string) => {
      intakeMut.mutate(id, {
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
    <View style={styles.tabContent}>
      <View style={styles.addRow}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setEditTarget(null);
            setShowForm(true);
          }}
        >
          <Plus size={16} color={colors.white} />
          <Text style={styles.addBtnText}>Nuevo Medicamento</Text>
        </TouchableOpacity>
      </View>

      {meds.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.sky[500]} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Pill size={48} color={t.border.medium} />
          <Text style={styles.emptyText}>No tienes medicamentos registrados.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item: m }) => (
            <View style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: colors.warning[50] }]}>
                <Pill size={20} color={colors.warning[500]} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{m.name}</Text>
                <Text style={styles.cardMetaText}>
                  {m.dosage} — cada {m.frequency}h
                </Text>
                {m.indications ? (
                  <Text style={styles.cardMetaText}>{m.indications}</Text>
                ) : null}
                {m.nextIntakeTime ? (
                  <View style={styles.cardMeta}>
                    <Clock size={12} color={t.text.secondary} />
                    <Text style={styles.cardMetaText}>
                      {new Date(m.nextIntakeTime).toLocaleString("es-CO", {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={styles.intakeBtn}
                  onPress={() => handleIntake(m.id)}
                  disabled={intakeMut.isPending}
                >
                  <Check size={13} color={colors.white} />
                  <Text style={styles.intakeBtnText}>Tomado</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => {
                    setEditTarget(m);
                    setShowForm(true);
                  }}
                >
                  <Edit3 size={16} color={t.text.secondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => setDeleteTarget(m)}
                >
                  <Trash2 size={16} color={colors.error[500]} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                  disabled={page <= 1}
                  onPress={() => setPage(page - 1)}
                >
                  <ChevronLeft size={18} color={page <= 1 ? t.border.medium : colors.sky[500]} />
                </TouchableOpacity>
                <Text style={styles.pageText}>
                  {page} / {totalPages}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    page >= totalPages && styles.pageBtnDisabled,
                  ]}
                  disabled={page >= totalPages}
                  onPress={() => setPage(page + 1)}
                >
                  <ChevronRight
                    size={18}
                    color={page >= totalPages ? t.border.medium : colors.sky[500]}
                  />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {showForm && (
        <MedicationFormModal
          initial={editTarget}
          onClose={() => {
            setShowForm(false);
            setEditTarget(null);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Eliminar Medicamento"
          message={`¿Eliminar "${deleteTarget.name}"? Los recordatorios también se eliminarán.`}
          loading={deleteMut.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
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
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [dosage, setDosage] = useState(initial?.dosage ?? "");
  const [frequency, setFrequency] = useState(
    initial?.frequency?.toString() ?? "8"
  );
  const [startDate, setStartDate] = useState(
    initial?.startDate ?? new Date().toISOString().split("T")[0]!
  );
  const [firstIntakeTime, setFirstIntakeTime] = useState(
    initial?.firstIntakeTime?.slice(0, 5) ?? "08:00"
  );
  const [indications, setIndications] = useState(initial?.indications ?? "");
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateMedicationMutation();
  const updateMut = useUpdateMedicationMutation();
  const loading = createMut.isPending || updateMut.isPending;

  function handleSubmit() {
    if (!name.trim() || !dosage.trim() || !frequency || !startDate || !firstIntakeTime) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    const payload: MedicationCreate = {
      name,
      dosage,
      frequency: parseInt(frequency, 10),
      startDate,
      firstIntakeTime,
      indications: indications || undefined,
      reminderOffsets: [60, 30, 15, 5],
    };
    if (isEdit) {
      updateMut.mutate(
        { id: initial!.id, med: payload },
        {
          onSuccess: () => {
            Toast.show({ type: "success", text1: "Medicamento actualizado" });
            onClose();
          },
          onError: (err) =>
            setError(isApiError(err) ? err.message : "Error actualizando"),
        }
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Medicamento registrado" });
          onClose();
        },
        onError: (err) =>
          setError(
            isApiError(err) ? err.message : "Error guardando medicamento"
          ),
      });
    }
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {isEdit ? "Editar Medicamento" : "Nuevo Medicamento"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={20} color={t.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          <Text style={styles.fieldLabel}>Nombre del medicamento *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Ibuprofeno 400mg"
            placeholderTextColor={t.text.muted}
          />

          <Text style={styles.fieldLabel}>Dosis *</Text>
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder="Ej: 1 tableta"
            placeholderTextColor={t.text.muted}
          />

          <Text style={styles.fieldLabel}>Frecuencia (horas) *</Text>
          <TextInput
            style={styles.input}
            value={frequency}
            onChangeText={setFrequency}
            placeholder="8"
            placeholderTextColor={t.text.muted}
            keyboardType="number-pad"
          />

          <Text style={styles.fieldLabel}>Fecha de inicio * (AAAA-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2025-01-01"
            placeholderTextColor={t.text.muted}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.fieldLabel}>Hora de primera toma * (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={firstIntakeTime}
            onChangeText={setFirstIntakeTime}
            placeholder="08:00"
            placeholderTextColor={t.text.muted}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.fieldLabel}>Indicaciones (opcional)</Text>
          <TextInput
            style={styles.input}
            value={indications}
            onChangeText={setIndications}
            placeholder="Ej: Tomar con alimentos"
            placeholderTextColor={t.text.muted}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>
                {isEdit ? "Guardar Cambios" : "Registrar"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── confirm delete modal ─────────────────────────────────────────────────────

function ConfirmDeleteModal({
  title,
  message,
  loading,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.overlay}>
      <View style={[styles.modal, { maxHeight: undefined }]}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={[styles.cardMetaText, { marginVertical: spacing[3] }]}>
          {message}
        </Text>
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.error[500] }, loading && styles.saveBtnDisabled]}
            onPress={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Eliminar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:          { flex: 1, backgroundColor: t.surface.bg },
    header:             { padding: spacing[6], paddingBottom: spacing[4], backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium },
    title:              { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: t.text.primary },
    tabs:               { flexDirection: "row", backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium, paddingHorizontal: spacing[4] },
    tab:                { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing[2], paddingVertical: spacing[3], borderBottomWidth: 2, borderBottomColor: "transparent" },
    tabActive:          { borderBottomColor: colors.sky[500] },
    tabText:            { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: t.text.secondary },
    tabTextActive:      { color: colors.sky[500] },
    tabContent:         { flex: 1 },
    addRow:             { flexDirection: "row", justifyContent: "flex-end", padding: spacing[4] },
    addBtn:             { flexDirection: "row", alignItems: "center", gap: spacing[2], backgroundColor: colors.sky[500], paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radii.md },
    addBtnText:         { color: colors.white, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
    center:             { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[3], padding: spacing[6] },
    emptyText:          { color: t.text.secondary, fontSize: fontSize.md, textAlign: "center" },
    list:               { padding: spacing[4], gap: spacing[3], paddingBottom: spacing[8] },
    card:               { flexDirection: "row", gap: spacing[3], padding: spacing[4], backgroundColor: t.surface.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: t.border.medium },
    cardIcon:           { width: 44, height: 44, borderRadius: radii.md, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    cardInfo:           { flex: 1, gap: spacing[1] },
    cardTitle:          { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: t.text.primary },
    cardMeta:           { flexDirection: "row", alignItems: "center", gap: spacing[1] },
    cardMetaText:       { fontSize: fontSize.sm, color: t.text.secondary },
    cardActions:        { gap: spacing[2] },
    iconBtn:            { width: 34, height: 34, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: t.surface.bg },
    statusRow:          { flexDirection: "row", flexWrap: "wrap", gap: spacing[1], marginTop: spacing[1] },
    statusPill:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.full, backgroundColor: t.border.light, borderWidth: 1, borderColor: t.border.medium },
    statusPillActive:   { backgroundColor: colors.sky[500], borderColor: colors.sky[500] },
    statusPillText:     { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: t.text.secondary },
    statusPillTextActive: { color: colors.white },
    intakeBtn:          { flexDirection: "row", alignItems: "center", gap: spacing[1], marginTop: spacing[1], backgroundColor: colors.emerald[500], alignSelf: "flex-start", paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: radii.full },
    intakeBtnText:      { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
    pagination:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing[4], paddingVertical: spacing[4] },
    pageBtn:            { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: t.surface.bgCard, borderWidth: 1, borderColor: t.border.medium },
    pageBtnDisabled:    { opacity: 0.4 },
    pageText:           { fontSize: fontSize.sm, color: t.text.secondary, fontWeight: fontWeight.semibold },

    // modal
    overlay:            { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", zIndex: 50 },
    modal:              { width: "92%", maxHeight: "85%", backgroundColor: t.surface.bgCard, borderRadius: radii.xl, overflow: "hidden" },
    modalHeader:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing[5], borderBottomWidth: 1, borderBottomColor: t.border.medium },
    modalTitle:         { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: t.text.primary },
    modalBody:          { padding: spacing[5] },
    modalFooter:        { flexDirection: "row", gap: spacing[3], padding: spacing[4], borderTopWidth: 1, borderTopColor: t.border.medium },
    fieldLabel:         { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: t.text.primary, marginBottom: spacing[1], marginTop: spacing[3] },
    input:              { borderWidth: 1, borderColor: t.border.medium, borderRadius: radii.md, paddingHorizontal: spacing[3], paddingVertical: spacing[3], fontSize: fontSize.md, color: t.text.primary, backgroundColor: t.surface.bg },
    errorText:          { color: colors.error[500], fontSize: fontSize.sm, marginTop: spacing[3], backgroundColor: colors.error[50], padding: spacing[3], borderRadius: radii.sm },
    typeRow:            { flexDirection: "row", gap: spacing[2] },
    typePill:           { flex: 1, paddingVertical: spacing[2], borderRadius: radii.md, alignItems: "center", backgroundColor: t.surface.bg, borderWidth: 1, borderColor: t.border.medium },
    typePillActive:     { backgroundColor: colors.sky[500], borderColor: colors.sky[500] },
    typePillText:       { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: t.text.secondary },
    typePillTextActive: { color: colors.white },
    cancelBtn:          { flex: 1, paddingVertical: spacing[3], borderRadius: radii.md, alignItems: "center", backgroundColor: t.surface.bg, borderWidth: 1, borderColor: t.border.medium },
    cancelBtnText:      { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: t.text.secondary },
    saveBtn:            { flex: 1, paddingVertical: spacing[3], borderRadius: radii.md, alignItems: "center", backgroundColor: colors.sky[500] },
    saveBtnDisabled:    { opacity: 0.6 },
    saveBtnText:        { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.white },
  });
}
