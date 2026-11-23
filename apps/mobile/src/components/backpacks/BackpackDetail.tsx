import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Backpack as BackpackIcon, Clock, FileText, Pencil, Plus, QrCode, Share2, Trash2 } from "lucide-react-native";
import { useBackpackQuery, useInfiniteBackpackDocuments, useShareHistoryQuery } from "@helu/api/hooks";
import type { Backpack, Document } from "@helu/api";
import {
  Button,
  Chip,
  DangerLink,
  IconButton,
  IconTile,
  PullRefreshIndicator,
  Skeleton,
  SkeletonGroup,
  motion,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  usePullRefresh,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { isDocPendingRemoval, useBackpackDeleteWithUndo, useBackpackDocRemoveWithUndo } from "../../hooks/useBackpackUndo";
import { BackpackDeleteConfirm } from "./BackpackDeleteConfirm";
import { BackpackDocumentLine } from "./BackpackDocumentLine";
import { documentCountLabel } from "./backpackCopy";

export interface BackpackDetailProps {
  id: string;
  onClose: () => void;
  onEdit: () => void;
  onAddDocuments: () => void;
  onShare: (backpack: Backpack, documentCount: number) => void;
  onOpenDocument: (doc: Document) => void;
}

/** Wait for the detail to slide away before the card collapses in the list (§3 + §5). */
const AFTER_BACK_MS = 380;

/**
 * Mockup «Detalle de mochila» (m5) and m9 «Mochila · sin documentos»: header card, «Compartir
 * mochila» (only when there is something to share), «Contenido» with «+ Agregar» and a 44 px «×»
 * per document, and «Eliminar mochila» alone at the end.
 */
export function BackpackDetail({ id, onClose, onEdit, onAddDocuments, onShare, onOpenDocument }: BackpackDetailProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const backpackQuery = useBackpackQuery(id);
  const docsQuery = useInfiniteBackpackDocuments(id);
  const removeWithUndo = useBackpackDocRemoveWithUndo(id);
  const deleteWithUndo = useBackpackDeleteWithUndo();
  // Phase 11: «Compartida N veces» counts the links made for this backpack (revoked ones are gone).
  const shares = useShareHistoryQuery();
  const timesShared = (shares.data ?? []).filter((l) => l.resourceType === "backpack" && l.resourceId === id).length;
  const [confirmDelete, setConfirmDelete] = useState(false);

  // The detail shows every document: load the remaining pages behind the first one.
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = docsQuery;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const docs = useMemo(
    () => (docsQuery.data?.pages.flatMap((p) => p.items) ?? []).filter((d) => !isDocPendingRemoval(id, d.id)),
    [docsQuery.data, id],
  );

  const backpack = backpackQuery.data;
  const loading = backpackQuery.isLoading || docsQuery.isLoading;
  const showSkeleton = useSkeletonVisible(loading);
  const pull = usePullRefresh(
    () => Promise.all([backpackQuery.refetch(), docsQuery.refetch()]),
    Math.max(backpackQuery.dataUpdatedAt, docsQuery.dataUpdatedAt) || undefined,
  );

  const header = (
    <ScreenHeader
      title="Mochila"
      right={
        backpack ? (
          <IconButton
            icon={<Pencil size={17} strokeWidth={2.2} color={t.text.secondary} />}
            accessibilityLabel="Editar mochila"
            onPress={onEdit}
          />
        ) : undefined
      }
    />
  );

  if (showSkeleton || (loading && !backpack)) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        {header}
        {/* §6c: the back bar is real; header card, «Compartir mochila» and the content are skeleton. */}
        <SkeletonGroup label="Cargando la mochila" style={styles.content}>
          <View style={styles.card}>
            <View style={styles.headRow}>
              <Skeleton width={52} height={52} radius={16} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="60%" height={18} />
                <Skeleton width="80%" height={13} />
              </View>
            </View>
            <Skeleton width={120} height={26} radius={13} />
          </View>
          <Skeleton height={72} radius={18} />
          <View style={styles.card}>
            <Skeleton width={90} height={16} />
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.lineSkeleton}>
                <Skeleton width={40} height={40} radius={13} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="65%" height={14} />
                  <Skeleton width="40%" height={12} />
                </View>
              </View>
            ))}
          </View>
        </SkeletonGroup>
      </SafeAreaView>
    );
  }

  if (!backpack) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        {header}
        <View style={styles.centered}>
          <Text style={styles.h3}>No encontramos esta mochila</Text>
          <Text style={[styles.sub, { textAlign: "center" }]}>Puede que la hayas eliminado. Revisa tu conexión si crees que es un error.</Text>
          <Button variant="secondary" onPress={onClose}>
            Volver
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const count = docs.length;
  const temporary = backpack.type === "TEMPORARY_SHARE";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {header}
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={pull.refreshControl}
          onScroll={pull.onScroll}
          scrollEventThrottle={16}
        >
          <Animated.View entering={FadeIn.duration(motion.fast)} style={styles.card}>
            <View style={styles.headRow}>
              <IconTile tone="backpack" size="lg" icon={<BackpackIcon size={24} strokeWidth={2.2} color={t.accent.backpackFg} />} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.h2} accessibilityRole="header">
                  {backpack.name}
                </Text>
                {backpack.description ? <Text style={styles.sub}>{backpack.description}</Text> : null}
              </View>
            </View>
            <View style={styles.chips}>
              <Chip label={documentCountLabel(count)} tone="neutral" icon={<FileText size={12} color={t.text.onMuted} />} />
              {temporary ? <Chip label="Temporal" tone="warning" icon={<Clock size={12} color={t.status.warningFg} />} /> : null}
              {timesShared > 0 ? (
                <Chip
                  label={timesShared === 1 ? "Compartida 1 vez" : `Compartida ${timesShared} veces`}
                  tone="neutral"
                  icon={<Share2 size={12} color={t.text.onMuted} />}
                />
              ) : null}
            </View>
          </Animated.View>

          {count > 0 ? (
            <Animated.View
              entering={FadeIn.duration(motion.fast)}
              exiting={FadeOut.duration(motion.base)}
              layout={LinearTransition.duration(motion.base)}
              style={[styles.shareCard, { backgroundColor: t.brand.tint, borderColor: t.brand.tintBorder }]}
            >
              {/* Kit `.t-b`: mission background with the brand blue, so it shows on the tinted card. */}
              <IconTile tone="mission" icon={<QrCode size={19} strokeWidth={2.2} color={t.brand.solid} />} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowTitle}>Compartir mochila</Text>
                <Text style={[styles.meta, { color: t.text.onMuted }]}>Enlace seguro o código QR</Text>
              </View>
              <Button size="sm" onPress={() => onShare(backpack, count)}>
                Compartir
              </Button>
            </Animated.View>
          ) : null}

          {count > 0 ? (
            <Animated.View
              exiting={FadeOut.duration(motion.base)}
              layout={LinearTransition.duration(motion.base)}
              style={styles.card}
            >
              <View style={styles.contentHead}>
                <Text style={[styles.h3, { flex: 1 }]} accessibilityRole="header">
                  Contenido
                </Text>
                <Pressable onPress={onAddDocuments} hitSlop={12} accessibilityRole="button" accessibilityLabel="Agregar documentos">
                  <Text style={styles.link}>+ Agregar</Text>
                </Pressable>
              </View>
              <View>
                {docs.map((doc) => (
                  <Animated.View
                    key={doc.id}
                    entering={FadeIn.duration(motion.fast)}
                    // Removing: the row fades out in 250 ms and the rest close the gap (§5).
                    exiting={FadeOut.duration(motion.base)}
                    layout={LinearTransition.duration(motion.base)}
                  >
                    <BackpackDocumentLine document={doc} onPress={() => onOpenDocument(doc)} onRemove={() => removeWithUndo(doc)} />
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          ) : (
            // Removing the last document: the content card fades out first, then the empty card fades in.
            <Animated.View entering={FadeIn.duration(motion.base).delay(motion.base)} style={[styles.card, styles.emptyCard]}>
              <View style={styles.emptyCopy}>
                <Text style={styles.rowTitle}>Esta mochila está vacía</Text>
                <Text style={[styles.meta, { textAlign: "center", maxWidth: 260 }]}>
                  Agrega lo que vas a llevar. Cuando tenga documentos, podrás compartirla con un QR.
                </Text>
              </View>
              <Button fullWidth icon={<Plus size={17} strokeWidth={2.6} color={t.text.onSolid} />} onPress={onAddDocuments}>
                Agregar documentos
              </Button>
            </Animated.View>
          )}

          <Animated.View layout={LinearTransition.duration(motion.base)} style={styles.danger}>
            <DangerLink
              label="Eliminar mochila"
              icon={<Trash2 size={16} strokeWidth={2.2} color={t.status.errorFg} />}
              onPress={() => setConfirmDelete(true)}
            />
          </Animated.View>
        </ScrollView>
        <PullRefreshIndicator state={pull} />
      </View>

      {confirmDelete ? (
        <BackpackDeleteConfirm
          name={backpack.name}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            onClose();
            setTimeout(() => deleteWithUndo({ ...backpack, documentCount: count }), AFTER_BACK_MS);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], paddingTop: spacing[2], gap: spacing[3], paddingBottom: spacing[10] },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[3], padding: spacing[6] },
    card: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: radii.card,
      borderWidth: 1,
      borderBottomWidth: 4,
      padding: spacing[4],
      gap: spacing[3],
    },
    emptyCard: { borderStyle: "dashed", borderBottomWidth: 1, gap: spacing[4] },
    emptyCopy: { alignItems: "center", gap: spacing[2], paddingVertical: spacing[2] },
    shareCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
    },
    headRow: { flexDirection: "row", alignItems: "center", gap: spacing[4] },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    contentHead: { flexDirection: "row", alignItems: "center", minHeight: 24 },
    lineSkeleton: { flexDirection: "row", alignItems: "center", gap: spacing[3], paddingVertical: 6 },
    h2: { fontSize: 19, lineHeight: 24, fontFamily: nativeFont("heading", 900), color: t.text.primary },
    h3: { fontSize: 17, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    sub: { fontSize: 14, lineHeight: 20, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    rowTitle: { fontSize: 15, lineHeight: 20, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    meta: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    link: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.brand.text },
    danger: { alignItems: "center", marginTop: spacing[2] },
  });
}
