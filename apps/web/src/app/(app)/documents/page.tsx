"use client";

import { useState } from "react";
import { useDocumentsQuery, useDeleteDocumentMutation } from "@healthguard/api/hooks";
import { useDebounceSearch } from "@healthguard/ui/hooks";
import { formatDate, PAGE_SIZE_GRID, Button, Pagination, Chip, Card, CardGrid, SearchField, Typography } from "@healthguard/ui";
import { Upload, FileText, Eye, Share2, Trash2 } from "lucide-react";
import { isApiError, type Document } from "@healthguard/api";
import { sileo } from "sileo";
import { ConfirmModal } from "@/components/ConfirmModal";
import { DocumentTypeIcon } from "@healthguard/ui";
import { UploadModal } from "./_components/UploadModal";
import { DetailModal } from "./_components/DetailModal";
import { ShareModal } from "./_components/ShareModal";

import "./documents.css";

export default function DocumentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceSearch(search);
  const [showUpload, setShowUpload] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [shareTarget, setShareTarget] = useState<Document | null>(null);

  const docs = useDocumentsQuery(debouncedSearch, page, PAGE_SIZE_GRID);
  const deleteMut = useDeleteDocumentMutation();

  const total = docs.data?.total ?? 0;
  const totalPages = docs.data?.totalPages ?? 1;

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <Typography variant="h2">Documentos Médicos</Typography>
          <Typography variant="bodySm" color="secondary">{total} documento{total !== 1 ? "s" : ""} en tu carpeta</Typography>
        </div>
        <Button onPress={() => setShowUpload(true)}>
          <Upload size={16} /> Subir Documento
        </Button>
      </div>

      {/* Search */}
      <div className="docs-toolbar">
        <SearchField
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Buscar por nombre o etiqueta..."
          accessibilityLabel="Buscar documentos"
        />
      </div>

      {/* Grid */}
      {docs.isLoading ? (
        <div className="empty-state">
          <div className="spinner spinner--page" style={{ margin: "0 auto", width: 32, height: 32 }} />
        </div>
      ) : (docs.data?.items.length ?? 0) === 0 ? (
        <div className="empty-state">
          <FileText />
          <Typography variant="bodySm" color="secondary">{search ? "Sin resultados para esta búsqueda." : "No tienes documentos aún. ¡Sube tu primer documento!"}</Typography>
        </div>
      ) : (
        <CardGrid variant="grid">
          {docs.data!.items.map((doc) => (
            <Card
              key={doc.id}
              title={doc.title}
              subtitle={formatDate(doc.documentDate ?? doc.uploadedAt)}
              icon={<DocumentTypeIcon format={doc.format} documentTypeName={doc.documentType?.name} />}
              onPress={() => setDetailId(doc.id)}
              footer={
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="icon-btn" title="Ver" onClick={(e) => { e.stopPropagation(); setDetailId(doc.id); }}><Eye size={16} /></button>
                  <button className="icon-btn" title="Compartir" onClick={(e) => { e.stopPropagation(); setShareTarget(doc); }}><Share2 size={16} /></button>
                  <button className="icon-btn" title="Eliminar" onClick={(e) => { e.stopPropagation(); setDeleteTarget(doc); }}><Trash2 size={16} /></button>
                </div>
              }
            >
              {(doc.subtypes.length > 0 || doc.customTags.length > 0) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {doc.subtypes.map((s) => <Chip key={s.id} label={s.name} />)}
                  {doc.customTags.slice(0, 3).map((t) => <Chip key={t.id} label={t.value} color="green" />)}
                </div>
              )}
            </Card>
          ))}
        </CardGrid>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

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
          onConfirm={() =>
            deleteMut.mutate(deleteTarget.id, {
              onSuccess: () => {
                setDeleteTarget(null);
                sileo.success({ title: "Documento eliminado" });
              },
              onError: (err) => {
                sileo.error({
                  title: "Error al eliminar",
                  description: isApiError(err) ? err.message : "No se pudo eliminar el documento.",
                });
              },
            })
          }
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
