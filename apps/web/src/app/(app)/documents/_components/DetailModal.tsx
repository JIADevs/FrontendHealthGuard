"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDocumentQuery } from "@healthguard/api/hooks";
import { ExternalLink } from "lucide-react";
import { getSignedUrl, type Document } from "@healthguard/api";
import { formatDate, formatFileSize, Chip, Modal, Spinner, Typography } from "@healthguard/ui";

export function DetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const doc = useDocumentQuery(id);

  const signedUrl = useQuery({
    queryKey: ["signed-url", doc.data?.fileUrl],
    queryFn: () => getSignedUrl(doc.data!.fileUrl),
    enabled: !!doc.data?.fileUrl,
  });

  const d = doc.data as Document | undefined;
  const url = signedUrl.data?.url;
  const isPdf = !!d?.format?.toLowerCase().includes("pdf");
  const isImage = !!d?.format?.toLowerCase().match(/image|jpg|jpeg|png|webp/);

  const canPreview = !!d && !!(isPdf || isImage) && !!d.fileUrl;
  const fetchingSignedUrl = canPreview && !url && signedUrl.isFetching;
  const signedUrlFailed = canPreview && !url && signedUrl.isError;

  const [embedReady, setEmbedReady] = useState(false);
  useEffect(() => {
    setEmbedReady(false);
  }, [url]);

  // Algunos PDFs no disparan onLoad en iframe; ocultamos el overlay tras un máximo razonable.
  useEffect(() => {
    if (!url) return;
    const t = setTimeout(() => setEmbedReady(true), 14_000);
    return () => clearTimeout(t);
  }, [url]);

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

          {canPreview && (
            <div className="doc-preview">
              {fetchingSignedUrl && (
                <div className="doc-preview-loading">
                  <Spinner size="lg" />
                  <p className="doc-preview-loading-text">Preparando vista previa…</p>
                </div>
              )}

              {signedUrlFailed && (
                <div className="doc-preview-loading">
                  <Typography variant="bodySm" color="secondary" align="center">
                    No se pudo obtener el enlace de vista previa. Usa &quot;Ver completo&quot; si aparece abajo o inténtalo de nuevo.
                  </Typography>
                </div>
              )}

              {url && (
                <>
                  {!embedReady && (
                    <div className="doc-preview-loading doc-preview-loading--overlay" aria-hidden>
                      <Spinner size="lg" />
                      <p className="doc-preview-loading-text">Cargando contenido…</p>
                    </div>
                  )}
                  {isPdf ? (
                    <iframe
                      src={url}
                      title={d.title}
                      onLoad={() => setEmbedReady(true)}
                    />
                  ) : (
                    <img
                      src={url}
                      alt={d.title}
                      onLoad={() => setEmbedReady(true)}
                    />
                  )}
                </>
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
