"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, FileText, Check } from "lucide-react";
import { getDocuments, addDocToBackpack, isApiError, type BackpackWithDocs } from "@healthguard/api";
import { formatDate, Button } from "@healthguard/ui";
import { sileo } from "sileo";

interface AddDocsModalProps {
  backpackId: string;
  existingIds: string[];
  onClose: () => void;
}

export function AddDocsModal({ backpackId, existingIds, onClose }: AddDocsModalProps) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);

  const docs = useQuery({ queryKey: ["documents", "all"], queryFn: () => getDocuments({ page: 1, limit: 100 }) });
  const available = (docs.data?.items ?? []).filter((d) => !existingIds.includes(d.id));

  const addMut = useMutation({
    mutationFn: async () => {
      await Promise.all(selected.map((docId) => addDocToBackpack(backpackId, docId)));
    },
    onMutate: async () => {
      const selectedDocs = (docs.data?.items ?? []).filter((d) => selected.includes(d.id));
      const count = selectedDocs.length;
      await qc.cancelQueries({ queryKey: ["backpack", backpackId] });
      const previous = qc.getQueryData(["backpack", backpackId]);
      qc.setQueryData(["backpack", backpackId], (old: BackpackWithDocs | undefined) =>
        old ? { ...old, documents: [...(old.documents ?? []), ...selectedDocs] } : old
      );
      onClose();
      return { previous, count };
    },
    onError: (_, __, ctx) => {
      qc.setQueryData(["backpack", backpackId], ctx?.previous);
      sileo.error({ title: "No se pudieron agregar los documentos" });
    },
    onSuccess: (_, __, ctx) => {
      const count = ctx?.count ?? 0;
      sileo.success({ title: count === 1 ? "Documento agregado" : `${count} documentos agregados` });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["backpack", backpackId] });
      qc.invalidateQueries({ queryKey: ["backpacks"] });
    },
  });

  function toggle(id: string) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Agregar Documentos</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {docs.isLoading ? (
            <div className="empty-state">
              <div className="spinner spinner--page" style={{ margin: "0 auto", width: 32, height: 32 }} />
            </div>
          ) : available.length === 0 ? (
            <div className="empty-state"><p>Todos tus documentos ya están en esta mochila.</p></div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
                Selecciona los documentos para agregar ({selected.length} seleccionados)
              </p>
              <div className="doc-selector">
                {available.map((doc) => (
                  <div key={doc.id} className="doc-selector-item" onClick={() => toggle(doc.id)}>
                    <div className={`doc-check${selected.includes(doc.id) ? " checked" : ""}`}>
                      {selected.includes(doc.id) && <Check size={12} />}
                    </div>
                    <FileText size={14} style={{ color: "var(--gray-400)" }} />
                    <span style={{ flex: 1 }}>{doc.title}</span>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{formatDate(doc.uploadedAt)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onPress={onClose}>Cancelar</Button>
          <Button disabled={selected.length === 0 || addMut.isPending} loading={addMut.isPending} onPress={() => addMut.mutate()}>
            Agregar {selected.length > 0 ? `(${selected.length})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
