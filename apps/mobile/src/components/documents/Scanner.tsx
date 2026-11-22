import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { CameraView } from "expo-camera";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { ArrowLeft, ArrowRight, Camera, Check, MoreVertical, RotateCcw, Sparkles, Trash2, X, Zap, ZapOff } from "lucide-react-native";
import {
  BottomActionBar,
  Button,
  ChoiceChips,
  colors,
  nativeFont,
  overlay,
  PressableScale,
  spacing,
  useAppTheme,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { Mascot } from "../brand";
import { AgendaRowActionsMenu, measureAgendaRowActionsMenuLeft } from "../agenda/AgendaRowActionsMenu";
import { useScannerCameraPermission } from "../../hooks/useScannerCameraPermission";
import type { FileSource } from "../../hooks/useDocumentForm";
import { scanImagesToPdfFile } from "../../utils/scanImagesToPdf";
import { getUriFileSizeBytes } from "../../utils/fileUriSize";
import { applyScanFilter, SCAN_FILTERS, type ScanFilter } from "../../utils/scanFilters";
import { notify } from "../../lib/notify";
import { MAX_UPLOAD_MB, friendlySize } from "./DocumentUpload";

interface Page {
  id: string;
  uri: string;
}

type Phase = "camera" | "review";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function newPageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function pagesLabel(n: number) {
  return n === 1 ? "1 página" : `${n} páginas`;
}

/** «Escaneo 21 nov»: the title the upload form starts with. */
function scanBaseName() {
  const d = new Date();
  return `Escaneo ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export interface ScannerProps {
  onClose: () => void;
  /** The pages, as one image or one PDF, ready for «Subir archivo». */
  onContinue: (file: FileSource) => void;
  onUploadInstead: () => void;
}

/**
 * Mockups «Escáner», «Escáner · revisar páginas» and «Escáner · sin permiso de cámara»: a dark camera
 * with a frame guide and the page count; the thumbnail opens the review grid, where each page can be
 * retaken, moved or removed; «Continuar» hands the pages to the upload form.
 */
export function Scanner({ onClose, onContinue, onUploadInstead }: ScannerProps) {
  const permission = useScannerCameraPermission();
  const [phase, setPhase] = useState<Phase>("camera");
  const [pages, setPages] = useState<Page[]>([]);
  const [retakeId, setRetakeId] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  // «Mejorado» by default: the scanner is for papers, and this is what makes them readable.
  const [filter, setFilter] = useState<ScanFilter>("enhanced");
  // Processed copies per page and filter; the original photo is kept so switching never degrades.
  const [processed, setProcessed] = useState<Record<string, Partial<Record<ScanFilter, string>>>>({});
  const processedRef = useRef(processed);
  processedRef.current = processed;

  const ensureProcessed = useCallback(async (page: Page, look: ScanFilter): Promise<string> => {
    const ready = processedRef.current[page.id]?.[look];
    if (ready) return ready;
    let uri = page.uri;
    try {
      uri = await applyScanFilter(page.uri, look);
    } catch (err) {
      // If the filter fails the page still goes, as it was taken.
      console.warn("[Scanner] filter failed", err);
    }
    processedRef.current = { ...processedRef.current, [page.id]: { ...processedRef.current[page.id], [look]: uri } };
    setProcessed(processedRef.current);
    return uri;
  }, []);

  // Process in the review only, one page at a time, so the camera never stutters.
  useEffect(() => {
    if (phase !== "review") return;
    let cancelled = false;
    void (async () => {
      for (const page of pages) {
        if (cancelled) return;
        await ensureProcessed(page, filter);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, pages, filter, ensureProcessed]);

  const addPage = useCallback(
    (uri: string) => {
      if (retakeId) {
        setPages((prev) => prev.map((p) => (p.id === retakeId ? { id: newPageId(), uri } : p)));
        setRetakeId(null);
        setPhase("review");
        return;
      }
      setPages((prev) => [...prev, { id: newPageId(), uri }]);
    },
    [retakeId],
  );

  const removePage = useCallback((id: string) => {
    setPages((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (next.length === 0) setPhase("camera");
      return next;
    });
  }, []);

  const movePage = useCallback((id: string, to: number) => {
    setPages((prev) => {
      const from = prev.findIndex((p) => p.id === id);
      if (from < 0 || to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [page] = next.splice(from, 1);
      next.splice(to, 0, page!);
      return next;
    });
  }, []);

  const finish = useCallback(async () => {
    if (pages.length === 0 || preparing) return;
    setPreparing(true);
    try {
      const base = scanBaseName();
      const uris: string[] = [];
      for (const page of pages) uris.push(await ensureProcessed(page, filter));
      const file: FileSource =
        uris.length === 1
          ? { uri: uris[0]!, name: `${base}.jpg`, mimeType: "image/jpeg", size: await getUriFileSizeBytes(uris[0]!) }
          : { ...(await scanImagesToPdfFile(uris)), name: `${base}.pdf` };
      if (file.size != null && file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        notify({
          tone: "error",
          message: "El escaneo es demasiado grande",
          description: `El máximo es ${MAX_UPLOAD_MB} MB y pesa ${friendlySize(file.size)}. Quita alguna página.`,
        });
        return;
      }
      onContinue(file);
    } catch (err) {
      console.warn("[Scanner] could not build the file", err);
      notify({ tone: "error", message: "No se pudo preparar el escaneo", description: "Intenta de nuevo." });
    } finally {
      setPreparing(false);
    }
  }, [pages, preparing, onContinue, ensureProcessed, filter]);

  if (!permission.permissionReady) return <View style={{ flex: 1, backgroundColor: colors.slate[900] }} />;

  if (!permission.granted) {
    return (
      <ScannerPermission
        needsSettings={permission.needsSettings}
        statusMessage={permission.statusMessage}
        onRequest={permission.requestCameraAccess}
        onOpenSettings={permission.openSettings}
        onClose={onClose}
        onUploadInstead={onUploadInstead}
      />
    );
  }

  if (phase === "review" && pages.length > 0) {
    return (
      <ScannerReview
        pages={pages}
        filter={filter}
        onFilter={setFilter}
        shownUri={(page) => processed[page.id]?.[filter] ?? null}
        preparing={preparing}
        onBack={() => setPhase("camera")}
        onAddPage={() => setPhase("camera")}
        onRetake={(id) => {
          setRetakeId(id);
          setPhase("camera");
        }}
        onRemove={removePage}
        onMove={movePage}
        onContinue={() => void finish()}
      />
    );
  }

  const retakeIndex = retakeId ? pages.findIndex((p) => p.id === retakeId) : -1;
  return (
    <ScannerCamera
      pages={pages}
      retakeLabel={retakeIndex >= 0 ? `Vuelve a tomar la página ${retakeIndex + 1}` : null}
      preparing={preparing}
      onClose={() => {
        if (retakeId) {
          setRetakeId(null);
          setPhase("review");
        } else onClose();
      }}
      onCapture={addPage}
      onOpenReview={() => setPhase("review")}
      onContinue={() => void finish()}
    />
  );
}

// ─────────────────────────────────────────────── Camera ──

function ScannerCamera({
  pages,
  retakeLabel,
  preparing,
  onClose,
  onCapture,
  onOpenReview,
  onContinue,
}: {
  pages: Page[];
  retakeLabel: string | null;
  preparing: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
  onOpenReview: () => void;
  onContinue: () => void;
}) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [torch, setTorch] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const reduced = useReducedMotion();
  const flash = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const last = pages[pages.length - 1];

  const shoot = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // A short white blink so the shot is felt (§3: 80 ms in, 200 ms out).
    if (!reduced) flash.value = withSequence(withTiming(0.7, { duration: 80 }), withTiming(0, { duration: 200 }));
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) onCapture(photo.uri);
    } catch (err) {
      console.warn("[Scanner] capture failed", err);
      notify({ tone: "error", message: "No se pudo tomar la foto", description: "Intenta de nuevo." });
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={[cam.screen, { paddingTop: insets.top + spacing[2], paddingBottom: insets.bottom + spacing[2] }]}>
      <StatusBar style="light" />
      <View style={cam.header}>
        <DarkIconButton label={retakeLabel ? "Volver a revisar" : "Cerrar escáner"} onPress={onClose}>
          <X size={20} color={colors.white} />
        </DarkIconButton>
        <Text style={cam.title} accessibilityRole="header">
          Escanear documento
        </Text>
        <DarkIconButton label={torch ? "Apagar la linterna" : "Encender la linterna"} onPress={() => setTorch((v) => !v)}>
          {torch ? <Zap size={18} color={colors.white} fill={colors.white} /> : <ZapOff size={18} color={colors.white} />}
        </DarkIconButton>
      </View>

      <View style={cam.viewport}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" enableTorch={torch} />
        <View pointerEvents="none" style={cam.guide} />
        <View pointerEvents="none" style={cam.chip}>
          <Sparkles size={12} color={colors.primary[700]} />
          <Text style={cam.chipText}>{retakeLabel ?? "Encuadra el documento en el marco"}</Text>
        </View>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.white }, flashStyle]} />
      </View>

      <View style={cam.dock}>
        <View style={cam.side}>
          {last ? (
            <Pressable onPress={onOpenReview} accessibilityRole="button" accessibilityLabel={`Revisar ${pagesLabel(pages.length)}`} style={cam.sideInner}>
              <Animated.View key={last.id} entering={ZoomIn.duration(200)}>
                <Image source={{ uri: last.uri }} style={cam.thumb} />
              </Animated.View>
              <Text style={cam.sideLabel}>{pagesLabel(pages.length)}</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable onPress={() => void shoot()} disabled={capturing} accessibilityRole="button" accessibilityLabel="Tomar foto">
          {({ pressed }) => (
            <View style={[cam.shutter, pressed && !reduced && { transform: [{ scale: 0.94 }] }]}>
              <View style={[cam.shutterInner, (capturing || pressed) && { opacity: 0.7 }]} />
            </View>
          )}
        </Pressable>

        <View style={cam.side}>
          {pages.length > 0 && !retakeLabel ? (
            <Pressable
              onPress={onContinue}
              disabled={preparing}
              accessibilityRole="button"
              accessibilityLabel={`Continuar con ${pagesLabel(pages.length)}`}
              style={cam.sideInner}
            >
              <View style={cam.continueBtn}>
                {preparing ? <ActivityIndicator color={colors.white} /> : <Check size={22} strokeWidth={3} color={colors.white} />}
              </View>
              <Text style={cam.sideLabel}>Continuar</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function DarkIconButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={4}>
      {({ pressed }) => <View style={[cam.iconBtn, pressed && { backgroundColor: overlay.dark }]}>{children}</View>}
    </Pressable>
  );
}

const cam = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate[900] },
  header: { flexDirection: "row", alignItems: "center", gap: spacing[3], paddingHorizontal: spacing[4] },
  title: { flex: 1, textAlign: "center", fontSize: 15, fontFamily: nativeFont("heading", 800), color: colors.white },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: overlay.light, alignItems: "center", justifyContent: "center" },
  viewport: {
    flex: 1,
    marginHorizontal: 6,
    marginVertical: 10,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.slate[800],
    alignItems: "center",
  },
  guide: {
    position: "absolute",
    top: "9%",
    bottom: "9%",
    left: "10%",
    right: "10%",
    borderWidth: 3,
    borderColor: colors.primary[400],
    borderRadius: 14,
  },
  chip: {
    position: "absolute",
    top: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primary[50],
  },
  chipText: { fontSize: 13, fontFamily: nativeFont("heading", 700), color: colors.primary[700] },
  dock: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 6 },
  side: { width: 76, alignItems: "center" },
  sideInner: { alignItems: "center", gap: 4 },
  sideLabel: { fontSize: 13, fontFamily: nativeFont("heading", 700), color: colors.slate[300] },
  thumb: { width: 48, height: 60, borderRadius: 8, borderWidth: 2, borderColor: colors.primary[400], backgroundColor: colors.slate[100] },
  continueBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: overlay.light, alignItems: "center", justifyContent: "center" },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 5, borderColor: colors.white, alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.white },
});

// ─────────────────────────────────────────────── Review ──

function ScannerReview({
  pages,
  filter,
  onFilter,
  shownUri,
  preparing,
  onBack,
  onAddPage,
  onRetake,
  onRemove,
  onMove,
  onContinue,
}: {
  pages: Page[];
  filter: ScanFilter;
  onFilter: (filter: ScanFilter) => void;
  /** The page with the filter applied, or null while it is being processed. */
  shownUri: (page: Page) => string | null;
  preparing: boolean;
  onBack: () => void;
  onAddPage: () => void;
  onRetake: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, to: number) => void;
  onContinue: () => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeReviewStyles(t), [t]);
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing[4] * 2 - 10) / 2;
  // Press and hold a page to pick it up, then tap the place where it goes.
  const [moving, setMoving] = useState<string | null>(null);
  const movingIndex = moving ? pages.findIndex((p) => p.id === moving) : -1;

  const drop = (to: number) => {
    if (!moving) return;
    onMove(moving, to);
    setMoving(null);
    void Haptics.selectionAsync();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />
      <ScreenHeader title="Revisar páginas" subtitle={pagesLabel(pages.length)} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.filters}>
          <Text style={styles.filtersLabel}>Estilo del escaneo</Text>
          <ChoiceChips options={SCAN_FILTERS} value={filter} onChange={(v) => onFilter(v as ScanFilter)} />
        </View>
        <View style={styles.grid}>
          {pages.map((page, index) => (
            <Animated.View
              key={page.id}
              layout={LinearTransition.duration(250)}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={{ width: cardWidth }}
            >
              <ReviewPage
                page={page}
                shownUri={shownUri(page)}
                index={index}
                count={pages.length}
                picked={moving === page.id}
                dropTarget={moving !== null && moving !== page.id}
                onLongPress={() => {
                  setMoving(page.id);
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                onPress={() => (moving === page.id ? setMoving(null) : moving ? drop(index) : undefined)}
                onRetake={() => onRetake(page.id)}
                onRemove={() => onRemove(page.id)}
                onMove={(to) => onMove(page.id, to)}
              />
            </Animated.View>
          ))}
        </View>
        <Button variant="secondary" size="lg" fullWidth onPress={onAddPage} icon={<Camera size={16} color={t.brand.solid} />}>
          Agregar otra página
        </Button>
        <View style={styles.hint}>
          <Mascot pose="point" size={32} />
          <Text style={styles.hintText}>
            {movingIndex >= 0
              ? `Toca el lugar donde quieres poner la página ${movingIndex + 1}.`
              : "Con ⋯ puedes volver a tomar o quitar una página. Mantén presionada una página para cambiar el orden."}
          </Text>
        </View>
      </ScrollView>
      <BottomActionBar
        primary={{
          label: `Continuar con ${pagesLabel(pages.length)}`,
          onPress: onContinue,
          loading: preparing,
          loadingLabel: "Preparando…",
          disabled: preparing,
        }}
      />
    </SafeAreaView>
  );
}

function ReviewPage({
  page,
  shownUri,
  index,
  count,
  picked,
  dropTarget,
  onLongPress,
  onPress,
  onRetake,
  onRemove,
  onMove,
}: {
  page: Page;
  shownUri: string | null;
  index: number;
  count: number;
  picked: boolean;
  dropTarget: boolean;
  onLongPress: () => void;
  onPress: () => void;
  onRetake: () => void;
  onRemove: () => void;
  onMove: (to: number) => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeReviewStyles(t), [t]);
  const triggerRef = useRef<ComponentRef<typeof View>>(null);
  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null);
  const openMenu = () =>
    triggerRef.current?.measureInWindow((x, y, w, h) => setMenu({ top: y + h + spacing[1], left: measureAgendaRowActionsMenuLeft(x, w) }));

  return (
    <>
      <PressableScale
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityLabel={`Página ${index + 1}`}
        accessibilityHint={dropTarget ? "Pone aquí la página elegida" : "Mantén presionada para cambiar el orden"}
        style={[styles.card, picked && { borderColor: t.brand.solid }, dropTarget && { borderStyle: "dashed" }]}
      >
        <View>
          <Image source={{ uri: shownUri ?? page.uri }} style={[styles.image, (picked || !shownUri) && { opacity: 0.6 }]} resizeMode="cover" />
          {!shownUri ? (
            <View style={styles.processing} accessibilityLabel="Aplicando el estilo">
              <ActivityIndicator color={t.brand.solid} />
            </View>
          ) : null}
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardTitle}>{`Página ${index + 1}`}</Text>
          <View ref={triggerRef} collapsable={false}>
            <Pressable onPress={openMenu} style={styles.menuButton} accessibilityRole="button" accessibilityLabel={`Opciones de la página ${index + 1}`}>
              <MoreVertical size={18} color={t.text.muted} />
            </Pressable>
          </View>
        </View>
      </PressableScale>
      <AgendaRowActionsMenu
        visible={menu !== null}
        top={menu?.top ?? 0}
        left={menu?.left ?? 0}
        onClose={() => setMenu(null)}
        actions={[
          { icon: RotateCcw, label: "Volver a tomar", onPress: onRetake },
          ...(index > 0 ? [{ icon: ArrowLeft, label: "Mover antes", onPress: () => onMove(index - 1) }] : []),
          ...(index < count - 1 ? [{ icon: ArrowRight, label: "Mover después", onPress: () => onMove(index + 1) }] : []),
          { icon: Trash2, label: "Quitar", onPress: onRemove, destructive: true },
        ]}
      />
    </>
  );
}

function makeReviewStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[6] },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    // Kit `.card.tight`
    card: {
      gap: 8,
      padding: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    image: { height: 220, borderRadius: 10, borderWidth: 1, borderColor: t.border.default, backgroundColor: t.surface.muted },
    cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    cardTitle: { fontSize: 14, fontFamily: nativeFont("body", 600), color: t.text.primary, paddingLeft: 4 },
    menuButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginVertical: -8 },
    hint: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
    filters: { gap: spacing[2] },
    filtersLabel: { fontSize: 14, fontFamily: nativeFont("body", 600), color: t.text.primary },
    processing: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
    hintText: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
  });
}

// ─────────────────────────────────────────── No permission ──

function ScannerPermission({
  needsSettings,
  statusMessage,
  onRequest,
  onOpenSettings,
  onClose,
  onUploadInstead,
}: {
  needsSettings: boolean;
  statusMessage: string | null;
  onRequest: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
  onUploadInstead: () => void;
}) {
  const t = useAppTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.surface.bg }} edges={["top"]}>
      <StatusBar style="dark" />
      <ScreenHeader title="Escanear documento" onBack={onClose} />
      <Animated.View entering={FadeIn.duration(250)} style={perm.body}>
        <Mascot pose="think" size={110} />
        <Text style={[perm.title, { color: t.text.primary }]} accessibilityRole="header">
          Necesitamos tu cámara
        </Text>
        <Text style={[perm.sub, { color: t.text.secondary }]}>
          {needsSettings
            ? "Para escanear tus papeles, permite el acceso a la cámara en los ajustes del teléfono. Solo la usamos mientras escaneas."
            : "Para escanear tus papeles, Helu necesita usar la cámara. Solo la usamos mientras escaneas."}
        </Text>
        {statusMessage ? <Text style={[perm.status, { color: t.text.muted }]}>{statusMessage}</Text> : null}
      </Animated.View>
      <BottomActionBar
        primary={{ label: needsSettings ? "Abrir ajustes" : "Permitir la cámara", onPress: needsSettings ? onOpenSettings : onRequest }}
        secondary={{ label: "Subir un archivo en su lugar", onPress: onUploadInstead }}
      />
    </SafeAreaView>
  );
}

const perm = StyleSheet.create({
  body: { flex: 1, alignItems: "center", gap: 10, paddingTop: 70, paddingHorizontal: spacing[6] },
  title: { fontSize: 22, lineHeight: 28, fontFamily: nativeFont("heading", 800), textAlign: "center", marginTop: spacing[2] },
  sub: { fontSize: 15, lineHeight: 22, fontFamily: nativeFont("body", 400), textAlign: "center", maxWidth: 290 },
  status: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400), textAlign: "center", maxWidth: 290 },
});
