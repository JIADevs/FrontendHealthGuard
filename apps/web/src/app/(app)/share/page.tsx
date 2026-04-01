"use client";

import { useState } from "react";
import {
  FileText,
  Check,
  Share2,
  Copy,
  QrCode,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useDocumentsQuery } from "@healthguard/api/hooks";
import { shareDocument, type Document } from "@healthguard/api";
import { formatDate, Button } from "@healthguard/ui";

export default function SharePage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [shareResults, setShareResults] = useState<Map<string, { shareUrl: string; qrCodeUrl: string; expiresAt: string }>>(new Map());
  const [sharing, setSharing] = useState(false);

  const docs = useDocumentsQuery("", page, 12);

  const totalPages = docs.data?.totalPages ?? 1;

  function toggle(id: string) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  async function handleShareSelected() {
    setSharing(true);
    const results = new Map(shareResults);
    for (const docId of selected) {
      try {
        const result = await shareDocument(docId);
        results.set(docId, result);
      } catch {
        // Skip failed ones
      }
    }
    setShareResults(results);
    setSharing(false);
  }

  function handleCopyAll() {
    const urls = Array.from(shareResults.values()).map((r) => r.shareUrl).join("\n");
    navigator.clipboard.writeText(urls);
  }

  const sharedDocs = docs.data?.items.filter((d) => shareResults.has(d.id)) ?? [];

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Compartir Documentos</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Selecciona documentos y genera enlaces de compartición con código QR.
          </p>
        </div>
        {selected.length > 0 && (
          <Button onPress={handleShareSelected} disabled={sharing} loading={sharing}>
            <Share2 size={16} /> Compartir ({selected.length})
          </Button>
        )}
      </div>

      {/* Share results */}
      {shareResults.size > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">
              <QrCode size={16} style={{ verticalAlign: -2, marginRight: 6 }} />
              {shareResults.size} enlace{shareResults.size > 1 ? "s" : ""} generado{shareResults.size > 1 ? "s" : ""}
            </span>
            <Button variant="ghost" size="sm" onPress={handleCopyAll}>
              <Copy size={14} /> Copiar todos
            </Button>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sharedDocs.map((doc) => {
              const result = shareResults.get(doc.id)!;
              return (
                <ShareResultRow key={doc.id} doc={doc} result={result} />
              );
            })}
          </div>
        </div>
      )}

      {/* Document selector */}
      {docs.isLoading ? (
        <div className="empty-state">
          <div className="spinner spinner--page" style={{ margin: "0 auto", width: 32, height: 32 }} />
        </div>
      ) : (docs.data?.items.length ?? 0) === 0 ? (
        <div className="empty-state">
          <FileText />
          <p>No tienes documentos para compartir.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tus Documentos</span>
            {selected.length > 0 && (
              <span style={{ fontSize: 12, color: "var(--primary-600)", fontWeight: 600 }}>
                {selected.length} seleccionado{selected.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="doc-selector" style={{ border: "none", maxHeight: "none" }}>
              {docs.data!.items.map((doc) => (
                <div key={doc.id} className="doc-selector-item" onClick={() => toggle(doc.id)}>
                  <div className={`doc-check${selected.includes(doc.id) ? " checked" : ""}`}>
                    {selected.includes(doc.id) && <Check size={12} />}
                  </div>
                  <FileText size={14} style={{ color: "var(--gray-400)" }} />
                  <span style={{ flex: 1, fontWeight: 500 }}>{doc.title}</span>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{doc.format}</span>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{formatDate(doc.uploadedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = i + Math.max(1, page - 2);
            if (p > totalPages) return null;
            return <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>;
          })}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
        </div>
      )}
    </>
  );
}

function ShareResultRow({ doc, result }: { doc: Document; result: { shareUrl: string; qrCodeUrl: string; expiresAt: string } }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(result.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--gray-100)" }}>
      <img src={result.qrCodeUrl} alt="QR" width={60} height={60} style={{ borderRadius: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{doc.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 12 }}>
          <Clock size={12} /> Expira el {formatDate(result.expiresAt)}
        </div>
        <div className="share-url" style={{ marginTop: 6 }}>
          <input readOnly value={result.shareUrl} style={{ fontSize: 12 }} />
          <Button variant="ghost" size="sm" onPress={handleCopy}>
            {copied ? "✓" : <Copy size={12} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
