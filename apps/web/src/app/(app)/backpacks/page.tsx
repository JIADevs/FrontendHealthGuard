"use client";

import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Backpack,
  Plus,
  FileText,
  Trash2,
  Share2,
  X,
  Copy,
  ChevronLeft,
  Check,
} from "lucide-react";
import {
  getBackpacks,
  getBackpackById,
  createBackpack,
  deleteBackpack,
  addDocToBackpack,
  removeDocFromBackpack,
  shareBackpack,
  getDocuments,
  isApiError,
  type Backpack as BackpackType,
  type BackpackWithDocs,
  type BackpackCreate,
  type Document,
} from "@healthguard/api";
import { sileo } from "sileo";

import "./backpacks.css";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

// ══════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════
export default function BackpacksPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackpackType | null>(null);

  const bps = useQuery({ queryKey: ["backpacks"], queryFn: () => getBackpacks({ page: 1, limit: 50 }) });

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
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

      {bps.isLoading ? (
        <div className="empty-state">
          <div className="spinner spinner--page" style={{ margin: "0 auto", width: 32, height: 32 }} />
        </div>
      ) : (bps.data?.items.length ?? 0) === 0 ? (
        <div className="empty-state">
          <Backpack />
          <p>No tienes mochilas. Crea una para agrupar documentos.</p>
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

// ══════════════════════════════════════════════════════
//  BACKPACK FORM MODAL
// ══════════════════════════════════════════════════════
function BackpackFormModal({ onClose }: { onClose: () => void }) {
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

// ══════════════════════════════════════════════════════
//  BACKPACK DETAIL
// ══════════════════════════════════════════════════════
function BackpackDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [shareData, setShareData] = useState<{ shareUrl: string; qrCodeUrl: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const bp = useQuery({ queryKey: ["backpack", id], queryFn: () => getBackpackById(id) }) as { data: BackpackWithDocs | undefined; isLoading: boolean };

  const removeMut = useMutation({
    mutationFn: (docId: string) => removeDocFromBackpack(id, docId),
    onMutate: async (docId) => {
      await qc.cancelQueries({ queryKey: ["backpack", id] });
      const previous = qc.getQueryData(["backpack", id]);
      qc.setQueryData(["backpack", id], (old: BackpackWithDocs | undefined) =>
        old ? { ...old, documents: old.documents.filter((d) => d.id !== docId) } : old
      );
      return { previous };
    },
    onError: (_, __, ctx) => {
      qc.setQueryData(["backpack", id], ctx?.previous);
      sileo.error({ title: "No se pudo quitar el documento" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["backpack", id] });
      qc.invalidateQueries({ queryKey: ["backpacks"] });
    },
  });

  const shareMut = useMutation({
    mutationFn: () => shareBackpack(id),
    onSuccess: (data) => setShareData(data),
  });

  function handleCopy() {
    if (shareData) {
      navigator.clipboard.writeText(shareData.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 16 }}>
        <ChevronLeft size={16} /> Volver a mochilas
      </button>

      {bp.isLoading ? (
        <div className="empty-state">
          <div className="spinner spinner--page" style={{ margin: "0 auto", width: 32, height: 32 }} />
        </div>
      ) : bp.data ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                <Backpack size={22} style={{ verticalAlign: -3, marginRight: 8, color: "var(--primary-500)" }} />
                {bp.data.name}
              </h1>
              {bp.data.description && (
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{bp.data.description}</p>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(true)}>
                <Plus size={16} /> Agregar Documentos
              </button>
              <button
                className="btn btn-primary"
                style={{ width: "auto" }}
                onClick={() => shareMut.mutate()}
                disabled={shareMut.isPending}
              >
                <Share2 size={16} /> Compartir Mochila
              </button>
            </div>
          </div>

          {shareData && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body share-result">
                <img src={shareData.qrCodeUrl} alt="QR" width={120} height={120} style={{ display: "block" }} />
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Enlace de compartición</p>
                <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>Expira el {formatDate(shareData.expiresAt)}</p>
                <div className="share-url" style={{ maxWidth: 420, margin: "12px auto 0" }}>
                  <input readOnly value={shareData.shareUrl} />
                  <button className="btn btn-ghost" onClick={handleCopy} style={{ padding: "6px 12px" }}>
                    {copied ? "✓ Copiado" : <><Copy size={14} /> Copiar</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <span className="card-title">{bp.data.documents?.length ?? 0} Documentos</span>
            </div>
            <div className="card-body">
              {(bp.data.documents?.length ?? 0) === 0 ? (
                <div className="empty-state"><p>Esta mochila no tiene documentos.</p></div>
              ) : (
                <div className="bp-detail-docs">
                  {bp.data.documents.map((doc) => (
                    <div key={doc.id} className="bp-doc-row">
                      <FileText size={16} style={{ color: "var(--gray-400)", flexShrink: 0 }} />
                      <span className="bp-doc-row-title">{doc.title}</span>
                      <span className="bp-doc-row-date">{formatDate(doc.uploadedAt)}</span>
                      <button className="icon-btn" title="Quitar" onClick={() => removeMut.mutate(doc.id)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {showAdd && <AddDocsModal backpackId={id} existingIds={(bp.data.documents ?? []).map((d) => d.id)} onClose={() => setShowAdd(false)} />}
        </>
      ) : null}
    </>
  );
}

// ══════════════════════════════════════════════════════
//  ADD DOCS MODAL
// ══════════════════════════════════════════════════════
function AddDocsModal({ backpackId, existingIds, onClose }: { backpackId: string; existingIds: string[]; onClose: () => void }) {
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
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" style={{ width: "auto" }} disabled={selected.length === 0 || addMut.isPending} onClick={() => addMut.mutate()}>
            {addMut.isPending && <span className="spinner" />}
            Agregar {selected.length > 0 ? `(${selected.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  CONFIRM MODAL
// ══════════════════════════════════════════════════════
function ConfirmModal({ title, message, confirmLabel, loading, onConfirm, onCancel }: { title: string; message: string; confirmLabel: string; loading: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-body" style={{ paddingTop: 32 }}>
          <p className="confirm-title">{title}</p>
          <p className="confirm-message">{message}</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancelar</button>
            <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
              {loading && <span className="spinner" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
