"use client";

import { useQuery } from "@tanstack/react-query";
import { useDocumentQuery } from "@healthguard/api/hooks";
import { X, ExternalLink } from "lucide-react";
import { getSignedUrl, type Document } from "@healthguard/api";

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export function DetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const doc = useDocumentQuery(id);

  const signedUrl = useQuery({
    queryKey: ["signed-url", doc.data?.fileUrl],
    queryFn: () => getSignedUrl(doc.data!.fileUrl),
    enabled: !!doc.data?.fileUrl,
  });

  const d = doc.data as Document | undefined;
  const url = signedUrl.data?.url;
  const isPdf = d?.format?.toLowerCase().includes("pdf");
  const isImage = d?.format?.toLowerCase().match(/image|jpg|jpeg|png/);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{d?.title ?? "Cargando..."}</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {doc.isLoading ? (
            <div className="empty-state">
              <div className="spinner spinner--page" style={{ margin: "0 auto", width: 32, height: 32 }} />
            </div>
          ) : d ? (
            <>
              <dl className="doc-detail-meta">
                <div><dt>Fecha</dt><dd>{formatDate(d.documentDate)}</dd></div>
                <div><dt>Formato</dt><dd>{d.format}</dd></div>
                <div><dt>Subido</dt><dd>{formatDate(d.uploadedAt)}</dd></div>
                <div><dt>Tamaño</dt><dd>{d.fileSizeBytes ? `${(d.fileSizeBytes / 1024).toFixed(0)} KB` : "—"}</dd></div>
              </dl>

              {(d.subtypes.length > 0 || d.customTags.length > 0 || d.specialties.length > 0) && (
                <div className="doc-card-tags" style={{ marginBottom: 20 }}>
                  {d.subtypes.map((s) => <span key={s.id} className="tag-chip">{s.name}</span>)}
                  {d.specialties.map((s) => <span key={s.id} className="tag-chip amber">{s.name}</span>)}
                  {d.customTags.map((t) => <span key={t.id} className="tag-chip green">{t.value}</span>)}
                </div>
              )}

              {url && (
                <div className="doc-preview">
                  {isPdf ? (
                    <iframe src={url} title={d.title} />
                  ) : isImage ? (
                    <img src={url} alt={d.title} />
                  ) : (
                    <div className="empty-state"><p>Vista previa no disponible para este formato.</p></div>
                  )}
                </div>
              )}

              {url && (
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <a href={url} target="_blank" rel="noopener" className="btn btn-ghost" style={{ fontSize: 13 }}>
                    <ExternalLink size={14} /> Ver Completo
                  </a>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
