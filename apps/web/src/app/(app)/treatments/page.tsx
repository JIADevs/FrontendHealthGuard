"use client";

import { useMemo, useState } from "react";
import {
  useDeleteTreatmentMutation,
  useTreatmentsQuery,
} from "@helu/api/hooks";
import { isApiError, type Treatment } from "@helu/api";
import { useDebounceSearch } from "@helu/ui/hooks";
import {
  ActionButton,
  Button,
  Card,
  CardGrid,
  Chip,
  EmptyState,
  SearchField,
  Spinner,
  Typography,
  formatDate,
} from "@helu/ui";
import { Activity, Plus } from "lucide-react";
import { sileo } from "sileo";
import { ConfirmModal } from "@/components/ConfirmModal";
import { TreatmentDetailModal } from "./_components/TreatmentDetailModal";
import { TreatmentFormModal } from "./_components/TreatmentFormModal";

import "./treatments.css";

const STATUS_LABELS: Record<Treatment["status"], string> = {
  ACTIVE: "Activo",
  COMPLETED: "Completado",
  INACTIVE: "Inactivo",
};

const STATUS_CHIP: Record<Treatment["status"], "green" | "amber" | "default"> = {
  ACTIVE: "green",
  COMPLETED: "amber",
  INACTIVE: "default",
};

function treatmentSubtitle(treatment: Treatment) {
  const dates = [
    treatment.startDate ? `Inicio ${formatDate(treatment.startDate)}` : null,
    treatment.endDate ? `Fin ${formatDate(treatment.endDate)}` : null,
  ].filter(Boolean);
  return dates.length > 0 ? dates.join(" - ") : "Sin periodo definido";
}

export default function TreatmentsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceSearch(search);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Treatment | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Treatment | null>(null);

  const treatments = useTreatmentsQuery(1, 100);
  const deleteMut = useDeleteTreatmentMutation();

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const items = treatments.data?.items ?? [];
    if (!q) return items;
    return items.filter((item) =>
      `${item.name} ${item.description ?? ""}`.toLowerCase().includes(q),
    );
  }, [debouncedSearch, treatments.data?.items]);

  function openCreate() {
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(treatment: Treatment) {
    setEditTarget(treatment);
    setShowForm(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        sileo.success({ title: "Tratamiento eliminado" });
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
    <>
      <div className="treatments-header">
        <div>
          <Typography variant="h2">Tratamientos</Typography>
          <Typography variant="bodySm" color="secondary">
            Agrupa medicamentos, citas, documentos y check-ins por proceso clinico.
          </Typography>
        </div>
        <Button onPress={openCreate}>
          <Plus size={16} /> Nuevo Tratamiento
        </Button>
      </div>

      <div className="treatments-toolbar">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar tratamiento..."
          accessibilityLabel="Buscar tratamientos"
        />
      </div>

      {treatments.isLoading ? (
        <div className="empty-state">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Activity />}
          message={debouncedSearch ? "Sin tratamientos para esta busqueda." : "No tienes tratamientos registrados."}
        />
      ) : (
        <CardGrid variant="grid">
          {filtered.map((treatment) => (
            <Card
              key={treatment.id}
              title={treatment.name}
              subtitle={treatmentSubtitle(treatment)}
              icon={<Activity size={22} />}
              iconBackground="var(--brand-50)"
              onPress={() => setDetailId(treatment.id)}
              actions={
                <div className="treatment-card-actions">
                  <ActionButton action="view" size="sm" tooltip="Ver" onPress={() => setDetailId(treatment.id)} />
                  <ActionButton action="edit" size="sm" tooltip="Editar" onPress={() => openEdit(treatment)} />
                  <ActionButton action="delete" size="sm" tooltip="Eliminar" onPress={() => setDeleteTarget(treatment)} />
                </div>
              }
            >
              <div className="treatment-card-body">
                {treatment.description ? (
                  <p className="treatment-description">{treatment.description}</p>
                ) : null}
                <Chip label={STATUS_LABELS[treatment.status]} color={STATUS_CHIP[treatment.status]} />
              </div>
            </Card>
          ))}
        </CardGrid>
      )}

      {showForm && (
        <TreatmentFormModal
          initial={editTarget}
          onClose={() => {
            setShowForm(false);
            setEditTarget(null);
          }}
        />
      )}
      {detailId && (
        <TreatmentDetailModal
          id={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(treatment) => {
            setDetailId(null);
            openEdit(treatment);
          }}
          onDeleted={() => setDetailId(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Eliminar Tratamiento"
          message={`Eliminar "${deleteTarget.name}" lo quitara de medicamentos, citas, documentos y check-ins relacionados.`}
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
