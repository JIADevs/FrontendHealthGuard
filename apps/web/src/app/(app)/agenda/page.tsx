"use client";

import { useState } from "react";
import {
  useAppointmentsQuery,
  useDeleteAppointmentMutation,
  useUpdateAppointmentStatusMutation,
  useMedicationsQuery,
  useDeleteMedicationMutation,
  useConfirmIntakeMutation,
} from "@healthguard/api/hooks";
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
} from "lucide-react";
import {
  isApiError,
  type Appointment,
  type Medication,
} from "@healthguard/api";
import { useMedicationForm } from "@/hooks/useMedicationForm";
import { useAppointmentForm } from "@/hooks/useAppointmentForm";

import { appointmentStatusLabel, formatApptDate, Button, Pagination, Modal, Card, CardGrid, TextField, Select, Typography } from "@healthguard/ui";
import { ConfirmModal } from "@/components/ConfirmModal";
import "./agenda.css";

// ══════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════
export default function AgendaPage() {
  const [tab, setTab] = useState<"appointments" | "medications">("appointments");

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <Typography variant="h2">Agenda Médica</Typography>
      </div>

      <div className="agenda-tabs">
        <button className={`agenda-tab${tab === "appointments" ? " active" : ""}`} onClick={() => setTab("appointments")}>
          <CalendarDays size={15} style={{ marginRight: 6, verticalAlign: -2 }} />
          Citas
        </button>
        <button className={`agenda-tab${tab === "medications" ? " active" : ""}`} onClick={() => setTab("medications")}>
          <Pill size={15} style={{ marginRight: 6, verticalAlign: -2 }} />
          Medicamentos
        </button>
      </div>

      {tab === "appointments" ? <AppointmentsTab /> : <MedicationsTab />}
    </>
  );
}

