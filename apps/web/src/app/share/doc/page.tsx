"use client";

import "../../(app)/documents/documents.css";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import {
  consumeSharedDocument,
  getSharedDocumentSignedUrl,
  isApiError,
  type Document,
} from "@helu/api";
import { Button, Chip, Spinner, Typography, formatDate, formatFileSize } from "@helu/ui";

const shell: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: "32px 16px",
  background: "var(--gray-50, #f9fafb)",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: 720,
  background: "var(--surface-primary, #fff)",
  borderRadius: "var(--radius-md, 12px)",
  boxShadow: "0 1px 3px rgb(0 0 0 / 0.08)",
  padding: 24,
};

function ShareDocInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const docQuery = useQuery({
    queryKey: ["shared-document", token],
    queryFn: () => consumeSharedDocument(token!),
    enabled: Boolean(token),
  });

  const signedQuery = useQuery({
    queryKey: ["shared-document-signed-url", token],
    queryFn: () => getSharedDocumentSignedUrl(token!),
    enabled: Boolean(token) && Boolean(docQuery.data),
  });

  if (!token) {
    return (
      <div style={shell}>
        <div style={card}>
          <Typography variant="h3">Enlace inválido</Typography>
          <Typography variant="bodySm" color="secondary" style={{ marginTop: 8 }}>
            Falta el token en la URL. Pedí al remitente que te envíe el enlace completo.
          </Typography>
          <div style={{ marginTop: 20 }}>
            <Link href="/login" className="btn btn-primary">
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (docQuery.isLoading) {
    return (
      <div style={{ ...shell, justifyContent: "center" }}>
        <Spinner size="lg" />
        <Typography variant="bodySm" color="secondary" style={{ marginTop: 12 }}>
          Cargando documento…
        </Typography>
      </div>
    );
  }

  if (docQuery.isError) {
    const msg = isApiError(docQuery.error)
      ? docQuery.error.message
      : "No pudimos cargar este documento.";
    return (
      <div style={shell}>
        <div style={card}>
          <Typography variant="h3">No disponible</Typography>
          <Typography variant="bodySm" color="secondary" style={{ marginTop: 8 }}>
            {msg}
          </Typography>
          <div style={{ marginTop: 20 }}>
            <Link href="/login">
              <Button type="button" variant="secondary">Ir a Helu</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const d = docQuery.data as Document;
  const url = signedQuery.data?.url;
  const isPdf = d.format?.toLowerCase().includes("pdf");
  const isImage = d.format?.toLowerCase().match(/image|jpg|jpeg|png/);

  return (
    <div style={shell}>
      <div style={{ width: "100%", maxWidth: 720, marginBottom: 16 }}>
        <Typography variant="caption" color="secondary">
          Helu · documento compartido
        </Typography>
      </div>
      <div style={card}>
        <Typography variant="h2" style={{ marginBottom: 4 }}>{d.title}</Typography>
        <Typography variant="bodySm" color="secondary" style={{ marginBottom: 20 }}>
          Vista de solo lectura. El enlace caduca según lo configuró quien lo compartió.
        </Typography>

        <dl className="doc-detail-meta">
          {d.documentDate ? (
            <div><dt>Fecha del documento</dt><dd>{formatDate(d.documentDate)}</dd></div>
          ) : null}
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

        {signedQuery.isLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Spinner size="sm" />
            <Typography variant="bodySm" color="secondary">Preparando vista previa…</Typography>
          </div>
        )}

        {signedQuery.isError && (
          <Typography variant="bodySm" color="secondary" style={{ marginBottom: 16 }}>
            {isApiError(signedQuery.error)
              ? signedQuery.error.message
              : "No se pudo generar la vista previa del archivo."}
          </Typography>
        )}

        {url && (
          <>
            <div className="doc-preview">
              {isPdf ? (
                <iframe src={url} title={d.title} />
              ) : isImage ? (
                <img src={url} alt={d.title} />
              ) : (
                <div className="empty-state">
                  <Typography variant="bodySm" color="secondary">
                    Vista previa no disponible para este formato.
                  </Typography>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: 13 }}>
                <ExternalLink size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Abrir archivo
              </a>
            </div>
          </>
        )}

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--gray-100, #eee)" }}>
          <Typography variant="caption" color="secondary">
            ¿Tenés cuenta en Helu?{" "}
            <Link href="/login" style={{ color: "var(--primary-600, #2563eb)" }}>Iniciar sesión</Link>
          </Typography>
        </div>
      </div>
    </div>
  );
}

export default function ShareDocPage() {
  return (
    <Suspense
      fallback={(
        <div style={{ ...shell, justifyContent: "center" }}>
          <Spinner size="lg" />
        </div>
      )}
    >
      <ShareDocInner />
    </Suspense>
  );
}
