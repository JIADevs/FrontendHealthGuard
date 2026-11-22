import { useCallback, useMemo, useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { Backpack, Copy, Download, ExternalLink, Eye, EyeOff, Pencil, Share2, Trash2 } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useDocumentQuery, useTagCategoriesQuery, useTreatmentByIdQuery } from "@helu/api/hooks";
import { getSignedUrl, type Document } from "@helu/api";
import {
  Button,
  Chip,
  DangerLink,
  IconButton,
  IconTile,
  PressableScale,
  Skeleton,
  SkeletonGroup,
  contentEntering,
  nativeFont,
  radii,
  resolveDocFormat,
  spacing,
  useAppTheme,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { notify } from "../../lib/notify";
import { useOpenDocumentExternal } from "../../hooks/useOpenDocumentExternal";
import { CATEGORY_META, categoryOf } from "./documentCategories";
import { DocumentPdfViewer } from "./DocumentPdfViewer";
import { DocumentViewerModal } from "./DocumentViewerModal";
import { AddToBackpackSheet } from "./AddToBackpackSheet";
import { getDocumentPageCount } from "./utils/documentDetailMeta";
import { documentDay } from "./utils/groupDocumentsByDate";

export interface DocumentDetailProps {
  id: string;
  onBack: () => void;
  onShare: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const PREVIEW_HEIGHT = 260;
/** The tag category whose values are doctors (`/documents/tags/categories`). */
const DOCTOR_CATEGORY = "médico";

/**
 * Mockup «Detalle de documento»: preview, title with its type, «Compartir» as the only primary
 * action, «A mochila» and «Editar» as small cards, the data card, the tags, and «Eliminar documento»
 * apart at the end (deleted at once, «Deshacer» in the toast). Portal links show the portal instead
 * of a preview.
 */
export function DocumentDetail({ id, onBack, onShare, onEdit, onDelete }: DocumentDetailProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const docQuery = useDocumentQuery(id);
  const doc = docQuery.data as Document | undefined;
  const showSkeleton = useSkeletonVisible(docQuery.isLoading);
  const tagCatalog = useTagCategoriesQuery();
  const treatment = useTreatmentByIdQuery(doc?.treatmentId);
  const isLink = doc?.kind === "LINK";
  const signed = useQuery({
    queryKey: ["signed-url", doc?.fileUrl],
    queryFn: () => getSignedUrl(doc!.fileUrl!),
    enabled: !isLink && !!doc?.fileUrl,
  });
  const { openDocument, opening } = useOpenDocumentExternal();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [backpackOpen, setBackpackOpen] = useState(false);

  const doctorCategoryIds = useMemo(() => {
    const raw = Array.isArray(tagCatalog.data) ? (tagCatalog.data as { id: string; name: string }[]) : [];
    return new Set(raw.filter((c) => c.name.toLowerCase() === DOCTOR_CATEGORY).map((c) => c.id));
  }, [tagCatalog.data]);

  const download = useCallback(() => {
    if (!doc) return;
    if (isLink) {
      void Linking.openURL(doc.portalUrl ?? "");
      return;
    }
    void openDocument({ url: signed.data?.url ?? "", title: doc.title, format: doc.format ?? "", docFormat: resolveDocFormat(doc.format ?? "") });
  }, [doc, isLink, openDocument, signed.data?.url]);

  if (showSkeleton) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader title="Documento" onBack={onBack} />
        {/* §6c: back bar is real; preview at its height, title, date, chips and 3 label–value pairs. */}
        <SkeletonGroup label="Cargando el documento" style={styles.content}>
          <Skeleton height={PREVIEW_HEIGHT} radius={18} />
          <Skeleton width="80%" height={20} />
          <View style={styles.chips}>
            <Skeleton width={90} height={28} radius={14} />
            <Skeleton width={70} height={28} radius={14} />
          </View>
          <Skeleton height={48} radius={14} />
          <View style={styles.card}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.pair}>
                <Skeleton width={70} height={13} />
                <Skeleton width={120} height={13} />
              </View>
            ))}
          </View>
        </SkeletonGroup>
      </SafeAreaView>
    );
  }

  if (!doc) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader title="Documento" onBack={onBack} />
        <View style={styles.centered}>
          <Text style={styles.h3}>No encontramos este documento</Text>
          <Text style={[styles.sub, styles.center]}>Puede que lo hayan eliminado.</Text>
          <Button variant="secondary" onPress={onBack}>
            Volver a Documentos
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const category = CATEGORY_META[categoryOf(doc)];
  const CategoryIcon = category.icon;
  const doctors = doc.customTags.filter((tag) => doctorCategoryIds.has(tag.categoryId));
  const otherTags = doc.customTags.filter((tag) => !doctorCategoryIds.has(tag.categoryId));
  const day = documentDay(doc);
  const dateLabel = Number.isNaN(day.getTime()) ? "" : `${day.getDate()} ${MONTHS[day.getMonth()]} ${day.getFullYear()}`;
  const doctorLabel = [doctors.map((d) => d.value).join(", "), doc.specialties[0]?.name].filter(Boolean).join(" · ");
  const rows: [string, string][] = [
    ["Tipo", doc.documentType?.name ?? category.label],
    ["Fecha", dateLabel],
    ...(doctorLabel ? ([["Médico", doctorLabel]] as [string, string][]) : []),
    ...(treatment.data?.name ? ([["Tratamiento", treatment.data.name]] as [string, string][]) : []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="Documento"
        onBack={onBack}
        right={
          <IconButton
            icon={isLink ? <ExternalLink size={17} color={t.text.onMuted} /> : <Download size={17} color={t.text.onMuted} />}
            accessibilityLabel={isLink ? "Abrir el portal" : "Descargar"}
            onPress={download}
            disabled={opening}
          />
        }
      />

      <Animated.ScrollView entering={contentEntering} contentContainerStyle={styles.content}>
        {isLink ? (
          <PortalCard url={doc.portalUrl ?? ""} username={doc.portalUsername} password={doc.portalPassword} />
        ) : (
          <Preview
            doc={doc}
            uri={signed.data?.url}
            loading={signed.isLoading}
            pages={getDocumentPageCount(doc)}
            onOpen={() => setViewerOpen(true)}
          />
        )}

        <View style={styles.titleBlock}>
          <Text style={styles.h2} accessibilityRole="header">
            {doc.title}
          </Text>
          <View style={styles.chips}>
            <Chip label={category.label} tone="neutral" icon={<CategoryIcon size={12} color={t.text.onMuted} />} />
          </View>
          {doc.description?.trim() ? <Text style={styles.sub}>{doc.description.trim()}</Text> : null}
        </View>

        <View style={styles.actions}>
          <Button size="lg" fullWidth icon={<Share2 size={16} strokeWidth={2.2} color={t.text.onSolid} />} onPress={() => onShare(doc)}>
            Compartir
          </Button>
          <View style={styles.smallActions}>
            <SmallAction tone="backpack" icon={<Backpack size={18} strokeWidth={2.2} color={t.accent.backpackFg} />} label="A mochila" onPress={() => setBackpackOpen(true)} />
            <SmallAction tone="neutral" icon={<Pencil size={18} strokeWidth={2.2} color={t.text.onMuted} />} label="Editar" onPress={() => onEdit(doc)} />
          </View>
        </View>

        <View style={styles.card}>
          {rows.map(([label, value], i) => (
            <View key={label}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.pair} accessible accessibilityLabel={`${label}: ${value}`}>
                <Text style={styles.pairLabel}>{label}</Text>
                <Text style={styles.pairValue} numberOfLines={2}>
                  {value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {otherTags.length > 0 ? (
          <View style={[styles.card, styles.cardTight]}>
            <Text style={styles.lbl}>Etiquetas</Text>
            <View style={styles.chips}>
              {otherTags.map((tag) => (
                <Chip key={tag.id} label={tag.value} tone="neutral" />
              ))}
            </View>
          </View>
        ) : null}

        <DangerLink label="Eliminar documento" icon={<Trash2 size={16} color={t.status.errorFg} />} onPress={() => onDelete(doc)} />
      </Animated.ScrollView>

      {!isLink ? (
        <DocumentViewerModal
          visible={viewerOpen}
          title={doc.title}
          uri={signed.data?.url}
          format={resolveDocFormat(doc.format ?? "")}
          loading={signed.isLoading}
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
      {backpackOpen ? <AddToBackpackSheet documentId={doc.id} onClose={() => setBackpackOpen(false)} /> : null}
    </SafeAreaView>
  );
}

/** The file at its own aspect ratio, 260 px high, with «1 / 2» when there are pages. Tap to open it full screen. */
function Preview({ doc, uri, loading, pages, onOpen }: { doc: Document; uri?: string; loading: boolean; pages: number | null; onOpen: () => void }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const format = resolveDocFormat(doc.format ?? "");
  return (
    <PressableScale onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Abrir ${doc.title} en pantalla completa`} style={styles.preview}>
      {loading || !uri ? (
        <Skeleton height={PREVIEW_HEIGHT} radius={18} />
      ) : format === "image" ? (
        <Image source={{ uri }} style={styles.previewImage} resizeMode="contain" accessibilityIgnoresInvertColors />
      ) : format === "pdf" ? (
        <View pointerEvents="none" style={styles.previewImage}>
          <DocumentPdfViewer uri={uri} title={doc.title} height={PREVIEW_HEIGHT} />
        </View>
      ) : (
        <Text style={[styles.sub, styles.center]}>Toca para abrir el archivo.</Text>
      )}
      {pages && pages > 1 ? (
        <View style={styles.pageChip}>
          <Chip label={`1 / ${pages}`} tone="neutral" />
        </View>
      ) : null}
    </PressableScale>
  );
}

function SmallAction({ tone, icon, label, onPress }: { tone: "backpack" | "neutral"; icon: React.ReactNode; label: string; onPress: () => void }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    // PressableScale styles its inner view, so the outer wrapper takes the row's share of width.
    <View style={styles.smallWrap}>
      <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[styles.card, styles.smallAction]}>
        <IconTile tone={tone} icon={icon} />
        <Text style={styles.smallLabel}>{label}</Text>
      </PressableScale>
    </View>
  );
}

/** Portal link: the URL, the user or access code and, for older links, the saved password. */
function PortalCard({ url, username, password }: { url: string; username?: string | null; password?: string | null }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [showPassword, setShowPassword] = useState(false);
  const copy = async (label: string, value: string) => {
    try {
      await Clipboard.setStringAsync(value);
      notify({ message: `${label} copiado` });
    } catch {
      notify({ tone: "error", message: "No se pudo copiar" });
    }
  };
  const Row = ({ label, value, secret }: { label: string; value: string; secret?: boolean }) => (
    <View style={styles.portalRow}>
      <View style={styles.portalCopy}>
        <Text style={styles.pairLabel}>{label}</Text>
        <Text style={[styles.pairValue, styles.left]} numberOfLines={1} selectable>
          {secret && !showPassword ? "••••••••" : value}
        </Text>
      </View>
      {secret ? (
        <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.iconHit} accessibilityRole="button" accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
          {showPassword ? <EyeOff size={18} color={t.text.secondary} /> : <Eye size={18} color={t.text.secondary} />}
        </Pressable>
      ) : null}
      <Pressable onPress={() => void copy(label, value)} style={styles.iconHit} accessibilityRole="button" accessibilityLabel={`Copiar ${label.toLowerCase()}`}>
        <Copy size={18} color={t.text.secondary} />
      </Pressable>
    </View>
  );
  return (
    <View style={styles.card}>
      <Row label="URL del portal" value={url} />
      {username ? <Row label="Usuario o código" value={username} /> : null}
      {password ? <Row label="Contraseña" value={password} secret /> : null}
      <Button variant="secondary" fullWidth icon={<ExternalLink size={16} color={t.brand.text} />} onPress={() => void Linking.openURL(url)}>
        Abrir el portal
      </Button>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[10] },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing[3], padding: spacing[6] },
    preview: {
      height: PREVIEW_HEIGHT,
      borderRadius: 18,
      backgroundColor: t.border.default,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    previewImage: { width: "100%", height: "100%" },
    pageChip: { position: "absolute", right: 12, bottom: 12 },
    titleBlock: { gap: spacing[2] },
    h2: { fontSize: 19, lineHeight: 24, fontFamily: nativeFont("heading", 900), color: t.text.primary },
    h3: { fontSize: 17, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    sub: { fontSize: 14, lineHeight: 21, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    center: { textAlign: "center" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
    actions: { gap: spacing[3] },
    smallActions: { flexDirection: "row", gap: 10 },
    smallWrap: { flex: 1 },
    smallAction: { alignItems: "center", gap: 6, paddingVertical: 12, paddingHorizontal: 4 },
    smallLabel: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.text.secondary },
    // Kit `.card`: radius 18, 1 px border with the bottom edge, padding 16, gap 12
    card: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: radii.card,
      borderWidth: 1,
      borderBottomWidth: 4,
      padding: spacing[4],
      gap: spacing[3],
    },
    cardTight: { padding: 14, gap: 10 },
    divider: { height: 1, backgroundColor: t.border.default, marginBottom: spacing[3] },
    pair: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[3] },
    pairLabel: { fontSize: 13, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    pairValue: { flexShrink: 1, textAlign: "right", fontSize: 14, fontFamily: nativeFont("body", 600), color: t.text.primary },
    left: { textAlign: "left" },
    lbl: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    portalRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    portalCopy: { flex: 1, minWidth: 0, gap: 2 },
    iconHit: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  });
}
