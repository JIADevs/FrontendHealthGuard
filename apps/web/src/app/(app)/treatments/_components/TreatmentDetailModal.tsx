"use client";

import type { ReactNode } from "react";
import {
  useDeleteTreatmentMutation,
  useTreatmentByIdQuery,
} from "@helu/api/hooks";
import {
  Button,
  Chip,
  Modal,
  Spinner,
  formatDate,
} from "@helu/ui";
import { isApiError, type Treatment, type TreatmentDetail } from "@helu/api";
import {
  CalendarDays,
  FileText,
  HeartPulse,
  Pill,
} from "lucide-react";
import { sileo } from "sileo";

const STATUS_LABELS: Record<Treatment["status"], string> = {
  ACTIVE: "Activo",
  COMPLETED: "Completado",
  INACTIVE: "Inactivo",
};

function relatedTotal(treatment: TreatmentDetail) {
  return (
    treatment.medicationCycles.length +
    treatment.appointments.length +
    treatment.documents.length +
    treatment.dailyCheckins.length +
    treatment.symptoms.length
  );
}

function rowSubtitle(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" - ");
}

export function TreatmentDetailModal({
  id,
  onClose,
  onEdit,
  onDeleted,
}: {
  id: string;
  onClose: () => void;
  onEdit: (treatment: Treatment) => void;
  onDeleted: () => void;
}) {
  const treatmentQuery = useTreatmentByIdQuery(id);
  const deleteMut = useDeleteTreatmentMutation();
  const treatment = treatmentQuery.data;

  function handleDelete() {
    deleteMut.mutate(id, {
      onSuccess: () => {
        sileo.success({ title: "Tratamiento eliminado" });
        onDeleted();
      },
      onError: (err) => {
        sileo.error({
          title: "No se pudo eliminar",
          description: isApiError(err) ? err.message : "Intenta de nuevo.",
        });
      },
    });
  }

  return (
    <Modal
      title={treatment?.name ?? "Tratamiento"}
      size="lg"
      onClose={onClose}
      footer={
        treatment ? (
          <>
            <div style={{ marginRight: "auto" }}>
              <Button variant="danger" type="button" loading={deleteMut.isPending} disabled={deleteMut.isPending} onPress={handleDelete}>
                Eliminar
              </Button>
            </div>
            <Button variant="secondary" type="button" onPress={onClose}>
              Cerrar
            </Button>
            <Button type="button" onPress={() => onEdit(treatment)}>
              Editar
            </Button>
          </>
        ) : null
      }
    >
      {treatmentQuery.isLoading || !treatment ? (
        <div className="empty-state">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="treatment-detail">
          <div className="treatment-detail-summary">
            <div>
              <Chip label={STATUS_LABELS[treatment.status]} color={treatment.status === "ACTIVE" ? "green" : treatment.status === "COMPLETED" ? "amber" : "default"} />
              <p>{treatment.description || "Sin descripcion registrada."}</p>
            </div>
            <dl>
              <div>
                <dt>Inicio</dt>
                <dd>{treatment.startDate ? formatDate(treatment.startDate) : "Sin fecha"}</dd>
              </div>
              <div>
                <dt>Fin</dt>
                <dd>{treatment.endDate ? formatDate(treatment.endDate) : "En curso"}</dd>
              </div>
              <div>
                <dt>Relacionados</dt>
                <dd>{relatedTotal(treatment)}</dd>
              </div>
            </dl>
          </div>

          {relatedTotal(treatment) === 0 ? (
            <div className="treatment-empty">
              Este tratamiento aun no tiene elementos asociados.
            </div>
          ) : (
            <>
              <RelatedSection title="Medicamentos" count={treatment.medicationCycles.length}>
                {treatment.medicationCycles.map((cycle) => (
                  <RelatedRow
                    key={cycle.id}
                    icon={<Pill size={16} />}
                    title={cycle.medicationName}
                    subtitle={rowSubtitle([cycle.dosage, cycle.startDate ? formatDate(cycle.startDate) : null])}
                  />
                ))}
              </RelatedSection>

              <RelatedSection title="Citas y chequeos" count={treatment.appointments.length}>
                {treatment.appointments.map((appointment) => (
                  <RelatedRow
                    key={appointment.id}
                    icon={<CalendarDays size={16} />}
                    title={appointment.name || (appointment.type === "EXAM" ? "Examen" : "Cita medica")}
                    subtitle={rowSubtitle([appointment.date ? formatDate(appointment.date) : null, appointment.status])}
                  />
                ))}
              </RelatedSection>

              <RelatedSection title="Documentos" count={treatment.documents.length}>
                {treatment.documents.map((doc) => (
                  <RelatedRow
                    key={doc.id}
                    icon={<FileText size={16} />}
                    title={doc.title}
                    subtitle={rowSubtitle([doc.format, doc.documentDate ? formatDate(doc.documentDate) : doc.uploadedAt ? formatDate(doc.uploadedAt) : null])}
                  />
                ))}
              </RelatedSection>

              <RelatedSection title="Check-ins" count={treatment.dailyCheckins.length}>
                {treatment.dailyCheckins.map((checkIn) => (
                  <RelatedRow
                    key={checkIn.id}
                    icon={<HeartPulse size={16} />}
                    title={checkIn.mood}
                    subtitle={rowSubtitle([formatDate(checkIn.recordedAt), checkIn.notes])}
                  />
                ))}
              </RelatedSection>

              <RelatedSection title="Sintomas" count={treatment.symptoms.length}>
                {treatment.symptoms.map((symptom) => (
                  <RelatedRow
                    key={symptom.id}
                    icon={<HeartPulse size={16} />}
                    title={symptom.name}
                    subtitle={rowSubtitle([symptom.recordedAt ? formatDate(symptom.recordedAt) : null, symptom.severity ? `Severidad ${symptom.severity}` : null])}
                  />
                ))}
              </RelatedSection>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

function RelatedSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="treatment-related-section">
      <div className="treatment-related-title">
        <h3>{title}</h3>
        <span>{count}</span>
      </div>
      <div className="treatment-related-list">{children}</div>
    </section>
  );
}

function RelatedRow({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="treatment-related-row">
      <div className="treatment-related-icon">{icon}</div>
      <div>
        <div className="treatment-related-name">{title}</div>
        {subtitle ? <div className="treatment-related-meta">{subtitle}</div> : null}
      </div>
    </div>
  );
}
