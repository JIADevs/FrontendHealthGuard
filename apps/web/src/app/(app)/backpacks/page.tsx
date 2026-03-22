"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackpacksQuery } from "@healthguard/api/hooks";
import { Backpack, Plus, FileText, Search, Trash2 } from "lucide-react";
import { useDebounceSearch } from "@healthguard/ui/hooks";
import { deleteBackpack, type Backpack as BackpackType } from "@healthguard/api";
import { sileo } from "sileo";
import { ConfirmModal } from "@/components/ConfirmModal";
import { BackpackFormModal } from "./_components/BackpackFormModal";
import { BackpackDetail } from "./_components/BackpackDetail";

import "./backpacks.css";

export default function BackpacksPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceSearch(search);
  const [showForm, setShowForm] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackpackType | null>(null);

  const bps = useBackpacksQuery(debouncedSearch, 50);

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteBackpack(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["backpacks"] });
      const previous = qc.getQueryData(["backpacks"]);
      qc.setQueryData(["backpacks"], (old: any) =>
        old ? { ...old, items: old.items.filter((bp: BackpackType) => bp.id !== id) } : old
      );
      return { previous };
    },
    onError: (_, __, ctx) => {
      qc.setQueryData(["backpacks"], ctx?.previous);
      sileo.error({ title: "No se pudo eliminar la mochila" });
    },
    onSuccess: () => { setDeleteTarget(null); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["backpacks"] }); },
  });

  if (detailId) {
    return <BackpackDetail id={detailId} onBack={() => setDetailId(null)} />;
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Mochilas</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Organiza documentos en paquetes para compartir fácilmente.
          </p>
        </div>
        <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => setShowForm(true)}>
          <Plus size={16} /> Nueva Mochila
        </button>
      </div>

      <div className="bp-toolbar">
        <div className="bp-search-wrapper">
          <Search size={16} />
          <input
            className="bp-search-input"
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {bps.isLoading ? (
        <div className="empty-state">
          <div className="spinner spinner--page" style={{ margin: "0 auto", width: 32, height: 32 }} />
        </div>
      ) : (bps.data?.items.length ?? 0) === 0 ? (
        <div className="empty-state">
          <Backpack />
          <p>{debouncedSearch ? "Sin mochilas para esta búsqueda." : "No tienes mochilas. Crea una para agrupar documentos."}</p>
        </div>
      ) : (
        <div className="bp-grid">
          {bps.data!.items.map((bp) => (
            <div key={bp.id} className="bp-card" onClick={() => setDetailId(bp.id)}>
              <div className="bp-card-header">
                <div className="bp-card-icon"><Backpack size={22} /></div>
                <div className="bp-card-name">{bp.name}</div>
              </div>
              {bp.description && <div className="bp-card-desc">{bp.description}</div>}
              <div className="bp-card-footer">
                <span className="bp-doc-count"><FileText size={14} /> {bp.documentCount} documentos</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="icon-btn" title="Eliminar" onClick={(e) => { e.stopPropagation(); setDeleteTarget(bp); }}><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <BackpackFormModal onClose={() => setShowForm(false)} />}

      {deleteTarget && (
        <ConfirmModal
          title="Eliminar Mochila"
          message={`¿Eliminar "${deleteTarget.name}"? Los documentos no se eliminarán.`}
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
