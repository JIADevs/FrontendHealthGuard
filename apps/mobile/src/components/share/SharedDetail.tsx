import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { useQueryClient } from "@tanstack/react-query";
import { Backpack, Check, Clock, Copy, Link2, QrCode, X } from "lucide-react-native";
import type { Document, ShareLink, ShareResourceType } from "@helu/api";
import {
  useDocumentQuery,
  useExtendShareMutation,
  useInfiniteBackpackDocuments,
  useRevokeShareMutation,
  useShareHistoryQuery,
} from "@helu/api/hooks";
import {
  Button,
  Chip,
  ConfirmModal,
  DangerLink,
  IconTile,
  Skeleton,
  SkeletonGroup,
  fontSize,
  motion,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { CATEGORY_META, categoryOf } from "../documents/documentCategories";
import { documentDateLabel } from "../documents/utils/groupDocumentsByDate";
import { notify } from "../../lib/notify";
import { resolveExpoReachableUrl } from "../../utils/shareLinks";
import { expiredOnPhrase, formatShareWhen, viewsPhrase } from "./shareUtils";

export interface SharedDetailProps {
  linkId: string;
  resourceType: ShareResourceType;
  onClose: () => void;
  onShowQr: (link: ShareLink) => void;
  onOpenDocument: (doc: Document) => void;
  /** Expired link: share the same document or backpack again (step 2). */
  onShareAgain: (link: ShareLink) => void;
}

const COPIED_MS = 1500;

/**
 * Mockup «Detalle compartido»: header card (tile, title, «Compartido · Enlace público», status),
 * «Vence / Visto / Permisos», the documents, primary «Mostrar QR», «Copiar enlace» and «Extender
 * plazo», and «Revocar acceso» as a red link. Revoking waits for the server (#35).
 */
export function SharedDetail({ linkId, resourceType, onClose, onShowQr, onOpenDocument, onShareAgain }: SharedDetailProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const shares = useShareHistoryQuery();
  const link = shares.data?.find((l) => l.linkId === linkId && l.resourceType === resourceType);
  const showSkeleton = useSkeletonVisible(shares.isLoading && !link);
  const revoke = useRevokeShareMutation();
  const extend = useExtendShareMutation();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  // Fresh view counts when the screen or the app comes back (a doctor may have just opened it).
  const { refetch } = shares;
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => s === "active" && void refetch());
    return () => sub.remove();
  }, [refetch]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(id);
  }, [copied]);

  const header = <ScreenHeader title="Compartido" />;

  if (showSkeleton || (shares.isLoading && !link)) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        {header}
        <SkeletonGroup label="Cargando el enlace" style={styles.content}>
          <View style={styles.card}>
            <View style={styles.headRow}>
              <Skeleton width={52} height={52} radius={16} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="70%" height={16} />
                <Skeleton width="50%" height={12} />
              </View>
            </View>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.pair}>
                <Skeleton width={60} height={12} />
                <Skeleton width={130} height={14} />
              </View>
            ))}
          </View>
          <Skeleton height={120} radius={radii.card} />
        </SkeletonGroup>
      </SafeAreaView>
    );
  }

  if (!link) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        {header}
        <View style={styles.centered}>
          <Text style={styles.h3}>Este enlace ya no existe</Text>
          <Text style={[styles.meta, { textAlign: "center" }]}>Puede que lo hayas revocado.</Text>
          <Button variant="secondary" onPress={onClose}>
            Volver
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const active = link.status === "active";
  const Icon = link.resourceType === "backpack" ? Backpack : Link2;

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(resolveExpoReachableUrl(link.shareUrl));
      setCopied(true);
      notify({ message: "Enlace copiado" });
    } catch {
      notify({ tone: "error", message: "No se pudo copiar el enlace" });
    }
  };

  const doExtend = () =>
    extend.mutate(
      { linkId: link.linkId, resourceType: link.resourceType },
      {
        onSuccess: (updated) => {
          // The response is the updated link: show the new date with the toast, not after a refetch.
          qc.setQueriesData<ShareLink[]>({ queryKey: ["shares"] }, (list) =>
            list?.map((l) => (l.linkId === updated.linkId && l.resourceType === updated.resourceType ? updated : l)),
          );
          notify({ message: "Plazo extendido", description: "El enlace dura 24 horas más." });
        },
        onError: () => notify({ tone: "error", message: "No se pudo extender", description: "Revisa tu conexión e intenta de nuevo." }),
      },
    );

  const doRevoke = () =>
    revoke.mutate(
      { linkId: link.linkId, resourceType: link.resourceType },
      {
        onSuccess: () => {
          setConfirmRevoke(false);
          notify({ message: "Acceso revocado", description: "El enlace ya no funciona." });
          onClose();
        },
        onError: () => notify({ tone: "error", message: "No se pudo revocar", description: "Revisa tu conexión e intenta de nuevo." }),
      },
    );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {header}
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeIn.duration(motion.fast)} style={styles.card}>
          <View style={styles.headRow}>
            <IconTile
              tone={active ? "mission" : "neutral"}
              size="lg"
              icon={<Icon size={24} strokeWidth={2.2} color={active ? t.brand.solid : t.text.onMuted} />}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.h3} numberOfLines={2}>
                {link.resourceType === "backpack" ? `Mochila «${link.title}»` : link.title}
              </Text>
              <Text style={styles.meta}>Compartido · Enlace público</Text>
            </View>
            <Chip label={active ? "Activo" : "Expirado"} tone={active ? "success" : "neutral"} />
          </View>
          <View style={styles.pair}>
            <Text style={styles.meta}>{active ? "Vence" : "Venció"}</Text>
            {/* The new date fades in after «Extender plazo». */}
            <Animated.Text key={link.expiresAt ?? "never"} entering={FadeIn.duration(motion.base)} style={styles.value}>
              {link.expiresAt ? (active ? formatShareWhen(link.expiresAt) : expiredOnPhrase(link.expiresAt).replace("Venció el ", "")) : "Sin vencimiento"}
            </Animated.Text>
          </View>
          <View style={styles.pair}>
            <Text style={styles.meta}>Visto</Text>
            <Text style={styles.value}>{viewsPhrase(link.viewCount, link.lastViewedAt)}</Text>
          </View>
          <View style={styles.pair}>
            <Text style={styles.meta}>Permisos</Text>
            <Text style={styles.value}>Solo ver</Text>
          </View>
        </Animated.View>

        <SharedDocuments link={link} onOpen={onOpenDocument} />

        {active ? (
          <>
            <Button fullWidth icon={<QrCode size={16} strokeWidth={2.2} color={t.text.onSolid} />} onPress={() => onShowQr(link)}>
              Mostrar QR
            </Button>
            <View style={styles.row2}>
              <View style={styles.half}>
                <Button
                  variant="secondary"
                  fullWidth
                  icon={copied ? <Check size={16} strokeWidth={3} color={t.brand.text} /> : <Copy size={16} color={t.brand.text} />}
                  onPress={() => void copy()}
                >
                  {copied ? "Copiado" : "Copiar enlace"}
                </Button>
              </View>
              {link.expiresAt ? (
                <View style={styles.half}>
                  <Button
                    variant="secondary"
                    fullWidth
                    icon={<Clock size={16} color={t.brand.text} />}
                    onPress={doExtend}
                    loading={extend.isPending}
                    loadingLabel="Extendiendo…"
                  >
                    Extender plazo
                  </Button>
                </View>
              ) : null}
            </View>
            <View style={styles.danger}>
              <DangerLink label="Revocar acceso" icon={<X size={16} strokeWidth={2.4} color={t.status.errorFg} />} onPress={() => setConfirmRevoke(true)} />
            </View>
          </>
        ) : (
          <Button fullWidth icon={<Link2 size={16} strokeWidth={2.2} color={t.text.onSolid} />} onPress={() => onShareAgain(link)}>
            Compartir de nuevo
          </Button>
        )}
      </ScrollView>

      {confirmRevoke ? (
        <ConfirmModal
          title="¿Revocar el acceso?"
          message="Quien tenga el enlace ya no podrá abrir los documentos. Puedes crear uno nuevo cuando quieras."
          keepLabel="Mantener"
          confirmLabel="Revocar"
          confirmVariant="danger"
          loading={revoke.isPending}
          onConfirm={doRevoke}
          onCancel={() => setConfirmRevoke(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

/** «Documentos» card: the shared document, or the backpack's documents. */
function SharedDocuments({ link, onOpen }: { link: ShareLink; onOpen: (doc: Document) => void }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const isDoc = link.resourceType === "document";
  const docQuery = useDocumentQuery(isDoc ? link.resourceId : "");
  const bpQuery = useInfiniteBackpackDocuments(isDoc ? "" : link.resourceId);
  const docs: Document[] = isDoc
    ? docQuery.data
      ? [docQuery.data as Document]
      : []
    : bpQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const loading = isDoc ? docQuery.isLoading : bpQuery.isLoading;

  return (
    <View style={styles.card}>
      <Text style={styles.h3}>Documentos</Text>
      {loading ? (
        <SkeletonGroup label="Cargando documentos" style={{ gap: spacing[3] }}>
          <Skeleton height={40} radius={13} />
          <Skeleton height={40} radius={13} />
        </SkeletonGroup>
      ) : docs.length === 0 ? (
        <Text style={styles.meta}>No encontramos los documentos de este enlace.</Text>
      ) : (
        docs.map((doc) => {
          const C = CATEGORY_META[categoryOf(doc)];
          return (
            <Pressable
              key={doc.id}
              onPress={() => onOpen(doc)}
              style={({ pressed }) => [styles.docLine, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${doc.title}`}
            >
              <IconTile tone="document" icon={<C.icon size={19} strokeWidth={2.2} color={t.accent.docFg} />} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.docTitle} numberOfLines={1}>
                  {doc.title}
                </Text>
                <Text style={styles.meta}>{`${documentDateLabel(doc)} · ${C.label}`}</Text>
              </View>
            </Pressable>
          );
        })
      )}
    </View>
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
    headRow: { flexDirection: "row", alignItems: "center", gap: spacing[4] },
    pair: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[3] },
    h3: { fontSize: 17, lineHeight: 22, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    value: { fontSize: 14, fontFamily: nativeFont("body", 600), color: t.text.primary, flexShrink: 1, textAlign: "right" },
    row2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    half: { flexGrow: 1, flexBasis: 160 },
    danger: { alignItems: "center", marginTop: spacing[2] },
    docLine: { flexDirection: "row", alignItems: "center", gap: spacing[3], minHeight: 44 },
    docTitle: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
  });
}
