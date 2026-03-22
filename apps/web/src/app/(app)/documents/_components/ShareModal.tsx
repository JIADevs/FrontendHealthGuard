"use client";

import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { shareDocument, type Document } from "@healthguard/api";
import { ShareResult } from "@/components/ShareResult";

export function ShareModal({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const shareMut = useMutation({ mutationFn: () => shareDocument(doc.id) });

  // Auto-trigger share on mount
  if (!shareMut.data && !shareMut.isPending && !shareMut.isError) {
    shareMut.mutate();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Compartir Documento</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
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
        </div>
      </div>
    </div>
  );
}
