"use client";

import { useShareDocumentMutation } from "@healthguard/api/hooks";
import type { Document } from "@healthguard/api";
import { ShareResult } from "@/components/ShareResult";
import { Modal } from "@healthguard/ui";

export function ShareModal({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const shareMut = useShareDocumentMutation();

  // Auto-trigger share on mount
  if (!shareMut.data && !shareMut.isPending && !shareMut.isError) {
    shareMut.mutate(doc.id);
  }

  return (
    <Modal title="Compartir Documento" onClose={onClose}>
      {shareMut.isPending ? (
        <div className="empty-state">
          <div className="spinner spinner--page" style={{ margin: "0 auto", width: 32, height: 32 }} />
          <p style={{ marginTop: 12 }}>Generando enlace...</p>
        </div>
      ) : shareMut.data ? (
        <ShareResult
          shareUrl={shareMut.data.shareUrl}
          qrCodeUrl={shareMut.data.qrCodeUrl}
          expiresAt={shareMut.data.expiresAt}
          label={doc.title}
        />
      ) : shareMut.isError ? (
        <div className="empty-state"><p>Error generando el enlace.</p></div>
      ) : null}
    </Modal>
  );
}
