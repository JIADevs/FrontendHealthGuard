"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounceSearch } from "@healthguard/ui/hooks";
import { Search, Upload, FileText, Eye, Share2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { getDocuments, deleteDocument, isApiError, type Document } from "@healthguard/api";
import { sileo } from "sileo";
import { ConfirmModal } from "@/components/ConfirmModal";
import { UploadModal } from "./_components/UploadModal";
import { DetailModal } from "./_components/DetailModal";
import { ShareModal } from "./_components/ShareModal";

import "./documents.css";

function formatIcon(format: string) {
  const f = format?.toLowerCase() ?? "";
  if (f.includes("pdf")) return { cls: "pdf", label: "PDF" };
  if (f.includes("dicom") || f.includes("dcm")) return { cls: "dcm", label: "DCM" };
  if (f.includes("image") || f.includes("jpg") || f.includes("png") || f.includes("jpeg"))
    return { cls: "img", label: "IMG" };
  return { cls: "other", label: "DOC" };
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DocumentsPage() {
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceSearch(search);
  const [showUpload, setShowUpload] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [shareTarget, setShareTarget] = useState<Document | null>(null);

  const docs = useQuery({
    queryKey: ["documents", page, debouncedSearch],
    queryFn: () => getDocuments({ page, limit: 12, searchQuery: debouncedSearch || undefined }),
  });

  const total = docs.data?.total ?? 0;
  const totalPages = docs.data?.totalPages ?? 1;

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      setDeleteTarget(null);
      sileo.success({ title: "Documento eliminado" });
    },
    onError: (err) => {
      sileo.error({
        title: "Error al eliminar",
        description: isApiError(err) ? err.message : "No se pudo eliminar el documento.",
      });
    },
  });

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Documentos Médicos</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            {total} documento{total !== 1 ? "s" : ""} en tu carpeta
          </p>
        </div>
        <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => setShowUpload(true)} id="upload-doc-btn">
          <Upload size={16} />
          Subir Documento
        </button>
      </div>

      {/* Search */}
      <div className="docs-toolbar">
        <div className="search-wrapper">
          <Search size={18} />
          <input
            className="search-input"
            type="text"
            placeholder="Buscar por nombre o etiqueta..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            id="doc-search"
          />
        </div>
      </div>

      {/* Grid */}
      {docs.isLoading ? (
        <div className="empty-state">
          <div className="spinner spinner--page" style={{ margin: "0 auto", width: 32, height: 32 }} />
        </div>
      ) : (docs.data?.items.length ?? 0) === 0 ? (
        <div className="empty-state">
          <FileText />
          <p>{search ? "Sin resultados para esta búsqueda." : "No tienes documentos aún. ¡Sube tu primer documento!"}</p>
        </div>
      ) : (
        <div className="doc-grid">
          {docs.data!.items.map((doc) => {
            const icon = formatIcon(doc.format);
            return (
              <div key={doc.id} className="doc-card" onClick={() => setDetailId(doc.id)}>
                <div className="doc-card-header">
                  <div className={`doc-card-icon ${icon.cls}`}>{icon.label}</div>
                  <div>
                    <div className="doc-card-title">{doc.title}</div>
                    <div className="doc-card-date">{formatDate(doc.documentDate ?? doc.uploadedAt)}</div>
                  </div>
                </div>
                {(doc.subtypes.length > 0 || doc.customTags.length > 0) && (
                  <div className="doc-card-tags">
                    {doc.subtypes.map((s) => <span key={s.id} className="tag-chip">{s.name}</span>)}
                    {doc.customTags.slice(0, 3).map((t) => <span key={t.id} className="tag-chip green">{t.value}</span>)}
                  </div>
                )}
                <div className="doc-card-actions">
                  <button className="icon-btn" title="Ver" onClick={(e) => { e.stopPropagation(); setDetailId(doc.id); }}><Eye size={16} /></button>
                  <button className="icon-btn" title="Compartir" onClick={(e) => { e.stopPropagation(); setShareTarget(doc); }}><Share2 size={16} /></button>
                  <button className="icon-btn" title="Eliminar" onClick={(e) => { e.stopPropagation(); setDeleteTarget(doc); }}><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = i + Math.max(1, page - 2);
            if (p > totalPages) return null;
            return <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>;
          })}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
          <span className="pagination-info">{total} resultados</span>
        </div>
      )}

      {/* Modals */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      {detailId && <DetailModal id={detailId} onClose={() => setDetailId(null)} />}
      {shareTarget && <ShareModal doc={shareTarget} onClose={() => setShareTarget(null)} />}
      {deleteTarget && (
        <ConfirmModal
          title="Eliminar Documento"
          message={`¿Estás seguro de eliminar "${deleteTarget.title}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
