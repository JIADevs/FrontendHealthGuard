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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  useAppointmentsQuery,
  useDeleteAppointmentMutation,
  useUpdateAppointmentStatusMutation,
  useMedicationsQuery,
  useDeleteMedicationMutation,
  useConfirmIntakeMutation,
} from "@healthguard/api/hooks";
import {
  isApiError,
  type Appointment,
  type Medication,
} from "@healthguard/api";
import { useMedicationForm } from "../hooks/useMedicationForm";
import { useAppointmentForm } from "../hooks/useAppointmentForm";
import {
  colors,
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  appointmentStatusLabel,
  formatApptDate,
  Button,
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

const STATUSES = ["PENDING", "COMPLETED", "CANCELLED", "RESCHEDULED"] as const;

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
  const form = useAppointmentForm({ initial, onClose });

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {form.isEdit ? "Editar Cita" : "Nueva Cita"}
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
                style={[styles.typePill, form.type === tp && styles.typePillActive]}
                onPress={() => form.setType(tp)}
              >
                <Text
                  style={[
                    styles.typePillText,
                    form.type === tp && styles.typePillTextActive,
                  ]}
                >
                  {tp === "APPOINTMENT" ? "Cita Médica" : "Examen"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {form.type === "EXAM" && (
            <>
              <Text style={styles.fieldLabel}>Tipo de examen</Text>
              <TextInput
                style={styles.input}
                value={form.examType}
                onChangeText={form.setExamType}
                placeholder="Ej: Resonancia, Hemograma..."
                placeholderTextColor={t.text.muted}
              />
            </>
          )}

          <Text style={styles.fieldLabel}>Especialidad *</Text>
          <TextInput
            style={styles.input}
            value={form.specialty}
            onChangeText={form.setSpecialty}
            placeholder="Ej: Neurología"
            placeholderTextColor={t.text.muted}
          />

          <Text style={styles.fieldLabel}>Médico *</Text>
          <TextInput
            style={styles.input}
            value={form.doctor}
            onChangeText={form.setDoctor}
            placeholder="Dr. nombre"
            placeholderTextColor={t.text.muted}
          />

          <Text style={styles.fieldLabel}>Lugar *</Text>
          <TextInput
            style={styles.input}
            value={form.location}
            onChangeText={form.setLocation}
            placeholder="Hospital / Clínica"
            placeholderTextColor={t.text.muted}
          />

          <Text style={styles.fieldLabel}>Fecha * (AAAA-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={form.date}
            onChangeText={form.setDate}
            placeholder="2025-12-31"
            placeholderTextColor={t.text.muted}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.fieldLabel}>Hora * (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={form.time}
            onChangeText={form.setTime}
            placeholder="09:00"
            placeholderTextColor={t.text.muted}
            keyboardType="numbers-and-punctuation"
          />

          {form.error && <Text style={styles.errorText}>{form.error}</Text>}
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button variant="secondary" onPress={onClose}>Cancelar</Button>
          <Button onPress={form.handleSave} disabled={form.saving} loading={form.saving}>
            {form.isEdit ? "Guardar Cambios" : "Agendar Cita"}
          </Button>
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
  const form = useMedicationForm({ initial, onClose });

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {form.isEdit ? "Editar Medicamento" : "Nuevo Medicamento"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={20} color={t.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          <Text style={styles.fieldLabel}>Nombre del medicamento *</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={form.setName}
            placeholder="Ej: Ibuprofeno 400mg"
            placeholderTextColor={t.text.muted}
          />

          <Text style={styles.fieldLabel}>Dosis *</Text>
          <TextInput
            style={styles.input}
            value={form.dosage}
            onChangeText={form.setDosage}
            placeholder="Ej: 1 tableta"
            placeholderTextColor={t.text.muted}
          />

          <Text style={styles.fieldLabel}>Frecuencia (horas) *</Text>
          <TextInput
            style={styles.input}
            value={form.frequency}
            onChangeText={form.setFrequency}
            placeholder="8"
            placeholderTextColor={t.text.muted}
            keyboardType="number-pad"
          />

          <Text style={styles.fieldLabel}>Fecha de inicio * (AAAA-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={form.startDate}
            onChangeText={form.setStartDate}
            placeholder="2025-01-01"
            placeholderTextColor={t.text.muted}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.fieldLabel}>Hora de primera toma * (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={form.firstIntakeTime}
            onChangeText={form.setFirstIntakeTime}
            placeholder="08:00"
            placeholderTextColor={t.text.muted}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.fieldLabel}>Indicaciones (opcional)</Text>
          <TextInput
            style={styles.input}
            value={form.indications}
            onChangeText={form.setIndications}
            placeholder="Ej: Tomar con alimentos"
            placeholderTextColor={t.text.muted}
          />

          {form.error && <Text style={styles.errorText}>{form.error}</Text>}
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button variant="secondary" onPress={onClose}>Cancelar</Button>
          <Button onPress={form.handleSave} disabled={form.saving} loading={form.saving}>
            {form.isEdit ? "Guardar Cambios" : "Registrar"}
          </Button>
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
          <Button variant="secondary" onPress={onCancel}>Cancelar</Button>
          <Button variant="danger" onPress={onConfirm} disabled={loading} loading={loading}>Eliminar</Button>
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
  });
}
