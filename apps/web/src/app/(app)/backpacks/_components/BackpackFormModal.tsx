"use client";

import { type FormEvent } from "react";
import { useBackpackForm } from "@/hooks/useBackpackForm";
import { Button, Modal } from "@healthguard/ui";

interface BackpackFormModalProps {
  onClose: () => void;
  /** Pass a backpack ID to switch to edit mode. */
  backpackId?: string;
}

export function BackpackFormModal({ onClose, backpackId }: BackpackFormModalProps) {
  const form = useBackpackForm({ backpackId, onClose });
  const isEdit = !!backpackId;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    form.handleSave();
  }

  if (form.loading) {
    return (
      <Modal title={isEdit ? "Editar Mochila" : "Nueva Mochila"} onClose={onClose}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
          <div className="spinner spinner--page" style={{ width: 32, height: 32 }} />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={isEdit ? "Editar Mochila" : "Nueva Mochila"}
      onClose={onClose}
      footer={
        <>
          {isEdit && (
            <div style={{ marginRight: "auto" }}>
              <Button variant="danger" type="button" disabled={form.deleting} loading={form.deleting} onPress={form.handleDelete}>
                Eliminar
              </Button>
            </div>
          )}
          <Button variant="secondary" type="button" onPress={onClose}>Cancelar</Button>
          <Button type="submit" form="backpack-form" disabled={form.saving} loading={form.saving}>
            {isEdit ? "Guardar Cambios" : "Crear Mochila"}
          </Button>
        </>
      }
    >
      <form id="backpack-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre *</label>
          <input
            className="form-input"
            required
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
            placeholder="Ej: Consulta Neurología 2026"
          />
        </div>
        <div className="form-group">
          <label>Descripción (opcional)</label>
          <input
            className="form-input"
            value={form.description}
            onChange={(e) => form.setDescription(e.target.value)}
            placeholder="¿Para qué es esta mochila?"
          />
        </div>
      </form>
    </Modal>
  );
}
