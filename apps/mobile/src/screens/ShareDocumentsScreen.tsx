import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import * as Clipboard from "expo-clipboard";
import { useDocumentsQuery } from "@helu/api/hooks";
import { shareDocument, isApiError, type Document } from "@helu/api";
import { colors, palette, radii, spacing, fontSize, fontWeight, useAppTheme, formatDate, Button, Pagination, Checkbox, Typography, Spinner, EmptyState } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { FileText, Share2, Clock, Copy } from "lucide-react-native";
import { qrCodeImageUriForShareUrl, resolveExpoReachableUrl } from "../utils/shareLinks";

type ShareResult = { shareUrl: string; qrCodeUrl: string; expiresAt: string };

export function ShareDocumentsScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [shareResults, setShareResults] = useState<Map<string, ShareResult>>(new Map());
  const [sharing, setSharing] = useState(false);

  const docs = useDocumentsQuery("", page, 12);

  const totalPages = docs.data?.totalPages ?? 1;

  const toggle = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleShare = useCallback(async () => {
    if (selected.length === 0) return;
    setSharing(true);
    const updates = new Map<string, ShareResult>();
    let errorCount = 0;

    for (const docId of selected) {
      try {
        updates.set(docId, await shareDocument(docId));
      } catch (err) {
        errorCount += 1;
        Toast.show({
          type: "error",
          text1: "Error al compartir",
          text2: isApiError(err) ? err.message : "Un documento no pudo compartirse",
        });
      }
    }

    setShareResults((prev) => {
      const next = new Map(prev);
      updates.forEach((value, key) => next.set(key, value));
      return next;
    });
    setSharing(false);

    const ok = selected.length - errorCount;
    if (ok > 0) {
      Toast.show({
        type: "success",
        text1: ok === 1 ? "Enlace generado" : `${ok} enlaces generados`,
        text2: "Podés copiar o compartir cada enlace abajo.",
      });
    }
  }, [selected]);

  const handleCopyLink = useCallback(async (url: string) => {
    try {
      await Clipboard.setStringAsync(resolveExpoReachableUrl(url));
      Toast.show({ type: "success", text1: "Copiado", text2: "El enlace quedó en el portapapeles." });
    } catch {
      Toast.show({ type: "error", text1: "No se pudo copiar", text2: "Probá de nuevo." });
    }
  }, []);

  const handleCopyAll = useCallback(async () => {
    const urls = Array.from(shareResults.values())
      .map((r) => resolveExpoReachableUrl(r.shareUrl))
      .join("\n");
    if (!urls) return;
    try {
      await Clipboard.setStringAsync(urls);
      Toast.show({ type: "success", text1: "Copiados", text2: `${shareResults.size} enlace(s) en el portapapeles.` });
    } catch {
      Toast.show({ type: "error", text1: "No se pudo copiar" });
    }
  }, [shareResults]);

  const handleSystemShare = useCallback((url: string, title: string) => {
    const resolved = resolveExpoReachableUrl(url);
    Share.share({
      url: resolved,
      message: `Comparto el documento "${title}": ${resolved}`,
    });
  }, []);

  const items = docs.data?.items ?? [];
  const sharedDocs = items.filter((d) => shareResults.has(d.id));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Typography variant="bodySm" color="secondary">
            Seleccioná documentos y generá enlaces con código QR para compartirlos.
          </Typography>
        </View>
        {selected.length > 0 && (
          <Button onPress={handleShare} disabled={sharing} loading={sharing}>
            <Share2 size={16} color={colors.white} /> Compartir ({selected.length})
          </Button>
        )}
      </View>

      <FlatList
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
        ListHeaderComponent={
          sharedDocs.length > 0 ? (
            <View style={styles.resultsCard}>
              <View style={styles.resultsHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2], flex: 1 }}>
                  <Share2 size={16} color={palette.brand[500]} />
                  <Typography variant="label">
                    {shareResults.size} enlace{shareResults.size > 1 ? "s" : ""} generado{shareResults.size > 1 ? "s" : ""}
                  </Typography>
                </View>
                <Button variant="ghost" size="sm" onPress={handleCopyAll}>
                  <Copy size={14} color={palette.brand[500]} /> Copiar todos
                </Button>
              </View>
              {sharedDocs.map((doc) => {
                const res = shareResults.get(doc.id)!;
                return (
                  <View key={doc.id} style={styles.resultRow}>
                    <Image
                      source={{ uri: qrCodeImageUriForShareUrl(res.shareUrl) }}
                      style={styles.qrThumb}
                    />
                    <View style={styles.resultInfo}>
                      <Typography variant="label" numberOfLines={1}>{doc.title}</Typography>
                      <View style={styles.resultMeta}>
                        <Clock size={12} color={t.text.secondary} />
                        <Typography variant="caption" color="secondary">Expira {formatDate(res.expiresAt)}</Typography>
                      </View>
                      <View style={styles.resultActions}>
                        <Button variant="secondary" size="sm" onPress={() => handleCopyLink(res.shareUrl)}>
                          <Copy size={13} color={palette.brand[500]} /> Copiar
                        </Button>
                        <Button variant="secondary" size="sm" onPress={() => handleSystemShare(res.shareUrl, doc.title)}>
                          <Share2 size={13} color={palette.brand[500]} /> Compartir
                        </Button>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null
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
          const isShared = shareResults.has(doc.id);
          return (
            <TouchableOpacity
              style={[styles.docItem, isSelected && styles.docItemSelected]}
              onPress={() => toggle(doc.id)}
              activeOpacity={0.7}
            >
              <Checkbox checked={isSelected} />
              <FileText size={16} color={isShared ? colors.emerald[500] : t.text.secondary} />
              <View style={styles.docInfo}>
                <Typography variant="label" numberOfLines={1}>{doc.title}</Typography>
                <Typography variant="caption" color="secondary">{doc.format} · {formatDate(doc.uploadedAt)}</Typography>
              </View>
              {isShared && (
                <View style={styles.sharedBadge}>
                  <Text style={styles.sharedBadgeText}>Compartido</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:        { flex: 1, backgroundColor: t.surface.bg },
    topBar:           { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing[3], padding: spacing[5], backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium },
    title:            { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: t.text.primary },
    subtitle:         { fontSize: fontSize.sm, color: t.text.secondary, marginTop: 2, maxWidth: 200 },
    list:             { padding: spacing[4], gap: spacing[2], paddingBottom: spacing[8] },
    center:           { alignItems: "center", justifyContent: "center", gap: spacing[3], paddingVertical: spacing[10] },
    emptyText:        { color: t.text.secondary, fontSize: fontSize.md, textAlign: "center" },

    // results card
    resultsCard:      { backgroundColor: t.surface.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: t.border.medium, padding: spacing[4], marginBottom: spacing[3], gap: spacing[3] },
    resultsHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[2] },
    resultsTitle:     { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: t.text.primary },
    resultRow:        { flexDirection: "row", gap: spacing[3], paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: t.border.light },
    qrThumb:          { width: 56, height: 56, borderRadius: radii.sm, flexShrink: 0 },
    resultInfo:       { flex: 1 },
    resultTitle:      { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: t.text.primary, marginBottom: 2 },
    resultMeta:       { flexDirection: "row", alignItems: "center", gap: spacing[1] },
    resultMetaText:   { fontSize: fontSize.xs, color: t.text.secondary },
    resultActions:    { flexDirection: "row", gap: spacing[2], marginTop: spacing[2] },

    // doc list
    docItem:          { flexDirection: "row", alignItems: "center", gap: spacing[3], padding: spacing[4], backgroundColor: t.surface.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: t.border.medium },
    docItemSelected:  { borderColor: palette.brand[400], backgroundColor: palette.brand[50] },
    docInfo:          { flex: 1 },
    docTitle:         { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: t.text.primary },
    docMeta:          { fontSize: fontSize.xs, color: t.text.secondary, marginTop: 2 },
    sharedBadge:      { paddingHorizontal: spacing[2], paddingVertical: 3, backgroundColor: colors.emerald[50], borderRadius: radii.full, borderWidth: 1, borderColor: colors.emerald[200] },
    sharedBadgeText:  { fontSize: fontSize.xs, color: colors.emerald[700], fontWeight: fontWeight.semibold },

  });
}