// ══════════════════════════════════════════════════════
//  APPOINTMENTS TAB
// ══════════════════════════════════════════════════════
function AppointmentsTab() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);

  const appts = useAppointmentsQuery("", page, 10);
  const statusMut = useUpdateAppointmentStatusMutation();
  const deleteMut = useDeleteAppointmentMutation();

  const totalPages = appts.data?.totalPages ?? 1;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button onPress={() => { setEditTarget(null); setShowForm(true); }}>
          <Plus size={16} /> Nueva Cita
        </Button>
      </div>

      {appts.isLoading ? (
        <div className="empty-state">
          <div className="spinner spinner--page" style={{ margin: "0 auto", width: 32, height: 32 }} />
        </div>
      ) : (appts.data?.items.length ?? 0) === 0 ? (
        <div className="empty-state">
          <CalendarDays />
          <Typography variant="bodySm" color="secondary">No tienes citas registradas.</Typography>
        </div>
      ) : (
        <CardGrid variant="list">
          {appts.data!.items.map((a) => (
            <Card
              key={a.id}
              title={a.specialty}
              subtitle={
                <span>
                  <User size={12} style={{ verticalAlign: -1, marginRight: 4 }} />{a.doctor}
                  <span style={{ margin: "0 8px" }}>·</span>
                  <MapPin size={12} style={{ verticalAlign: -1, marginRight: 4 }} />{a.location}
                </span>
              }
              icon={<CalendarDays size={20} />}
              iconBackground="var(--primary-50)"
              actions={
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    <Clock size={14} />
                    {formatApptDate(a.date)} {a.time?.slice(0, 5)}
                  </div>
                  <Select
                    value={a.status}
                    onChange={(s) => statusMut.mutate({ id: a.id, status: s })}
                    options={(["PENDING", "COMPLETED", "CANCELLED", "RESCHEDULED"] as const).map((s) => ({ value: s, label: appointmentStatusLabel(s) }))}
                  />
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="icon-btn" title="Editar" onClick={() => { setEditTarget(a); setShowForm(true); }}><Edit3 size={15} /></button>
                    <button className="icon-btn" title="Eliminar" onClick={() => setDeleteTarget(a)}><Trash2 size={15} /></button>
                  </div>
                </div>
              }
            />
          ))}
        </CardGrid>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {showForm && (
        <AppointmentFormModal
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Eliminar Cita"
          message={`¿Eliminar la cita de ${deleteTarget.specialty} el ${formatApptDate(deleteTarget.date)}?`}
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={() => deleteMut.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════
//  APPOINTMENT FORM MODAL
// ══════════════════════════════════════════════════════
function AppointmentFormModal({ initial, onClose }: { initial: Appointment | null; onClose: () => void }) {
  const form = useAppointmentForm({ initial, onClose });

  return (
    <Modal
      title={form.isEdit ? "Editar Cita" : "Nueva Cita"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onPress={onClose}>Cancelar</Button>
          <Button type="submit" form="appointment-form" disabled={form.saving} loading={form.saving}>
            {form.isEdit ? "Guardar Cambios" : "Agendar Cita"}
          </Button>
        </>
      }
    >
      <form id="appointment-form" onSubmit={(e) => { e.preventDefault(); form.handleSave(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Select
          label="Tipo de evento"
          value={form.type}
          onChange={(v) => form.setType(v as "APPOINTMENT" | "EXAM")}
          options={[
            { value: "APPOINTMENT", label: "Cita Médica" },
            { value: "EXAM", label: "Examen / Procedimiento" },
          ]}
        />

        {form.type === "EXAM" && (
          <TextField label="Tipo de examen" value={form.examType} onChange={form.setExamType} placeholder="Ej: Resonancia, Hemograma..." />
        )}

        <div className="form-grid">
          <TextField label="Especialidad" value={form.specialty} onChange={form.setSpecialty} placeholder="Ej: Neurología" required />
          <TextField label="Médico" value={form.doctor} onChange={form.setDoctor} placeholder="Dr. nombre" required />
          <TextField label="Fecha" type="date" value={form.date} onChange={form.setDate} required />
          <TextField label="Hora" type="time" value={form.time} onChange={form.setTime} required />
          <div style={{ gridColumn: "1 / -1" }}>
            <TextField label="Lugar" value={form.location} onChange={form.setLocation} placeholder="Hospital / Clínica" required />
          </div>
        </div>

        {form.error && <p className="form-error">{form.error}</p>}
      </form>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════
//  MEDICATIONS TAB
// ══════════════════════════════════════════════════════
function MedicationsTab() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Medication | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Medication | null>(null);

  const meds = useMedicationsQuery(page, 10);
  const intakeMut = useConfirmIntakeMutation();
  const deleteMut = useDeleteMedicationMutation();

  const totalPages = meds.data?.totalPages ?? 1;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button onPress={() => { setEditTarget(null); setShowForm(true); }}>
          <Plus size={16} /> Nuevo Medicamento
        </Button>
      </div>

      {meds.isLoading ? (
        <div className="empty-state">
          <div className="spinner spinner--page" style={{ margin: "0 auto", width: 32, height: 32 }} />
        </div>
      ) : (meds.data?.items.length ?? 0) === 0 ? (
        <div className="empty-state">
          <Pill />
          <Typography variant="bodySm" color="secondary">No tienes medicamentos registrados.</Typography>
        </div>
      ) : (
        <CardGrid variant="list">
          {meds.data!.items.map((m) => (
            <Card
              key={m.id}
              title={m.name}
              subtitle={`${m.dosage} — cada ${m.frequency}h${m.indications ? ` · ${m.indications}` : ""}`}
              icon={<Pill size={20} />}
              iconBackground="var(--warning-50)"
              actions={
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {m.nextIntakeTime && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      <Clock size={14} />
                      {new Date(m.nextIntakeTime).toLocaleString("es-CO", {
                        month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                  )}
                  <button
                    className="btn-intake"
                    onClick={() => intakeMut.mutate(m.id)}
                    disabled={intakeMut.isPending}
                    title="Confirmar toma"
                  >
                    <Check size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                    Tomado
                  </button>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="icon-btn" title="Editar" onClick={() => { setEditTarget(m); setShowForm(true); }}><Edit3 size={15} /></button>
                    <button className="icon-btn" title="Eliminar" onClick={() => setDeleteTarget(m)}><Trash2 size={15} /></button>
                  </div>
                </div>
              }
            />
          ))}
        </CardGrid>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {showForm && (
        <MedicationFormModal
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Eliminar Medicamento"
          message={`¿Eliminar "${deleteTarget.name}"? Los recordatorios también se eliminarán.`}
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={() => deleteMut.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════
//  MEDICATION FORM MODAL
// ══════════════════════════════════════════════════════
function MedicationFormModal({ initial, onClose }: { initial: Medication | null; onClose: () => void }) {
  const form = useMedicationForm({ initial, onClose });

  return (
    <Modal
      title={form.isEdit ? "Editar Medicamento" : "Nuevo Medicamento"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onPress={onClose}>Cancelar</Button>
          <Button type="submit" form="medication-form" disabled={form.saving} loading={form.saving}>
            {form.isEdit ? "Guardar Cambios" : "Registrar Medicamento"}
          </Button>
        </>
      }
    >
      <form id="medication-form" onSubmit={(e) => { e.preventDefault(); form.handleSave(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <TextField label="Nombre del medicamento" value={form.name} onChange={form.setName} placeholder="Ej: Ibuprofeno 400mg" required />
        </div>
        <div className="form-grid">
          <TextField label="Dosis" value={form.dosage} onChange={form.setDosage} placeholder="Ej: 1 tableta" required />
          <TextField label="Frecuencia (horas)" type="number" value={form.frequency} onChange={form.setFrequency} required />
          <TextField label="Fecha de inicio" type="date" value={form.startDate} onChange={form.setStartDate} required />
          <TextField label="Hora de primera toma" type="time" value={form.firstIntakeTime} onChange={form.setFirstIntakeTime} required />
          <div style={{ gridColumn: "1 / -1" }}>
            <TextField label="Indicaciones (opcional)" value={form.indications} onChange={form.setIndications} placeholder="Ej: Tomar con alimentos" />
          </div>
        </div>

        {form.error && <p className="form-error">{form.error}</p>}
      </form>
    </Modal>
  );
}

