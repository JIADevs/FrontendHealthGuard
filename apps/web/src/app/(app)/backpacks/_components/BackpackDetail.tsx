"use client";

import { useState } from "react";
import { useBackpackQuery } from "@helu/api/hooks";
import { useBackpackDetail } from "@/hooks/useBackpackDetail";
import { type BackpackWithDocs } from "@helu/api";
import { Backpack, FileText, X, Share2, ChevronLeft, Plus, Edit3, Clock, QrCode, Copy } from "lucide-react";
import { formatDate, Button, Typography, Spinner } from "@helu/ui";
import { AddDocsModal } from "./AddDocsModal";
import { BackpackFormModal } from "./BackpackFormModal";

interface BackpackDetailProps {
  id: string;
  onBack: () => void;
}

export function BackpackDetail({ id, onBack }: BackpackDetailProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [copied, setCopied] = useState(false);

  const bp = useBackpackQuery(id) as { data: BackpackWithDocs | undefined; isLoading: boolean };
  const detail = useBackpackDetail(id);

  function handleCopy() {
    if (!detail.shareData?.shareUrl) return;
    navigator.clipboard.writeText(detail.shareData.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button variant="ghost" onPress={onBack}>
          <ChevronLeft size={16} /> Volver a mochilas
        </Button>
      </div>

      {bp.isLoading ? (
        <div className="empty-state">
          <Spinner size="lg" />
        </div>
      ) : bp.data ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Backpack size={22} style={{ color: "var(--primary-500)", flexShrink: 0 }} />
                <Typography variant="h2">{bp.data.name}</Typography>
              </div>
              {bp.data.description && (
                <Typography variant="bodySm" color="secondary">{bp.data.description}</Typography>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" onPress={() => setShowEdit(true)}>
                <Edit3 size={16} /> Editar
              </Button>
              <Button variant="ghost" onPress={() => setShowAdd(true)}>
                <Plus size={16} /> Agregar Documentos
              </Button>
              <Button onPress={detail.shareBackpack} disabled={detail.isSharing} loading={detail.isSharing}>
                <Share2 size={16} /> Compartir Mochila
              </Button>
            </div>
          </div>

          {/* Share result panel */}
          {detail.shareData && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <span className="card-title">
                  <QrCode size={16} style={{ verticalAlign: -2, marginRight: 6 }} />
                  Enlace generado
                </span>
                <button className="icon-btn" onClick={detail.clearShareData} title="Cerrar"><X size={14} /></button>
              </div>
              <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <img src={detail.shareData.qrCodeUrl} alt="QR" width={72} height={72} style={{ borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {detail.shareData.expiresAt && (
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} /> Expira el {formatDate(detail.shareData.expiresAt)}
                    </div>
                  )}
                  <div className="share-url">
                    <input readOnly value={detail.shareData.shareUrl} style={{ fontSize: 12 }} />
                    <Button variant="ghost" size="sm" onPress={handleCopy}>
                      {copied ? "✓" : <Copy size={12} />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents list */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">{bp.data.documents?.length ?? 0} Documentos</span>
            </div>
            <div className="card-body">
              {(bp.data.documents?.length ?? 0) === 0 ? (
                <div className="empty-state"><Typography variant="bodySm" color="secondary">Esta mochila no tiene documentos.</Typography></div>
              ) : (
                <div className="bp-detail-docs">
                  {bp.data.documents.map((doc) => (
                    <div key={doc.id} className="bp-doc-row">
                      <FileText size={16} style={{ color: "var(--gray-400)", flexShrink: 0 }} />
                      <span className="bp-doc-row-title">{doc.title}</span>
                      <span className="bp-doc-row-date">{formatDate(doc.uploadedAt)}</span>
                      <button
                        className="icon-btn"
                        title="Quitar"
                        disabled={detail.removingDocId === doc.id}
                        onClick={() => detail.removeDocument(doc.id, doc.title)}
                      >
                        {detail.removingDocId === doc.id
                          ? <Spinner size="sm" />
                          : <X size={14} />}
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

          {showEdit && (
            <BackpackFormModal backpackId={id} onClose={() => setShowEdit(false)} />
          )}
        </>
      ) : null}
    </>
  );
}
