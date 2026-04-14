"use client";

import { useQuery } from "@tanstack/react-query";
import { useDocumentQuery } from "@helu/api/hooks";
import { ExternalLink } from "lucide-react";
import { getSignedUrl, type Document } from "@helu/api";
import { formatDate, formatFileSize, Chip, Modal,Spinner } from "@helu/ui";

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
    <Modal title={d?.title ?? "Cargando..."} size="lg" onClose={onClose}>
      {doc.isLoading ? (
        <div className="empty-state">
          <Spinner size="lg" />
        </div>
      ) : d ? (
        <>
          <dl className="doc-detail-meta">
            <div><dt>Fecha</dt><dd>{formatDate(d.documentDate)}</dd></div>
            <div><dt>Formato</dt><dd>{d.format}</dd></div>
            <div><dt>Subido</dt><dd>{formatDate(d.uploadedAt)}</dd></div>
            <div><dt>Tamaño</dt><dd>{formatFileSize(d.fileSizeBytes)}</dd></div>
          </dl>

          {(d.subtypes.length > 0 || d.customTags.length > 0 || d.specialties.length > 0) && (
            <div className="doc-card-tags" style={{ marginBottom: 20 }}>
              {d.subtypes.map((s) => <Chip key={s.id} label={s.name} />)}
              {d.specialties.map((s) => <Chip key={s.id} label={s.name} color="amber" />)}
              {d.customTags.map((t) => <Chip key={t.id} label={t.value} color="green" />)}
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
    </Modal>
  );
}
