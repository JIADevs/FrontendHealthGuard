"use client";

import { useEffect, useRef, useMemo } from "react";
import { useActiveDocumentSharesQuery, useShareDocumentMutation } from "@helu/api/hooks";
import type { Document } from "@helu/api";
import { ShareResult } from "@/components/ShareResult";
import { Button, Modal, Typography, Spinner } from "@helu/ui";

export function ShareModal({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const shareMut = useShareDocumentMutation();
  const activeShares = useActiveDocumentSharesQuery();
  const hasActiveLink = useMemo(
    () => (activeShares.data ?? []).some((s) => s.documentId === doc.id),
    [activeShares.data, doc.id],
  );
  const requestedForId = useRef<string | null>(null);

  const activeSharesReady = !activeShares.isLoading;

  useEffect(() => {
    if (!activeSharesReady) return;
    if (hasActiveLink) {
      requestedForId.current = null;
      return;
    }
    if (requestedForId.current === doc.id) return;
    requestedForId.current = doc.id;
    shareMut.mutate(doc.id);
  }, [doc.id, hasActiveLink, activeSharesReady, shareMut.mutate]);

  return (
    <Modal title="Compartir Documento" onClose={onClose}>
      {!activeSharesReady ? (
        <div className="empty-state">
          <Spinner size="lg" />
          <Typography variant="bodySm" color="secondary">Comprobando enlaces activos…</Typography>
        </div>
      ) : hasActiveLink ? (
        <div className="empty-state" style={{ gap: 16 }}>
          <Typography variant="bodySm" color="secondary" style={{ textAlign: "center", maxWidth: 320 }}>
            Este documento ya tiene un enlace de compartición activo. Revócalo en Compartir → Enlaces activos antes de generar uno nuevo.
          </Typography>
          <Button variant="secondary" onPress={onClose}>
            Cerrar
          </Button>
        </div>
      ) : shareMut.isPending ? (
        <div className="empty-state">
          <Spinner size="lg" />
          <Typography variant="bodySm" color="secondary">Generando enlace...</Typography>
        </div>
      ) : shareMut.data ? (
        <ShareResult
          shareUrl={shareMut.data.shareUrl}
          qrCodeUrl={shareMut.data.qrCodeUrl}
          expiresAt={shareMut.data.expiresAt}
          label={doc.title}
        />
      ) : shareMut.isError ? (
        <div className="empty-state"><Typography variant="bodySm" color="error">Error generando el enlace.</Typography></div>
      ) : null}
    </Modal>
  );
}
