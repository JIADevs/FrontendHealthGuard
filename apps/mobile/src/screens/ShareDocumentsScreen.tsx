import { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Share,
  Image,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import * as Clipboard from "expo-clipboard";
import { useQueryClient } from "@tanstack/react-query";
import { useDocumentsQuery, useActiveDocumentSharesQuery, useRevokeDocumentShareMutation, QK } from "@helu/api/hooks";
import { shareDocument, isApiError } from "@helu/api";
import { colors, palette, radii, spacing, fontSize, fontWeight, useAppTheme, formatDate, Button, Pagination, Checkbox, Typography, Spinner, EmptyState, Chip, ConfirmModal } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { FileText, Share2, Clock, Copy, Link2, ChevronDown, ChevronUp, Ban } from "lucide-react-native";
import { resolveExpoReachableUrl } from "../utils/shareLinks";

/** Line heights alineados con `Typography.native` (variantes label / caption). */
const TYPO_LABEL_LH = 20;
const TYPO_CAPTION_LH = 16;
const QR_THUMB_SIZE = 56;

/**
 * Altura total por fila de enlace activo (padding + contenido + borde superior).
 * Encaja con tokens de espaciado y tipografía; evita recortar la fila de acciones.
 */
const ACTIVE_SHARE_ROW_TOTAL =
  spacing[3] +
  Math.max(
    QR_THUMB_SIZE,
    2 * TYPO_LABEL_LH +
      TYPO_CAPTION_LH +
      spacing[2] +
      (spacing[2] * 2 + fontSize.sm + 12),
  ) +
  1;

const ACTIVE_SHARES_PANEL_BUDGET_MAX = 460;
const ACTIVE_SHARES_VISIBLE_ROWS_MAX = 4;

type RevokeModalState =
  | { mode: "single"; linkId: string; title: string }
  | { mode: "bulk"; rows: { linkId: string; documentTitle: string }[] };

export function ShareDocumentsScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { height: windowHeight } = useWindowDimensions();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [sharing, setSharing] = useState(false);
  const [activeSharesOpen, setActiveSharesOpen] = useState(false);
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(() => new Set());
  const [bulkRevoking, setBulkRevoking] = useState(false);
  const [revokeModal, setRevokeModal] = useState<RevokeModalState | null>(null);

  const docs = useDocumentsQuery("", page, 12);
  const activeShares = useActiveDocumentSharesQuery();
  const revokeShare = useRevokeDocumentShareMutation();

  const totalPages = docs.data?.totalPages ?? 1;

  const documentIdsWithActiveShare = useMemo(
    () => new Set((activeShares.data ?? []).map((s) => s.documentId)),
    [activeShares.data],
  );

  const itemLinkKey = useMemo(
    () => (activeShares.data ?? []).map((i) => i.linkId).join("|"),
    [activeShares.data],
  );

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

  useEffect(() => {
    const locked = new Set((activeShares.data ?? []).map((s) => s.documentId));
    setSelected((prev) => {
      const next = prev.filter((id) => !locked.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [activeShares.data]);

  const toggle = useCallback(
    (id: string) => {
      if (documentIdsWithActiveShare.has(id)) return;
      setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    },
    [documentIdsWithActiveShare],
  );

  const handleShare = useCallback(async () => {
    if (selected.length === 0) return;
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
      } catch (err) {
        failed += 1;
        Toast.show({
          type: "error",
          text1: "Error al compartir",
          text2: isApiError(err) ? err.message : "Un documento no pudo compartirse",
        });
      }
    }

    setSharing(false);

    if (successes.length === 0) {
      if (failed > 0) {
        Toast.show({
          type: "error",
          text1: "No se pudieron generar enlaces",
          text2: "Inténtalo de nuevo en unos segundos.",
        });
      }
      void queryClient.invalidateQueries({ queryKey: QK.documentSharesActive() });
      return;
    }

    setSelected([]);

    try {
      if (successes.length === 1) {
        await Clipboard.setStringAsync(resolveExpoReachableUrl(successes[0].shareUrl));
        Toast.show({
          type: "success",
          text1: "Enlace listo",
          text2: successes[0].title,
        });
      } else {
        const all = successes.map((s) => resolveExpoReachableUrl(s.shareUrl)).join("\n");
        await Clipboard.setStringAsync(all);
        Toast.show({
          type: "success",
          text1: `${successes.length} enlaces generados`,
          text2:
            failed > 0
              ? `No se pudieron compartir ${failed} documento(s). Los demás están en el portapapeles.`
              : "Los enlaces están en el portapapeles (uno por línea).",
        });
      }
    } catch {
      Toast.show({
        type: "success",
        text1: successes.length === 1 ? "Enlace listo" : `${successes.length} enlaces generados`,
        text2: "Copia el enlace desde Enlaces activos.",
      });
    }

    void queryClient.invalidateQueries({ queryKey: QK.documentSharesActive() });
  }, [selected, queryClient, documentIdsWithActiveShare, docs.data?.items]);

  const handleCopyLink = useCallback(async (url: string) => {
    try {
      await Clipboard.setStringAsync(resolveExpoReachableUrl(url));
      Toast.show({ type: "success", text1: "Copiado", text2: "El enlace quedó en el portapapeles." });
    } catch {
      Toast.show({ type: "error", text1: "No se pudo copiar", text2: "Prueba de nuevo." });
    }
  }, []);

  const handleSystemShare = useCallback((url: string, title: string) => {
    const resolved = resolveExpoReachableUrl(url);
    Share.share({
      url: resolved,
      message: `Documento «${title}». Enlace: ${resolved}`,
    });
  }, []);

  const toggleSelectOne = useCallback((linkId: string) => {
    setSelectedLinkIds((prev) => {
      const next = new Set(prev);
      if (next.has(linkId)) next.delete(linkId);
      else next.add(linkId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(
    (nextChecked: boolean) => {
      const rows = activeShares.data ?? [];
      if (nextChecked) {
        setSelectedLinkIds(new Set(rows.map((r) => r.linkId)));
      } else {
        setSelectedLinkIds(new Set());
      }
    },
    [activeShares.data],
  );

  const promptRevokeSelection = useCallback(() => {
    const rows = (activeShares.data ?? [])
      .filter((r) => selectedLinkIds.has(r.linkId))
      .map((r) => ({ linkId: r.linkId, documentTitle: r.documentTitle }));
    if (rows.length === 0) return;
    setRevokeModal({ mode: "bulk", rows });
  }, [activeShares.data, selectedLinkIds]);

  const confirmRevokeSingle = useCallback((linkId: string, title: string) => {
    setRevokeModal({ mode: "single", linkId, title });
  }, []);

  const handleRevokeModalConfirm = useCallback(() => {
    if (!revokeModal) return;
    if (revokeModal.mode === "single") {
      const { linkId } = revokeModal;
      revokeShare.mutate(linkId, {
        onSuccess: () => {
          Toast.show({
            type: "success",
            text1: "Acceso revocado",
            text2: "El enlace y el QR ya no funcionan.",
          });
          setRevokeModal(null);
        },
        onError: (err: unknown) => {
          Toast.show({
            type: "error",
            text1: "No se pudo revocar",
            text2: isApiError(err) ? err.message : "Prueba de nuevo.",
          });
          setRevokeModal(null);
        },
      });
      return;
    }

    const rows = [...revokeModal.rows];
    const count = rows.length;
    setSelectedLinkIds(new Set());
    setBulkRevoking(true);
    void (async () => {
      let ok = 0;
      let fail = 0;
      try {
        for (const row of rows) {
          try {
            await revokeShare.mutateAsync(row.linkId);
            ok += 1;
          } catch {
            fail += 1;
          }
        }
        await queryClient.refetchQueries({ queryKey: QK.documentSharesActive() });
        if (fail === 0) {
          Toast.show({
            type: "success",
            text1: count === 1 ? "Acceso revocado" : `${ok} accesos revocados`,
            text2: "Los enlaces y códigos QR ya no funcionan.",
          });
        } else if (ok === 0) {
          Toast.show({
            type: "error",
            text1: "No se pudo revocar",
            text2: "Prueba de nuevo en unos segundos.",
          });
        } else {
          Toast.show({
            type: "warning",
            text1: "Revocación parcial",
            text2: `Se revocaron ${ok} de ${count} enlaces. Puedes intentar de nuevo con el resto.`,
          });
        }
      } finally {
        setBulkRevoking(false);
        setRevokeModal(null);
      }
    })();
  }, [revokeModal, revokeShare, queryClient]);

  const items = docs.data?.items ?? [];
  const activeShareRows = activeShares.data ?? [];
  const allLinkRowsSelected = activeShareRows.length > 0 && selectedLinkIds.size === activeShareRows.length;
  const selectedLinkCount = selectedLinkIds.size;
  const panelActionBusy = revokeShare.isPending || bulkRevoking;
  const showRevokingBanner = panelActionBusy;
  const showListUpdatingBanner =
    activeShares.isFetching && !activeShares.isLoading && !showRevokingBanner;

  const activeSharesLayout = useMemo(() => {
    const row = ACTIVE_SHARE_ROW_TOTAL;
    const panelBudget = Math.min(Math.round(windowHeight * 0.52), ACTIVE_SHARES_PANEL_BUDGET_MAX);
    const statusBannerH =
      showRevokingBanner || showListUpdatingBanner
        ? spacing[2] * 2 + spacing[3] + TYPO_CAPTION_LH + spacing[2]
        : 0;
    /** Cabecera + relleno tarjeta + huecos + barra masiva + banner opcional (sin lista). */
    const chrome =
      spacing[4] * 2 +
      spacing[3] +
      Math.round(TYPO_LABEL_LH * 2.2 + spacing[4]) +
      (statusBannerH > 0 ? spacing[3] + statusBannerH : 0) +
      spacing[3] +
      spacing[2] * 2 +
      TYPO_LABEL_LH +
      spacing[2];

    const rawN = Math.floor((panelBudget - chrome) / row);
    let visibleRows = Math.min(ACTIVE_SHARES_VISIBLE_ROWS_MAX, Math.max(1, rawN));
    while (visibleRows > 1 && chrome + visibleRows * row > panelBudget) {
      visibleRows -= 1;
    }
    while (
      visibleRows < ACTIVE_SHARES_VISIBLE_ROWS_MAX &&
      chrome + (visibleRows + 1) * row <= panelBudget
    ) {
      visibleRows += 1;
    }
    const listViewportHeight = visibleRows * row;
    const panelMaxHeight = Math.min(panelBudget, chrome + listViewportHeight);
    return { listViewportHeight, panelMaxHeight };
  }, [windowHeight, showRevokingBanner, showListUpdatingBanner]);

  const revokeModalLoading =
    (revokeModal?.mode === "single" && revokeShare.isPending) ||
    (revokeModal?.mode === "bulk" && bulkRevoking);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.screenBody}>
        <View style={styles.topBar}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="bodySm" color="secondary">
              Elige los documentos y comparte. Si hay un enlace activo, revócalo en la lista superior.
            </Typography>
          </View>
          {selected.length > 0 && (
            <Button onPress={handleShare} disabled={sharing} loading={sharing}>
              <View style={styles.btnRow}>
                <Share2 size={16} color={colors.white} />
                <Text style={styles.btnLabelPrimary}>Compartir ({selected.length})</Text>
              </View>
            </Button>
          )}
        </View>

        <View style={styles.activeSharesOuter}>
          {!activeSharesOpen ? (
            <View style={styles.activeSharesCollapsed}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2], flex: 1, flexWrap: "wrap" }}>
                <Link2 size={16} color={palette.brand[500]} />
                <Typography variant="label">Enlaces activos</Typography>
                {!activeShares.isLoading && activeShareRows.length > 0 && (
                  <Chip label={`${activeShareRows.length} activo${activeShareRows.length > 1 ? "s" : ""}`} color="green" />
                )}
                {(showRevokingBanner || showListUpdatingBanner) && (
                  <>
                    <Spinner size="sm" />
                    <Typography variant="caption" color="secondary" accessibilityLiveRegion="polite">
                      {showRevokingBanner ? "Revocando acceso…" : "Actualizando enlaces…"}
                    </Typography>
                  </>
                )}
              </View>
              <Button variant="secondary" size="sm" onPress={() => setActiveSharesOpen(true)}>
                <Text style={styles.activeSharesBtnText}>Ver</Text>
                <ChevronDown size={14} color={palette.brand[500]} />
              </Button>
            </View>
          ) : (
            <View style={[styles.activeSharesCard, { maxHeight: activeSharesLayout.panelMaxHeight }]}>
              <View style={styles.activeSharesHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2], flex: 1, flexWrap: "wrap" }}>
                  <Link2 size={16} color={palette.brand[500]} />
                  <Typography variant="label">Enlaces activos</Typography>
                  {!activeShares.isLoading && activeShareRows.length > 0 && (
                    <Chip label={`${activeShareRows.length} activo${activeShareRows.length > 1 ? "s" : ""}`} color="green" />
                  )}
                </View>
                <View style={{ flexDirection: "row", gap: spacing[2] }}>
                  <Button variant="ghost" size="sm" onPress={() => setActiveSharesOpen(false)}>
                    <ChevronUp size={14} color={palette.brand[500]} />
                    <Text style={styles.activeSharesBtnText}>Ocultar</Text>
                  </Button>
                  <Button variant="ghost" size="sm" onPress={() => activeShares.refetch()} disabled={activeShares.isFetching} loading={activeShares.isFetching}>
                    <Text style={styles.activeSharesBtnText}>Actualizar</Text>
                  </Button>
                </View>
              </View>
              {(showRevokingBanner || showListUpdatingBanner) && (
                <View style={styles.activeSharesStatusBanner} accessibilityRole="text" accessibilityLiveRegion="polite">
                  <Spinner size="sm" />
                  <View style={{ flex: 1 }}>
                    <Typography variant="caption" color="secondary">
                      {showRevokingBanner ? "Revocando acceso…" : "Actualizando enlaces…"}
                    </Typography>
                  </View>
                </View>
              )}
              {activeShares.isLoading ? (
                <View style={styles.center}>
                  <Spinner size="lg" />
                </View>
              ) : activeShares.isError ? (
                <Typography variant="caption" color="error">No se pudieron cargar los enlaces activos.</Typography>
              ) : activeShareRows.length === 0 ? (
                <EmptyState
                  icon={<Share2 size={40} color={t.border.medium} />}
                  message="No tienes enlaces activos. Genera uno seleccionando documentos abajo."
                />
              ) : (
                <View style={styles.activeSharesListSection}>
                  <View style={styles.activeSharesBulkBar}>
                    <View style={styles.activeSharesBulkLeft}>
                      <Checkbox
                        checked={allLinkRowsSelected}
                        disabled={panelActionBusy}
                        onChange={toggleSelectAll}
                        label="Seleccionar todos"
                      />
                      {selectedLinkCount > 0 ? (
                        <Button variant="ghost" size="sm" onPress={() => setSelectedLinkIds(new Set())} disabled={panelActionBusy}>
                          <Text style={styles.activeSharesBtnText}>Limpiar</Text>
                        </Button>
                      ) : null}
                    </View>
                    {selectedLinkCount > 0 ? (
                      <Button variant="danger" size="sm" onPress={promptRevokeSelection} disabled={panelActionBusy}>
                        <Text style={styles.bulkRevokeBtnText}>Revocar acceso</Text>
                      </Button>
                    ) : null}
                  </View>
                  <ScrollView
                    style={{ height: activeSharesLayout.listViewportHeight }}
                    contentContainerStyle={styles.activeSharesScrollContent}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator
                  >
                    {activeShareRows.map((row) => (
                      <View key={row.linkId} style={styles.activeShareRow}>
                        <View style={styles.activeShareCheck}>
                          <Checkbox
                            checked={selectedLinkIds.has(row.linkId)}
                            onChange={() => toggleSelectOne(row.linkId)}
                            disabled={panelActionBusy}
                          />
                        </View>
                        <Image source={{ uri: row.qrCodeUrl }} style={styles.qrThumb} />
                        <View style={styles.activeShareInfo}>
                          <Typography variant="label" numberOfLines={2}>{row.documentTitle}</Typography>
                          <View style={styles.resultMeta}>
                            <Clock size={12} color={t.text.secondary} />
                            <Typography variant="caption" color="secondary">Expira {formatDate(row.expiresAt)}</Typography>
                          </View>
                          <View style={styles.resultActions}>
                            <Button variant="secondary" size="sm" onPress={() => handleCopyLink(row.shareUrl)} disabled={panelActionBusy}>
                              <View style={styles.btnRowSm}>
                                <Copy size={13} color={palette.brand[500]} />
                                <Text style={styles.btnLabelSecondary}>Copiar</Text>
                              </View>
                            </Button>
                            <Button variant="secondary" size="sm" onPress={() => handleSystemShare(row.shareUrl, row.documentTitle)} disabled={panelActionBusy}>
                              <View style={styles.btnRowSm}>
                                <Share2 size={13} color={palette.brand[500]} />
                                <Text style={styles.btnLabelSecondary}>Compartir</Text>
                              </View>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onPress={() => confirmRevokeSingle(row.linkId, row.documentTitle)}
                              disabled={panelActionBusy}
                              loading={revokeShare.isPending && !bulkRevoking && revokeShare.variables === row.linkId}
                            >
                              <Ban size={14} color={colors.error[600]} />
                            </Button>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </View>

        <FlatList
          style={styles.documentsList}
          data={items}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={docs.isRefetching}
              onRefresh={() => docs.refetch()}
              tintColor={palette.brand[500]}
            />
          }
          ListEmptyComponent={
            docs.isLoading ? (
              <View style={styles.center}>
                <Spinner size="lg" />
              </View>
            ) : (
              <EmptyState
                icon={<FileText size={48} color={t.border.medium} />}
                message="No tienes documentos para compartir."
              />
            )
          }
          ListFooterComponent={
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          }
          renderItem={({ item: doc }) => {
            const isSelected = selected.includes(doc.id);
            const hasActiveLink = documentIdsWithActiveShare.has(doc.id);
            return (
              <TouchableOpacity
                style={[
                  styles.docItem,
                  isSelected && styles.docItemSelected,
                  hasActiveLink && styles.docItemLocked,
                ]}
                onPress={() => !hasActiveLink && toggle(doc.id)}
                activeOpacity={hasActiveLink ? 1 : 0.7}
                disabled={hasActiveLink}
              >
                <Checkbox checked={isSelected} disabled={hasActiveLink} />
                <FileText
                  size={16}
                  color={t.text.secondary}
                  style={hasActiveLink ? { opacity: 0.5 } : undefined}
                />
                <View style={styles.docInfo}>
                  <Typography variant="label" numberOfLines={1}>{doc.title}</Typography>
                  <Typography variant="caption" color="secondary">{doc.format} · {formatDate(doc.uploadedAt)}</Typography>
                </View>
                {hasActiveLink ? (
                  <View style={styles.lockedBadge}>
                    <Text style={styles.lockedBadgeText}>Enlace activo</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {revokeModal ? (
        <ConfirmModal
          title={
            revokeModal.mode === "bulk" && revokeModal.rows.length > 1
              ? "Revocar varios enlaces"
              : "Revocar enlace"
          }
          message={
            revokeModal.mode === "single"
              ? `¿Quieres dejar de compartir «${revokeModal.title}»? El código QR y el enlace dejarán de funcionar.`
              : revokeModal.rows.length === 1
                ? `¿Quieres dejar de compartir «${revokeModal.rows[0].documentTitle}»? El código QR y el enlace dejarán de funcionar.`
                : `¿Revocar ${revokeModal.rows.length} enlaces? Los códigos QR y las URL dejarán de funcionar.`
          }
          confirmLabel={
            revokeModal.mode === "single" || (revokeModal.mode === "bulk" && revokeModal.rows.length === 1)
              ? "Revocar acceso"
              : "Revocar todos"
          }
          confirmVariant="danger"
          loading={revokeModalLoading}
          onConfirm={handleRevokeModalConfirm}
          onCancel={() => setRevokeModal(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:        { flex: 1, backgroundColor: t.surface.bg },
    /** Columna principal: permite que el FlatList encoja y no se superponga al panel superior. */
    screenBody:       { flex: 1, minHeight: 0 },
    topBar:           { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing[3], paddingHorizontal: spacing[5], paddingTop: spacing[3], paddingBottom: spacing[4], backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium },
    activeSharesOuter: { paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[2], flexShrink: 0 },
    activeSharesCollapsed: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[3], padding: spacing[4], backgroundColor: t.surface.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: t.border.medium },
    activeSharesCard: {
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.medium,
      padding: spacing[4],
      gap: spacing[3],
      overflow: "hidden",
      flexDirection: "column",
      flexShrink: 0,
    },
    activeSharesHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing[2] },
    activeSharesStatusBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[3],
      backgroundColor: t.surface.bg,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: t.border.light,
    },
    /** Sin hueco extra respecto al `ScrollView` de filas (el `gap` de la tarjeta ya separa cabecera). */
    activeSharesListSection: {
      gap: 0,
    },
    activeSharesBulkBar: {
      flexDirection: "row",
      flexWrap: "nowrap",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing[3],
      marginBottom: 0,
      paddingBottom: spacing[2],
      borderBottomWidth: 1,
      borderBottomColor: t.border.light,
    },
    activeSharesBulkLeft: {
      flex: 1,
      minWidth: 0,
      alignItems: "flex-start",
      gap: spacing[1],
    },
    activeSharesScrollContent: {
      paddingBottom: spacing[2],
    },
    bulkRevokeBtnText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
    activeShareRow:   {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing[2],
      paddingTop: spacing[3],
      borderTopWidth: 1,
      borderTopColor: t.border.light,
      minHeight: ACTIVE_SHARE_ROW_TOTAL,
    },
    activeShareCheck: { paddingTop: 2 },
    activeShareInfo:  { flex: 1, minWidth: 0 },
    title:            { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: t.text.primary },
    subtitle:         { fontSize: fontSize.sm, color: t.text.secondary, marginTop: 2, maxWidth: 200 },
    documentsList:  { flex: 1, flexShrink: 1, minHeight: 0 },
    list:             { padding: spacing[4], gap: spacing[2], paddingBottom: spacing[8] },
    center:           { alignItems: "center", justifyContent: "center", gap: spacing[3], paddingVertical: spacing[10] },
    emptyText:        { color: t.text.secondary, fontSize: fontSize.md, textAlign: "center" },

    qrThumb:          { width: QR_THUMB_SIZE, height: QR_THUMB_SIZE, borderRadius: radii.sm, flexShrink: 0 },
    resultMeta:       { flexDirection: "row", alignItems: "center", gap: spacing[1] },
    resultActions:    { flexDirection: "row", gap: spacing[2], marginTop: spacing[2] },

    btnRow:           { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    btnRowSm:         { flexDirection: "row", alignItems: "center", gap: spacing[1] },
    btnLabelPrimary:  { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
    btnLabelSecondary: { color: colors.gray[700], fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

    // doc list
    docItem:          { flexDirection: "row", alignItems: "center", gap: spacing[3], padding: spacing[4], backgroundColor: t.surface.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: t.border.medium },
    docItemSelected:  {
      borderColor: palette.brand[400],
      backgroundColor: t.mode === "dark" ? colors.slate[700] : palette.brand[50],
    },
    docItemLocked:    { opacity: 0.75 },
    docInfo:          { flex: 1 },
    docTitle:         { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: t.text.primary },
    docMeta:          { fontSize: fontSize.xs, color: t.text.secondary, marginTop: 2 },
    lockedBadge:      { paddingHorizontal: spacing[2], paddingVertical: 3, backgroundColor: t.surface.bg, borderRadius: radii.full, borderWidth: 1, borderColor: t.border.medium },
    lockedBadgeText:  { fontSize: fontSize.xs, color: t.text.secondary, fontWeight: fontWeight.semibold },
    activeSharesBtnText: { fontSize: fontSize.xs, color: palette.brand[600], fontWeight: fontWeight.semibold },

  });
}
