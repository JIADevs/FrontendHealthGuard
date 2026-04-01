"use client";

import { type FormEvent } from "react";
import { X } from "lucide-react";
import { useBackpackForm } from "@/hooks/useBackpackForm";

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
      <div className="modal-overlay">
        <div className="modal" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 160 }}>
          <div className="spinner spinner--page" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? "Editar Mochila" : "Nueva Mochila"}</h3>
          <button className="modal-close" onClick={onClose} type="button"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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
          </div>
          <div className="modal-footer">
            {isEdit && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ color: "var(--error-600)", borderColor: "var(--error-600)", marginRight: "auto" }}
                disabled={form.deleting}
                onClick={form.handleDelete}
              >
                {form.deleting && <span className="spinner" />}
                Eliminar
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ width: "auto" }} disabled={form.saving}>
              {form.saving && <span className="spinner" />}
              {isEdit ? "Guardar Cambios" : "Crear Mochila"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
