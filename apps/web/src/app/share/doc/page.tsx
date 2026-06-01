"use client";

import "../../(app)/documents/documents.css";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blobError, setBlobError] = useState<string | null>(null);

  const docQuery = useQuery({
    queryKey: ["shared-document", token],
    queryFn: () => consumeSharedDocument(token!),
    enabled: Boolean(token),
  });

  const signedQuery = useQuery({
    queryKey: ["shared-document-signed-url", token],
    queryFn: () => getSharedDocumentSignedUrl(token!),
    // Pedimos en paralelo para reducir el tiempo hasta mostrar la vista.
    enabled: Boolean(token),
  });
  const url = signedQuery.data?.url;

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    let localObjectUrl: string | null = null;

    const loadBlob = async () => {
      try {
        setBlobError(null);
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("No se pudo cargar el archivo compartido.");
        }
        const fileBlob = await res.blob();
        if (cancelled) return;
        localObjectUrl = URL.createObjectURL(fileBlob);
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return localObjectUrl;
        });
      } catch {
        if (!cancelled) {
          // Fallback al URL firmado original si el fetch del blob falla (CORS o proveedor externo).
          setBlobError("No se pudo incrustar el archivo; usando vista directa.");
          setBlobUrl(null);
        }
      }
    };

    void loadBlob();

    return () => {
      cancelled = true;
      if (localObjectUrl) URL.revokeObjectURL(localObjectUrl);
    };
  }, [url]);

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
  const isPdf = d.format?.toLowerCase().includes("pdf");
  const isImage = d.format?.toLowerCase().match(/image|jpg|jpeg|png/);
  const previewUrl = blobUrl ?? url ?? null;

  return (
    <div style={shell}>
      <div style={card}>
        <Typography variant="h2" style={{ marginBottom: 12 }}>{d.title}</Typography>

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

        {blobError && (
          <Typography variant="caption" color="secondary" style={{ marginBottom: 8 }}>
            {blobError}
          </Typography>
        )}

        {previewUrl && (
          <div className="doc-preview">
            {isPdf ? (
              <object data={previewUrl} type="application/pdf" style={{ width: "100%", height: "70vh" }}>
                <iframe src={previewUrl} title={d.title} />
              </object>
            ) : isImage ? (
              <img src={previewUrl} alt={d.title} />
            ) : (
              <div className="empty-state">
                <Typography variant="bodySm" color="secondary">
                  Vista previa no disponible para este formato.
                </Typography>
              </div>
            )}
          </div>
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
