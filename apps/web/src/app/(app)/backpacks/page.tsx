"use client";

import { useState } from "react";
import { useBackpacksQuery, useDeleteBackpackMutation } from "@healthguard/api/hooks";
import { Backpack, Plus, FileText, Search, Trash2 } from "lucide-react";
import { Button, Card, CardGrid, Typography } from "@healthguard/ui";
import { useDebounceSearch } from "@healthguard/ui/hooks";
import { type Backpack as BackpackType } from "@healthguard/api";
import { sileo } from "sileo";
import { ConfirmModal } from "@/components/ConfirmModal";
import { BackpackFormModal } from "./_components/BackpackFormModal";
import { BackpackDetail } from "./_components/BackpackDetail";

import "./backpacks.css";

export default function BackpacksPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceSearch(search);
  const [showForm, setShowForm] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackpackType | null>(null);

  const bps = useBackpacksQuery(debouncedSearch, 50);
  const deleteMut = useDeleteBackpackMutation();

  if (detailId) {
    return <BackpackDetail id={detailId} onBack={() => setDetailId(null)} />;
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <Typography variant="h2">Mochilas</Typography>
          <Typography variant="bodySm" color="secondary">Organiza documentos en paquetes para compartir fácilmente.</Typography>
        </div>
        <Button onPress={() => setShowForm(true)}>
          <Plus size={16} /> Nueva Mochila
        </Button>
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
          <Typography variant="bodySm" color="secondary">{debouncedSearch ? "Sin mochilas para esta búsqueda." : "No tienes mochilas. Crea una para agrupar documentos."}</Typography>
        </div>
      ) : (
        <CardGrid variant="grid">
          {bps.data!.items.map((bp) => (
            <Card
              key={bp.id}
              title={bp.name}
              subtitle={bp.description}
              icon={<Backpack size={22} />}
              onPress={() => setDetailId(bp.id)}
              footer={
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-secondary)" }}>
                    <FileText size={14} /> {bp.documentCount} documentos
                  </span>
                  <button className="icon-btn" title="Eliminar" onClick={(e) => { e.stopPropagation(); setDeleteTarget(bp); }}><Trash2 size={15} /></button>
                </div>
              }
            />
          ))}
        </CardGrid>
      )}

      {showForm && <BackpackFormModal onClose={() => setShowForm(false)} />}

      {deleteTarget && (
        <ConfirmModal
          title="Eliminar Mochila"
          message={`¿Eliminar "${deleteTarget.name}"? Los documentos no se eliminarán.`}
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={() => deleteMut.mutate(deleteTarget.id, {
            onSuccess: () => { setDeleteTarget(null); sileo.success({ title: "Mochila eliminada" }); },
            onError: () => sileo.error({ title: "No se pudo eliminar la mochila" }),
          })}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
