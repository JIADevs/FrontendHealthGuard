"use client";

import "../backpacks/backpacks.css";
import "../documents/documents.css";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Share2,
  Copy,
  QrCode,
  Clock,
  RefreshCw,
  ExternalLink,
  Link2,
  ChevronDown,
  ChevronUp,
  Ban,
} from "lucide-react";
import { useDocumentsQuery, useActiveDocumentSharesQuery, useRevokeDocumentShareMutation, QK } from "@helu/api/hooks";
import { shareDocument, type Document, type DocumentActiveShare } from "@helu/api";
import { formatDate, Button, Pagination, Checkbox, Typography, Spinner, Chip, EmptyState } from "@helu/ui";
import { sileo } from "sileo";

export default function SharePage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [shareResults, setShareResults] = useState<Map<string, { shareUrl: string; qrCodeUrl: string; expiresAt: string }>>(new Map());
  const [sharing, setSharing] = useState(false);
  const [activeSharesOpen, setActiveSharesOpen] = useState(false);

  const docs = useDocumentsQuery("", page, 12);
  const activeShares = useActiveDocumentSharesQuery();
  const revokeShare = useRevokeDocumentShareMutation();

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
    await queryClient.invalidateQueries({ queryKey: QK.documentSharesActive() });
  }

  function handleCopyAll() {
    const urls = Array.from(shareResults.values()).map((r) => r.shareUrl).join("\n");
    navigator.clipboard.writeText(urls);
  }

  const sharedDocs = docs.data?.items.filter((d) => shareResults.has(d.id)) ?? [];

  return (
    <>
      <ActiveSharesPanel
        query={activeShares}
        open={activeSharesOpen}
        onOpenChange={setActiveSharesOpen}
        revokeShare={revokeShare}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <Typography variant="h2">Compartir Documentos</Typography>
          <Typography variant="bodySm" color="secondary">Selecciona documentos y genera enlaces de compartición con código QR.</Typography>
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
          <Spinner size="lg" />
        </div>
      ) : (docs.data?.items.length ?? 0) === 0 ? (
        <div className="empty-state">
          <FileText />
          <Typography variant="bodySm" color="secondary">No tienes documentos para compartir.</Typography>
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
                  <Checkbox checked={selected.includes(doc.id)} />
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

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
}

function ActiveSharesPanel({
  query,
  open,
  onOpenChange,
  revokeShare,
}: {
  query: ReturnType<typeof useActiveDocumentSharesQuery>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revokeShare: ReturnType<typeof useRevokeDocumentShareMutation>;
}) {
  const items = query.data ?? [];
  const showRevokingBanner = revokeShare.isPending;
  const showListUpdatingBanner =
    query.isRefetching && !query.isLoading && !showRevokingBanner;

  const title = (
    <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <Link2 size={16} style={{ flexShrink: 0 }} />
      Enlaces activos
      {!query.isLoading && items.length > 0 && (
        <Chip label={`${items.length} activo${items.length > 1 ? "s" : ""}`} color="green" />
      )}
    </span>
  );

  if (!open) {
    return (
      <div className="card" style={{ marginBottom: 24 }}>
        <div
          className="card-body"
          style={{
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {title}
          <Button type="button" variant="secondary" size="sm" onPress={() => onOpenChange(true)}>
            Ver
            <ChevronDown size={14} style={{ marginLeft: 4 }} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        {title}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Button type="button" variant="ghost" size="sm" onPress={() => onOpenChange(false)} aria-label="Ocultar enlaces activos">
            <ChevronUp size={14} />
            Ocultar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPress={() => query.refetch()}
            disabled={query.isFetching}
            loading={query.isFetching}
          >
            <RefreshCw size={14} /> Actualizar
          </Button>
        </div>
      </div>
      <div className="card-body" style={{ paddingTop: 8 }}>
        {(showRevokingBanner || showListUpdatingBanner) && (
          <div
            role="status"
            aria-live="polite"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              marginBottom: 12,
              borderRadius: 8,
              background: "var(--gray-50)",
              border: "1px solid var(--gray-100)",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            <Spinner size="sm" />
            <span>{showRevokingBanner ? "Revocando acceso…" : "Actualizando la lista de enlaces…"}</span>
          </div>
        )}
        {query.isLoading ? (
          <div className="empty-state" style={{ padding: "24px 0" }}>
            <Spinner size="lg" />
          </div>
        ) : query.isError ? (
          <Typography variant="bodySm" color="error">No se pudieron cargar los enlaces activos.</Typography>
        ) : items.length === 0 ? (
          <EmptyState
            message="No tenés enlaces de compartir vigentes. Generá uno seleccionando documentos abajo."
            icon={<Share2 size={40} style={{ opacity: 0.35 }} />}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {items.map((row) => (
              <ActiveShareRow
                key={row.linkId}
                row={row}
                onRevoke={() => {
                  if (!window.confirm("¿Revocar este enlace? El QR y la URL dejarán de funcionar.")) return;
                  revokeShare.mutate(row.linkId, {
                    onSuccess: () => {
                      sileo.success({
                        title: "Acceso revocado",
                        description: "El enlace y el código QR ya no funcionan.",
                      });
                    },
                    onError: () => {
                      sileo.error({
                        title: "No se pudo revocar",
                        description: "Probá de nuevo en unos segundos.",
                      });
                    },
                  });
                }}
                revoking={revokeShare.isPending && revokeShare.variables === row.linkId}
                revokeBusy={revokeShare.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveShareRow({
  row,
  onRevoke,
  revoking,
  revokeBusy,
}: {
  row: DocumentActiveShare;
  onRevoke: () => void;
  revoking: boolean;
  revokeBusy: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(row.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "14px 0",
        borderBottom: "1px solid var(--gray-100)",
      }}
    >
      <img src={row.qrCodeUrl} alt="" width={56} height={56} style={{ borderRadius: 8, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{row.documentTitle}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 12, marginBottom: 6 }}>
          <Clock size={12} />
          Expira el {formatDate(row.expiresAt)}
          <span style={{ opacity: 0.5 }}>·</span>
          <span>Creado {formatDate(row.createdAt)}</span>
        </div>
        <div className="share-url" style={{ marginTop: 0 }}>
          <input readOnly value={row.shareUrl} style={{ fontSize: 12 }} />
          <Button type="button" variant="ghost" size="sm" onPress={handleCopy}>
            {copied ? "✓" : <Copy size={12} />}
          </Button>
          <a
            href={row.shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <ExternalLink size={12} /> Abrir
          </a>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onPress={onRevoke}
        disabled={revokeBusy}
        loading={revoking}
        aria-label="Revocar enlace"
        title="Revocar enlace"
      >
        <Ban size={14} />
      </Button>
    </div>
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
