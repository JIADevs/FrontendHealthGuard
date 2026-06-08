"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  consumeSharedDocument,
  getSharedDocumentSignedUrl,
  isApiError,
} from "@helu/api";
import { Button, Spinner, Typography } from "@helu/ui";

const shell: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: "32px 16px",
  background: "var(--gray-50, #f9fafb)",
};

const card: React.CSSProperties = { width: "100%", maxWidth: 720, background: "#fff", borderRadius: 12, padding: 24 };

function ShareDocInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const consumeQuery = useQuery({
    queryKey: ["shared-document", token],
    queryFn: () => consumeSharedDocument(token!),
    enabled: Boolean(token),
  });

  const signedQuery = useQuery({
    queryKey: ["shared-document-signed-url", token],
    queryFn: () => getSharedDocumentSignedUrl(token!),
    enabled: Boolean(token) && consumeQuery.isSuccess,
  });
  const signedUrl = signedQuery.data?.url;

  useEffect(() => {
    if (!signedUrl) return;
    window.location.replace(signedUrl);
  }, [signedUrl]);

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

  if (consumeQuery.isLoading || signedQuery.isLoading) {
    return (
      <div style={{ ...shell, justifyContent: "center" }}>
        <Spinner size="lg" />
        <Typography variant="bodySm" color="secondary" style={{ marginTop: 12 }}>
          Abriendo documento…
        </Typography>
      </div>
    );
  }

  if (consumeQuery.isError || signedQuery.isError) {
    const error = consumeQuery.error ?? signedQuery.error;
    const msg = isApiError(error)
      ? error.message
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

  return (
    <div style={{ ...shell, justifyContent: "center" }}>
      <Spinner size="lg" />
      <Typography variant="bodySm" color="secondary" style={{ marginTop: 12 }}>
        Redirigiendo al documento...
      </Typography>
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
