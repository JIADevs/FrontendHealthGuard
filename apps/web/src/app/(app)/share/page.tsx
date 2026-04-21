"use client";

import "../backpacks/backpacks.css";
import "../documents/documents.css";

import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Share2,
  Copy,
  Clock,
  RefreshCw,
  ExternalLink,
  Link2,
  ChevronDown,
  ChevronUp,
  Ban,
} from "lucide-react";
import { useDocumentsQuery, useActiveDocumentSharesQuery, useRevokeDocumentShareMutation, QK } from "@helu/api/hooks";
import { shareDocument, type DocumentActiveShare } from "@helu/api";
import { formatDate, Button, Pagination, Checkbox, Typography, Spinner, Chip, EmptyState, ConfirmModal } from "@helu/ui";
import { sileo } from "sileo";

type RevokeConfirm =
  | { mode: "single"; row: DocumentActiveShare }
  | { mode: "bulk"; rows: DocumentActiveShare[] };

export default function SharePage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [sharing, setSharing] = useState(false);
  const [activeSharesOpen, setActiveSharesOpen] = useState(false);

  const docs = useDocumentsQuery("", page, 12);
  const activeShares = useActiveDocumentSharesQuery();
  const revokeShare = useRevokeDocumentShareMutation();

  const totalPages = docs.data?.totalPages ?? 1;

  const documentIdsWithActiveShare = useMemo(
    () => new Set((activeShares.data ?? []).map((s) => s.documentId)),
    [activeShares.data],
  );

  useEffect(() => {
    const locked = new Set((activeShares.data ?? []).map((s) => s.documentId));
    setSelected((prev) => {
      const next = prev.filter((id) => !locked.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [activeShares.data]);

  function toggle(id: string) {
    if (documentIdsWithActiveShare.has(id)) return;
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function handleShareSelected() {
    setSharing(true);
    const items = docs.data?.items ?? [];
    const successes: { title: string; shareUrl: string }[] = [];
    let failed = 0;
    for (const docId of selected) {
      if (documentIdsWithActiveShare.has(docId)) continue;
      try {
        const result = await shareDocument(docId);
        const doc = items.find((d) => d.id === docId);
        successes.push({
          title: doc?.title ?? "Documento",
          shareUrl: result.shareUrl,
        });
      } catch {
        failed += 1;
      }
    }
    setSharing(false);

    if (successes.length === 0) {
      sileo.error({
        title: "No se pudieron generar enlaces",
        description: failed > 0 ? "Inténtalo de nuevo en unos segundos." : undefined,
      });
      return;
    }

    setSelected([]);

    if (successes.length === 1) {
      const only = successes[0];
      sileo.success({
        title: "Enlace listo",
        description: only.title,
        button: {
          title: "Copiar enlace",
          onClick: () => {
            void navigator.clipboard.writeText(only.shareUrl);
          },
        },
      });
    } else {
      const allUrls = successes.map((s) => s.shareUrl).join("\n");
      sileo.success({
        title: `${successes.length} enlaces generados`,
        description:
          failed > 0
            ? `No se pudieron compartir ${failed} documento${failed > 1 ? "s" : ""}. Los demás están listos: usa el botón de la notificación para copiar los enlaces.`
            : "Usa el botón de la notificación para copiar todos los enlaces.",
        button: {
          title: "Copiar enlaces",
          onClick: () => {
            void navigator.clipboard.writeText(allUrls);
          },
        },
      });
    }

    void queryClient.invalidateQueries({ queryKey: QK.documentSharesActive() });
  }

  return (
    <>
      <ActiveSharesPanel
        query={activeShares}
        open={activeSharesOpen}
        onOpenChange={setActiveSharesOpen}
        revokeShare={revokeShare}
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <Typography variant="h2">Compartir Documentos</Typography>
          <Typography variant="bodySm" color="secondary">
            Elige los documentos y comparte. Si hay un enlace activo, revócalo en la lista superior.
          </Typography>
        </div>
        {selected.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <Button onPress={handleShareSelected} disabled={sharing} loading={sharing}>
              <Share2 size={16} /> Compartir ({selected.length})
            </Button>
          </div>
        )}
      </div>

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
              <span style={{ fontSize: 12, color: "var(--brand-600)", fontWeight: 600 }}>
                {selected.length} seleccionado{selected.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="doc-selector" style={{ border: "none", maxHeight: "none" }}>
              {docs.data!.items.map((doc) => {
                const locked = documentIdsWithActiveShare.has(doc.id);
                return (
                <div
                  key={doc.id}
                  className="doc-selector-item"
                  onClick={() => !locked && toggle(doc.id)}
                  style={{
                    opacity: locked ? 0.65 : 1,
                    cursor: locked ? "not-allowed" : "pointer",
                  }}
                >
                  <Checkbox checked={selected.includes(doc.id)} disabled={locked} />
                  <FileText size={14} style={{ color: locked ? "var(--gray-300)" : "var(--gray-400)" }} />
                  <span style={{ flex: 1, fontWeight: 500, minWidth: 0 }}>{doc.title}</span>
                  {locked && <Chip label="Enlace activo" color="default" />}
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{doc.format}</span>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{formatDate(doc.uploadedAt)}</span>
                </div>
              );})}
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
  const queryClient = useQueryClient();
  const [revokeConfirm, setRevokeConfirm] = useState<RevokeConfirm | null>(null);
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(() => new Set());
  const [bulkRevoking, setBulkRevoking] = useState(false);
  const items = query.data ?? [];
  const panelActionBusy = revokeShare.isPending || bulkRevoking || revokeConfirm !== null;
  const showRevokingBanner = revokeShare.isPending || bulkRevoking;
  /** Refetch tras compartir/revocar: `isRefetching` a veces no basta; `isFetching && !isLoading` cubre la actualización con datos en caché. */
  const showListUpdatingBanner =
    query.isFetching && !query.isLoading && !showRevokingBanner;

  const itemLinkKey = items.map((i) => i.linkId).join("|");
  useEffect(() => {
    const valid = new Set(itemLinkKey === "" ? [] : itemLinkKey.split("|"));
    setSelectedLinkIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (valid.has(id)) next.add(id);
      }
      if (next.size === prev.size && [...prev].every((id) => next.has(id))) return prev;
      return next;
    });
  }, [itemLinkKey]);

  const allSelected = items.length > 0 && selectedLinkIds.size === items.length;
  const selectedCount = selectedLinkIds.size;

  function toggleSelectAll(nextChecked: boolean) {
    if (nextChecked) {
      setSelectedLinkIds(new Set(items.map((i) => i.linkId)));
    } else {
      setSelectedLinkIds(new Set());
    }
  }

  function toggleSelectOne(linkId: string) {
    setSelectedLinkIds((prev) => {
      const next = new Set(prev);
      if (next.has(linkId)) next.delete(linkId);
      else next.add(linkId);
      return next;
    });
  }

  const title = (
    <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <Link2 size={16} style={{ flexShrink: 0 }} />
      Enlaces activos
      {!query.isLoading && items.length > 0 && (
        <Chip label={`${items.length} activo${items.length > 1 ? "s" : ""}`} color="green" />
      )}
    </span>
  );

  return (
    <>
      {!open ? (
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                flex: 1,
                minWidth: 0,
              }}
            >
              {title}
              {(showRevokingBanner || showListUpdatingBanner) && (
                <>
                  <Spinner size="sm" />
                  <span
                    role="status"
                    aria-live="polite"
                    style={{ fontSize: 13, color: "var(--text-secondary)" }}
                  >
                    {showRevokingBanner ? "Revocando acceso…" : "Actualizando enlaces…"}
                  </span>
                </>
              )}
            </div>
            <Button type="button" variant="secondary" size="sm" onPress={() => onOpenChange(true)}>
              Ver
              <ChevronDown size={14} style={{ marginLeft: 4 }} />
            </Button>
          </div>
        </div>
      ) : (
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
            <span>{showRevokingBanner ? "Revocando acceso…" : "Actualizando enlaces…"}</span>
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
            message="No tienes enlaces de compartir activos. Genera uno seleccionando documentos abajo."
            icon={<Share2 size={40} style={{ opacity: 0.35 }} />}
          />
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: "1px solid var(--gray-100)",
              }}
            >
              <Checkbox
                checked={allSelected}
                disabled={panelActionBusy}
                onChange={toggleSelectAll}
                label="Seleccionar todos"
              />
              {selectedCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={panelActionBusy}
                    onPress={() => {
                      const rows = items.filter((r) => selectedLinkIds.has(r.linkId));
                      if (rows.length === 0) return;
                      setRevokeConfirm({ mode: "bulk", rows });
                    }}
                  >
                    Revocar selección ({selectedCount})
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={panelActionBusy}
                    onPress={() => setSelectedLinkIds(new Set())}
                  >
                    Limpiar selección
                  </Button>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {items.map((row) => (
                <ActiveShareRow
                  key={row.linkId}
                  row={row}
                  selected={selectedLinkIds.has(row.linkId)}
                  onToggleSelect={() => {
                    toggleSelectOne(row.linkId);
                  }}
                  onRequestRevoke={() => setRevokeConfirm({ mode: "single", row })}
                  revokeBusy={revokeShare.isPending || revokeConfirm !== null || bulkRevoking}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
      )}

      {revokeConfirm && (
        <ConfirmModal
          title={
            revokeConfirm.mode === "single" ||
            (revokeConfirm.mode === "bulk" && revokeConfirm.rows.length === 1)
              ? "Revocar acceso compartido"
              : "Revocar varios enlaces"
          }
          message={
            revokeConfirm.mode === "single"
              ? `¿Revocar el enlace de “${revokeConfirm.row.documentTitle}”? El QR y la URL dejarán de funcionar.`
              : revokeConfirm.rows.length === 1
                ? `¿Revocar el enlace de “${revokeConfirm.rows[0].documentTitle}”? El QR y la URL dejarán de funcionar.`
                : `¿Revocar ${revokeConfirm.rows.length} enlaces? Los códigos QR y las URL dejarán de funcionar.`
          }
          confirmLabel={
            revokeConfirm.mode === "single" ||
            (revokeConfirm.mode === "bulk" && revokeConfirm.rows.length === 1)
              ? "Revocar acceso"
              : "Revocar todos"
          }
          confirmVariant="danger"
          onConfirm={() => {
            if (revokeConfirm.mode === "single") {
              const linkId = revokeConfirm.row.linkId;
              setRevokeConfirm(null);
              revokeShare.mutate(linkId, {
                onSuccess: () => {
                  sileo.success({
                    title: "Acceso revocado",
                    description: "El enlace y el código QR ya no funcionan.",
                  });
                },
                onError: () => {
                  sileo.error({
                    title: "No se pudo revocar",
                    description: "Prueba de nuevo en unos segundos.",
                  });
                },
              });
              return;
            }

            const rows = [...revokeConfirm.rows];
            setRevokeConfirm(null);
            setSelectedLinkIds(new Set());
            const count = rows.length;
            void (async () => {
              setBulkRevoking(true);
              let ok = 0;
              let fail = 0;
              for (const row of rows) {
                try {
                  await revokeShare.mutateAsync(row.linkId);
                  ok += 1;
                } catch {
                  fail += 1;
                }
              }
              await queryClient.refetchQueries({ queryKey: QK.documentSharesActive() });
              setBulkRevoking(false);
              if (fail === 0) {
                sileo.success({
                  title: count === 1 ? "Acceso revocado" : `${ok} accesos revocados`,
                  description: "Los enlaces y códigos QR ya no funcionan.",
                });
              } else if (ok === 0) {
                sileo.error({
                  title: "No se pudo revocar",
                  description: "Prueba de nuevo en unos segundos.",
                });
              } else {
                sileo.warning({
                  title: "Revocación parcial",
                  description: `Se revocaron ${ok} de ${count} enlaces. Puedes intentar de nuevo con el resto.`,
                });
              }
            })();
          }}
          onCancel={() => setRevokeConfirm(null)}
        />
      )}
    </>
  );
}

function ActiveShareRow({
  row,
  selected,
  onToggleSelect,
  onRequestRevoke,
  revokeBusy,
}: {
  row: DocumentActiveShare;
  selected: boolean;
  onToggleSelect: () => void;
  onRequestRevoke: () => void;
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
        gap: 12,
        padding: "14px 0",
        borderBottom: "1px solid var(--gray-100)",
      }}
    >
      <div style={{ paddingTop: 2 }}>
        <Checkbox
          checked={selected}
          onChange={() => onToggleSelect()}
          disabled={revokeBusy}
        />
      </div>
      <img src={row.qrCodeUrl} alt="" width={56} height={56} style={{ borderRadius: 8, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{row.documentTitle}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 12, marginBottom: 6 }}>
          <Clock size={12} />
          Expira el {formatDate(row.expiresAt)}
          <span style={{ opacity: 0.5 }}>·</span>
          <span>Creado {formatDate(row.createdAt)}</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 4,
          }}
        >
          <Button type="button" variant="secondary" size="sm" onPress={handleCopy}>
            {copied ? "Copiado" : (
              <>
                <Copy size={12} /> Copiar enlace
              </>
            )}
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
        onPress={onRequestRevoke}
        disabled={revokeBusy}
        aria-label="Revocar enlace"
        title="Revocar enlace"
      >
        <Ban size={14} />
      </Button>
    </div>
  );
}

