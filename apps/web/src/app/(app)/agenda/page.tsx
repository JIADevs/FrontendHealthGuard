"use client";

import { useState, type FormEvent } from "react";
import {
  useAppointmentsQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
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
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  isApiError,
  type Appointment,
  type AppointmentCreate,
  type Medication,
} from "@healthguard/api";
import { useMedicationForm } from "@/hooks/useMedicationForm";

import { appointmentStatusLabel, formatApptDate } from "@healthguard/ui";
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
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Agenda Médica</h1>
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
        <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => { setEditTarget(null); setShowForm(true); }}>
          <Plus size={16} /> Nueva Cita
        </button>
      </div>

      {appts.isLoading ? (
        <div className="empty-state">
          <div className="spinner spinner--page" style={{ margin: "0 auto", width: 32, height: 32 }} />
        </div>
      ) : (appts.data?.items.length ?? 0) === 0 ? (
        <div className="empty-state">
          <CalendarDays />
          <p>No tienes citas registradas.</p>
        </div>
      ) : (
        <div className="agenda-list">
          {appts.data!.items.map((a) => (
            <div key={a.id} className="agenda-item">
              <div className="agenda-item-icon blue"><CalendarDays size={20} /></div>
              <div className="agenda-item-info">
                <div className="agenda-item-title">{a.specialty}</div>
                <div className="agenda-item-sub">
                  <User size={12} style={{ verticalAlign: -1, marginRight: 4 }} />{a.doctor}
                  <span style={{ margin: "0 8px" }}>·</span>
                  <MapPin size={12} style={{ verticalAlign: -1, marginRight: 4 }} />{a.location}
                </div>
              </div>
              <div className="agenda-item-right">
                <div className="agenda-item-time">
                  <Clock size={14} />
                  {formatApptDate(a.date)} {a.time?.slice(0, 5)}
                </div>
                <select
                  className="status-select"
                  value={a.status}
                  onChange={(e) => statusMut.mutate({ id: a.id, status: e.target.value })}
                >
                  {(["PENDING", "COMPLETED", "CANCELLED", "RESCHEDULED"] as const).map((s) => (
                    <option key={s} value={s}>{appointmentStatusLabel(s)}</option>
                  ))}
                </select>
                <button className="icon-btn" title="Editar" onClick={() => { setEditTarget(a); setShowForm(true); }}><Edit3 size={15} /></button>
                <button className="icon-btn" title="Eliminar" onClick={() => setDeleteTarget(a)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = i + Math.max(1, page - 2);
            if (p > totalPages) return null;
            return <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>;
          })}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
        </div>
      )}

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
  const isEdit = !!initial;

  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [doctor, setDoctor] = useState(initial?.doctor ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().split("T")[0]!);
  const [time, setTime] = useState(initial?.time?.slice(0, 5) ?? "09:00");
  const [type, setType] = useState<"APPOINTMENT" | "EXAM">(initial?.type ?? "APPOINTMENT");
  const [examType, setExamType] = useState(initial?.examType ?? "");
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateAppointmentMutation();
  const updateMut = useUpdateAppointmentMutation();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload: AppointmentCreate = {
      specialty, doctor, location, date, time, type,
      status: initial?.status ?? "PENDING",
      examType: type === "EXAM" ? examType : undefined,
      tags: [], reminderOffsets: [],
    };
    if (isEdit) {
      updateMut.mutate({ id: initial!.id, appt: payload }, {
        onSuccess: onClose,
        onError: (err) => setError(isApiError(err) ? err.message : "Error actualizando cita"),
      });
    } else {
      createMut.mutate(payload, {
        onSuccess: onClose,
        onError: (err) => setError(isApiError(err) ? err.message : "Error guardando cita"),
      });
    }
  }

  const loading = createMut.isPending || updateMut.isPending;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? "Editar Cita" : "Nueva Cita"}</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Tipo de evento</label>
              <select className="form-input" value={type} onChange={(e) => setType(e.target.value as "APPOINTMENT" | "EXAM")}>
                <option value="APPOINTMENT">Cita Médica</option>
                <option value="EXAM">Examen / Procedimiento</option>
              </select>
            </div>

            {type === "EXAM" && (
              <div className="form-group">
                <label>Tipo de examen</label>
                <input className="form-input" value={examType} onChange={(e) => setExamType(e.target.value)} placeholder="Ej: Resonancia, Hemograma..." />
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label>Especialidad *</label>
                <input className="form-input" required value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ej: Neurología" />
              </div>
              <div className="form-group">
                <label>Médico *</label>
                <input className="form-input" required value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="Dr. nombre" />
              </div>
              <div className="form-group">
                <label>Fecha *</label>
                <input className="form-input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Hora *</label>
                <input className="form-input" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="form-group full">
                <label>Lugar *</label>
                <input className="form-input" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Hospital / Clínica" />
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ width: "auto" }} disabled={loading}>
              {loading && <span className="spinner" />}
              {isEdit ? "Guardar Cambios" : "Agendar Cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
        <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => { setEditTarget(null); setShowForm(true); }}>
          <Plus size={16} /> Nuevo Medicamento
        </button>
      </div>

      {meds.isLoading ? (
        <div className="empty-state">
          <div className="spinner spinner--page" style={{ margin: "0 auto", width: 32, height: 32 }} />
        </div>
      ) : (meds.data?.items.length ?? 0) === 0 ? (
        <div className="empty-state">
          <Pill />
          <p>No tienes medicamentos registrados.</p>
        </div>
      ) : (
        <div className="agenda-list">
          {meds.data!.items.map((m) => (
            <div key={m.id} className="agenda-item">
              <div className="agenda-item-icon amber"><Pill size={20} /></div>
              <div className="agenda-item-info">
                <div className="agenda-item-title">{m.name}</div>
                <div className="agenda-item-sub">
                  {m.dosage} — cada {m.frequency}h
                  {m.indications && <span style={{ margin: "0 8px" }}>· {m.indications}</span>}
                </div>
              </div>
              <div className="agenda-item-right">
                {m.nextIntakeTime && (
                  <div className="agenda-item-time">
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
                <button className="icon-btn" title="Editar" onClick={() => { setEditTarget(m); setShowForm(true); }}><Edit3 size={15} /></button>
                <button className="icon-btn" title="Eliminar" onClick={() => setDeleteTarget(m)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = i + Math.max(1, page - 2);
            if (p > totalPages) return null;
            return <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>;
          })}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
        </div>
      )}

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{form.isEdit ? "Editar Medicamento" : "Nuevo Medicamento"}</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); form.handleSave(); }}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group full">
                <label>Nombre del medicamento *</label>
                <input className="form-input" required value={form.name} onChange={(e) => form.setName(e.target.value)} placeholder="Ej: Ibuprofeno 400mg" />
              </div>
              <div className="form-group">
                <label>Dosis *</label>
                <input className="form-input" required value={form.dosage} onChange={(e) => form.setDosage(e.target.value)} placeholder="Ej: 1 tableta" />
              </div>
              <div className="form-group">
                <label>Frecuencia (horas) *</label>
                <input className="form-input" type="number" required min={1} max={72} value={form.frequency} onChange={(e) => form.setFrequency(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Fecha de inicio *</label>
                <input className="form-input" type="date" required value={form.startDate} onChange={(e) => form.setStartDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Hora de primera toma *</label>
                <input className="form-input" type="time" required value={form.firstIntakeTime} onChange={(e) => form.setFirstIntakeTime(e.target.value)} />
              </div>
              <div className="form-group full">
                <label>Indicaciones (opcional)</label>
                <input className="form-input" value={form.indications} onChange={(e) => form.setIndications(e.target.value)} placeholder="Ej: Tomar con alimentos" />
              </div>
            </div>

            {form.error && <p className="form-error">{form.error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ width: "auto" }} disabled={form.saving}>
              {form.saving && <span className="spinner" />}
              {form.isEdit ? "Guardar Cambios" : "Registrar Medicamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

