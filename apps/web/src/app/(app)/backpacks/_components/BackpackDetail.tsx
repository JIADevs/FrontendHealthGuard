"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackpackQuery, useShareBackpackMutation } from "@healthguard/api/hooks";
import { Backpack, FileText, X, Share2, ChevronLeft } from "lucide-react";
import { Plus } from "lucide-react";
import { removeDocFromBackpack, type BackpackWithDocs } from "@healthguard/api";
import { formatDate } from "@healthguard/ui";
import { sileo } from "sileo";
import { ShareResult } from "@/components/ShareResult";
import { AddDocsModal } from "./AddDocsModal";

interface BackpackDetailProps {
  id: string;
  onBack: () => void;
}

export function BackpackDetail({ id, onBack }: BackpackDetailProps) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [shareData, setShareData] = useState<{ shareUrl: string; qrCodeUrl: string; expiresAt: string } | null>(null);

  const bp = useBackpackQuery(id) as { data: BackpackWithDocs | undefined; isLoading: boolean };

  const removeMut = useMutation({
    mutationFn: (docId: string) => removeDocFromBackpack(id, docId),
    onMutate: async (docId) => {
      await qc.cancelQueries({ queryKey: ["backpack", id] });
      const previous = qc.getQueryData(["backpack", id]);
      qc.setQueryData(["backpack", id], (old: BackpackWithDocs | undefined) =>
        old ? { ...old, documents: old.documents.filter((d) => d.id !== docId) } : old
      );
      return { previous };
    },
    onError: (_, __, ctx) => {
      qc.setQueryData(["backpack", id], ctx?.previous);
      sileo.error({ title: "No se pudo quitar el documento" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["backpack", id] });
      qc.invalidateQueries({ queryKey: ["backpacks"] });
    },
  });

  const shareMut = useShareBackpackMutation();

  return (
    <>
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 16 }}>
        <ChevronLeft size={16} /> Volver a mochilas
      </button>

      {bp.isLoading ? (
        <div className="empty-state">
          <div className="spinner spinner--page" style={{ margin: "0 auto", width: 32, height: 32 }} />
        </div>
      ) : bp.data ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                <Backpack size={22} style={{ verticalAlign: -3, marginRight: 8, color: "var(--primary-500)" }} />
                {bp.data.name}
              </h1>
              {bp.data.description && (
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{bp.data.description}</p>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(true)}>
                <Plus size={16} /> Agregar Documentos
              </button>
              <button
                className="btn btn-primary"
                style={{ width: "auto" }}
                onClick={() => shareMut.mutate(id, { onSuccess: (data) => setShareData(data as typeof shareData) })}
                disabled={shareMut.isPending}
              >
                <Share2 size={16} /> Compartir Mochila
              </button>
            </div>
          </div>

          {shareData && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body">
                <ShareResult
                  shareUrl={shareData.shareUrl}
                  qrCodeUrl={shareData.qrCodeUrl}
                  expiresAt={shareData.expiresAt}
                  label="Enlace de compartición"
                />
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <span className="card-title">{bp.data.documents?.length ?? 0} Documentos</span>
            </div>
            <div className="card-body">
              {(bp.data.documents?.length ?? 0) === 0 ? (
                <div className="empty-state"><p>Esta mochila no tiene documentos.</p></div>
              ) : (
                <div className="bp-detail-docs">
                  {bp.data.documents.map((doc) => (
                    <div key={doc.id} className="bp-doc-row">
                      <FileText size={16} style={{ color: "var(--gray-400)", flexShrink: 0 }} />
                      <span className="bp-doc-row-title">{doc.title}</span>
                      <span className="bp-doc-row-date">{formatDate(doc.uploadedAt)}</span>
                      <button className="icon-btn" title="Quitar" onClick={() => removeMut.mutate(doc.id)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {showAdd && (
            <AddDocsModal
              backpackId={id}
              existingIds={(bp.data.documents ?? []).map((d) => d.id)}
              onClose={() => setShowAdd(false)}
            />
          )}
        </>
      ) : null}
    </>
  );
}
