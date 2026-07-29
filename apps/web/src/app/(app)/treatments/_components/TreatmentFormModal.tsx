"use client";

import { type FormEvent } from "react";
import {
  Button,
  DatePicker,
  Modal,
  Select,
  TextField,
} from "@helu/ui";
import {
  useTreatmentFormCore,
  type TreatmentStatus,
} from "@helu/api/hooks";
import type { Treatment } from "@helu/api";
import { sileo } from "sileo";

const STATUS_OPTIONS: Array<{ value: TreatmentStatus; label: string }> = [
  { value: "ACTIVE", label: "Activo" },
  { value: "COMPLETED", label: "Completado" },
  { value: "INACTIVE", label: "Inactivo" },
];

export function TreatmentFormModal({
  initial,
  onClose,
}: {
  initial?: Treatment | null;
  onClose: () => void;
}) {
  const form = useTreatmentFormCore({
    initial,
    adapters: {
      onSaveSuccess: () => {
        sileo.success({
          title: initial ? "Tratamiento actualizado" : "Tratamiento creado",
        });
      },
      afterSave: onClose,
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    form.handleSave();
  }

  return (
    <Modal
      title={form.isEdit ? "Editar Tratamiento" : "Nuevo Tratamiento"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onPress={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="treatment-form"
            disabled={form.saving}
            loading={form.saving}
          >
            {form.isEdit ? "Guardar Cambios" : "Crear Tratamiento"}
          </Button>
        </>
      }
    >
      <form id="treatment-form" className="treatment-form" onSubmit={handleSubmit}>
        <TextField
          label="Nombre"
          value={form.name}
          onChange={form.setName}
          placeholder="Ej: Migrana, Alopecia, Dolor lumbar"
          required
        />
        <TextField
          label="Descripcion (opcional)"
          value={form.description}
          onChange={form.setDescription}
          placeholder="Notas generales del proceso"
          multiline
        />
        <Select
          label="Estado"
          value={form.status}
          onChange={(value) => form.setStatus(value as TreatmentStatus)}
          options={STATUS_OPTIONS}
        />
        <div className="treatment-form-grid">
          <DatePicker
            label="Fecha de inicio"
            value={form.startDate}
            onChange={form.setStartDate}
          />
          <DatePicker
            label="Fecha de fin"
            value={form.endDate}
            onChange={form.setEndDate}
            minDate={form.startDate || undefined}
          />
        </div>
        {form.error ? <p className="form-error">{form.error}</p> : null}
      </form>
    </Modal>
  );
}
