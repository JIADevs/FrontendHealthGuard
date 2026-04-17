"use client";

import { useEffect, useRef } from "react";
import { useShareDocumentMutation } from "@helu/api/hooks";
import type { Document } from "@helu/api";
import { ShareResult } from "@/components/ShareResult";
import { Modal, Typography,Spinner } from "@helu/ui";

export function ShareModal({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const shareMut = useShareDocumentMutation();
  const requestedForId = useRef<string | null>(null);

  useEffect(() => {
    if (requestedForId.current === doc.id) return;
    requestedForId.current = doc.id;
    shareMut.mutate(doc.id);
  }, [doc.id, shareMut.mutate]);

  return (
    <Modal title="Compartir Documento" onClose={onClose}>
      {shareMut.isPending ? (
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
