"use client";

import { useState, type FormEvent } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { createBackpack, isApiError, type BackpackCreate } from "@healthguard/api";
import { sileo } from "sileo";

export function BackpackFormModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: (data: BackpackCreate) => createBackpack(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["backpacks"] });
      sileo.success({ title: "Mochila creada", description: vars.name });
      onClose();
    },
    onError: (err) => setError(isApiError(err) ? err.message : "Error creando mochila"),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mut.mutate({ name, description: description || undefined, type: "CUSTOM" });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Nueva Mochila</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nombre *</label>
              <input className="form-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Consulta Neurología 2026" />
            </div>
            <div className="form-group">
              <label>Descripción (opcional)</label>
              <input className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿Para qué es esta mochila?" />
            </div>
            {error && <p className="form-error">{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ width: "auto" }} disabled={mut.isPending}>
              {mut.isPending && <span className="spinner" />}
              Crear Mochila
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
