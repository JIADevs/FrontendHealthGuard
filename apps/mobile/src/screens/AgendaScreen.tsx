import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
} from "@helu/api/hooks";
import {
  isApiError,
  type Appointment,
  type Medication,
} from "@helu/api";
import { useMedicationForm } from "../hooks/useMedicationForm";
import { useAppointmentForm } from "../hooks/useAppointmentForm";
import {
  colors, palette,
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  appointmentStatusLabel,
  formatApptDate,
  Button,
  Pagination,
  Modal,
  Card,
  cardContentStyle,
  TextField,
  Typography,
  DateTimePicker,
  ActionButton,
  Spinner,
  ConfirmModal,
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
        <Typography variant="h2">Agenda Médica</Typography>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "appointments" && styles.tabActive]}
          onPress={() => setTab("appointments")}
        >
          <CalendarDays
            size={14}
            color={tab === "appointments" ? palette.brand[500] : t.text.secondary}
          />
          <Typography variant="label" color={tab === "appointments" ? "inherit" : "secondary"}>
            <Text style={tab === "appointments" ? { color: palette.brand[500] } : undefined}>Citas</Text>
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "medications" && styles.tabActive]}
          onPress={() => setTab("medications")}
        >
          <Pill
            size={14}
            color={tab === "medications" ? palette.brand[500] : t.text.secondary}
          />
          <Typography variant="label" color={tab === "medications" ? "inherit" : "secondary"}>
            <Text style={tab === "medications" ? { color: palette.brand[500] } : undefined}>Medicamentos</Text>
          </Typography>
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
          <Spinner size="lg" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <CalendarDays size={48} color={t.border.medium} />
          <Typography variant="body" color="secondary" align="center">No tienes citas registradas.</Typography>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          contentContainerStyle={cardContentStyle}
          renderItem={({ item: a }) => (
            <Card
              title={a.specialty}
              subtitle={
                <View style={{ gap: spacing[1] }}>
                  <View style={styles.cardMeta}>
                    <User size={12} color={t.text.secondary} />
                    <Text style={styles.cardMetaText}>{a.doctor}</Text>
                    <MapPin size={12} color={t.text.secondary} />
                    <Text style={styles.cardMetaText}>{a.location}</Text>
                  </View>
                  <View style={styles.cardMeta}>
                    <Clock size={12} color={t.text.secondary} />
                    <Text style={styles.cardMetaText}>{formatApptDate(a.date)} {a.time?.slice(0, 5)}</Text>
                  </View>
                </View>
              }
              icon={<CalendarDays size={20} color={palette.brand[500]} />}
              iconBackground={palette.brand[100]}
              actions={
                <View style={styles.cardActions}>
                  <ActionButton action="edit" size="sm" onPress={() => { setEditTarget(a); setShowForm(true); }} />
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
          )}
          ListFooterComponent={
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
        <ConfirmModal
          title="Eliminar Cita"
          message={`¿Eliminar la cita de ${deleteTarget.specialty} el ${formatApptDate(deleteTarget.date)}?`}
          confirmLabel="Eliminar"
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
    <Modal
      title={form.isEdit ? "Editar Cita" : "Nueva Cita"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onPress={onClose}>Cancelar</Button>
          <Button onPress={form.handleSave} disabled={form.saving} loading={form.saving}>
            {form.isEdit ? "Guardar Cambios" : "Agendar Cita"}
          </Button>
        </>
      }
    >
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
            <TextField
              label="Tipo de examen"
              value={form.examType}
              onChange={form.setExamType}
              placeholder="Ej: Resonancia, Hemograma..."
            />
          )}

          <TextField label="Especialidad" value={form.specialty} onChange={form.setSpecialty} placeholder="Ej: Neurología" />
          <TextField label="Médico" value={form.doctor} onChange={form.setDoctor} placeholder="Dr. nombre" />
          <TextField label="Lugar" value={form.location} onChange={form.setLocation} placeholder="Hospital / Clínica" />
          <DateTimePicker
            label="Fecha y hora"
            value={form.date && form.time ? `${form.date}T${form.time}` : ""}
            onChange={(v) => { form.setDate(v.slice(0, 10)); form.setTime(v.slice(11, 16)); }}
            required
          />

          {form.error && <Text style={styles.errorText}>{form.error}</Text>}
    </Modal>
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
          <Spinner size="lg" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Pill size={48} color={t.border.medium} />
          <Typography variant="body" color="secondary" align="center">No tienes medicamentos registrados.</Typography>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          contentContainerStyle={cardContentStyle}
          renderItem={({ item: m }) => (
            <Card
              title={m.name}
              subtitle={`${m.dosage} — cada ${m.frequency}h`}
              icon={<Pill size={20} color={colors.warning[500]} />}
              iconBackground={colors.warning[50]}
              actions={
                <View style={styles.cardActions}>
                  <ActionButton action="edit" size="sm" onPress={() => { setEditTarget(m); setShowForm(true); }} />
                  <ActionButton action="delete" size="sm" onPress={() => setDeleteTarget(m)} />
                </View>
              }
            >
              {m.indications ? (
                <Text style={styles.cardMetaText}>{m.indications}</Text>
              ) : null}
              {m.nextIntakeTime ? (
                <View style={styles.cardMeta}>
                  <Clock size={12} color={t.text.secondary} />
                  <Text style={styles.cardMetaText}>
                    {new Date(m.nextIntakeTime).toLocaleString("es-CO", {
                      month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
                    })}
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity style={styles.intakeBtn} onPress={() => handleIntake(m.id)} disabled={intakeMut.isPending}>
                <Check size={13} color={colors.white} />
                <Text style={styles.intakeBtnText}>Tomado</Text>
              </TouchableOpacity>
            </Card>
          )}
          ListFooterComponent={
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
        <ConfirmModal
          title="Eliminar Medicamento"
          message={`¿Eliminar "${deleteTarget.name}"? Los recordatorios también se eliminarán.`}
          confirmLabel="Eliminar"
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
    header:             { padding: spacing[6], paddingBottom: spacing[4], backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium },
    tabs:               { flexDirection: "row", backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium, paddingHorizontal: spacing[4] },
    tab:                { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing[2], paddingVertical: spacing[3], borderBottomWidth: 2, borderBottomColor: "transparent" },
    tabActive:          { borderBottomColor: palette.brand[500] },
    tabContent:         { flex: 1 },
    addRow:             { flexDirection: "row", justifyContent: "flex-end", padding: spacing[4] },
    addBtn:             { flexDirection: "row", alignItems: "center", gap: spacing[2], backgroundColor: palette.brand[500], paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radii.md },
    addBtnText:         { color: colors.white, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
    center:             { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[3], padding: spacing[6] },
    cardMeta:           { flexDirection: "row", alignItems: "center", gap: spacing[1] },
    cardMetaText:       { fontSize: fontSize.sm, color: t.text.secondary },
    cardActions:        { gap: spacing[2] },
    iconBtn:            { width: 34, height: 34, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: t.surface.bg },
    statusRow:          { flexDirection: "row", flexWrap: "wrap", gap: spacing[1], marginTop: spacing[1] },
    statusPill:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.full, backgroundColor: t.border.light, borderWidth: 1, borderColor: t.border.medium },
    statusPillActive:   { backgroundColor: palette.brand[500], borderColor: palette.brand[500] },
    statusPillText:     { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: t.text.secondary },
    statusPillTextActive: { color: colors.white },
    intakeBtn:          { flexDirection: "row", alignItems: "center", gap: spacing[1], marginTop: spacing[1], backgroundColor: colors.emerald[500], alignSelf: "flex-start", paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: radii.full },
    intakeBtnText:      { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },

    fieldLabel:         { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: t.text.primary, marginBottom: spacing[2] },
    errorText:          { color: colors.error[500], fontSize: fontSize.sm, marginTop: spacing[3], backgroundColor: colors.error[50], padding: spacing[3], borderRadius: radii.sm },
    typeRow:            { flexDirection: "row", gap: spacing[2] },
    typePill:           { flex: 1, paddingVertical: spacing[2], borderRadius: radii.md, alignItems: "center", backgroundColor: t.surface.bg, borderWidth: 1, borderColor: t.border.medium },
    typePillActive:     { backgroundColor: palette.brand[500], borderColor: palette.brand[500] },
    typePillText:       { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: t.text.secondary },
    typePillTextActive: { color: colors.white },
  });
}
