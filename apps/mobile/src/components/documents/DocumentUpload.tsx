import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { FileText, FileUp, Image as ImageIcon, Sparkles } from "lucide-react-native";
import { useTreatmentsQuery } from "@helu/api/hooks";
import {
  BottomActionBar,
  Button,
  DiscardChangesDialog,
  IconTile,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import type { SubscribeBeforeLeave } from "../agenda/AppointmentForm";
import { useDocumentForm, type FileSource } from "../../hooks/useDocumentForm";
import { DocumentFields, type DocumentFieldValues } from "./DocumentFields";
import { notify } from "../../lib/notify";
import { useRecentlySaved } from "../../lib/recentlySaved";
import { useDocumentSuggestion } from "../../lib/documentSuggestion";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
export const MAX_UPLOAD_MB = 25;

export function friendlySize(bytes: number | undefined): string {
  if (bytes == null) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * The picked or current file: tile, name, size and the limit, and «Cambiar» / «Reemplazar». While
 * uploading it shows the percentage, the bar and what comes next (mockup «Subir documento · subiendo»).
 */
export function DocumentFileCard({
  name,
  mimeType,
  size,
  actionLabel,
  onAction,
  progress,
  aiNote,
  banner,
}: {
  name: string;
  mimeType: string;
  size?: number;
  actionLabel?: string;
  onAction?: () => void;
  /** 0–100 while uploading */
  progress?: number | null;
  aiNote?: string | null;
  banner?: React.ReactNode;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const Icon = mimeType.startsWith("image/") ? ImageIcon : FileText;
  const uploading = progress != null && progress < 100;
  const sizeLine = [friendlySize(size), uploading ? null : `máximo ${MAX_UPLOAD_MB} MB`].filter(Boolean).join(" · ");
  return (
    <View style={styles.card}>
      <View style={styles.fileRow}>
        <IconTile tone="document" icon={<Icon size={19} strokeWidth={2.2} color={t.accent.docFg} />} />
        <View style={styles.copy}>
          <Text style={styles.fileName} numberOfLines={1}>
            {name}
          </Text>
          {sizeLine ? <Text style={styles.meta}>{sizeLine}</Text> : null}
        </View>
        {uploading ? (
          <Text style={styles.percent} accessibilityLabel={`Subiendo, ${progress} por ciento`}>{`${progress} %`}</Text>
        ) : actionLabel && onAction ? (
          <Text style={styles.link} onPress={onAction} accessibilityRole="button">
            {actionLabel}
          </Text>
        ) : null}
      </View>
      {uploading ? (
        <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: progress ?? 0 }}>
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
      ) : null}
      {aiNote ? (
        <View style={styles.aiNote}>
          <Sparkles size={16} color={t.accent.aiFg} />
          <Text style={[styles.meta, { color: t.accent.aiFg, flex: 1 }]}>{aiNote}</Text>
        </View>
      ) : null}
      {banner}
    </View>
  );
}

export interface DocumentUploadProps {
  onClose: () => void;
  subscribeBeforeLeave: SubscribeBeforeLeave;
  backpackId?: string;
  backpackName?: string;
  /** Pages from the scanner: skip the system picker and start with this file. */
  initialFile?: FileSource;
  /**
   * Opened from Documentos (or Inicio): an «Orden médica» or «Autorización EPS» gets a mission
   * suggestion and its sheet opens over the list (Misiones RF-68, DA-14). Never from a mission,
   * an appointment or a backpack.
   */
  suggestMission?: boolean;
}

/**
 * Mockup «Subir documento»: the system picker opens first; once a file is chosen it starts uploading
 * and the AI reads it, the fields wait as a skeleton, then come back prefilled and marked. One column
 * and a fixed «Guardar documento» bar.
 */
export function DocumentUpload({ onClose, subscribeBeforeLeave, backpackId, backpackName, initialFile, suggestMission }: DocumentUploadProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const form = useDocumentForm({ backpackId, backpackName, suggestMission, skipNavigateBackOnUpload: true, onUploaded: (doc) => {
    // «Agregar documentos» comes back with this document selected (#46, decision 2).
    useRecentlySaved.getState().markUploaded(doc.id);
    if (doc.missionSuggestion) {
      // The sheet opens over the screen underneath once this one is gone (mockup 4c «D2»–«D5b»).
      const docType = form.catalogs.types.find((tp) => tp.id === form.selectedType);
      useDocumentSuggestion.getState().offer({
        document: { id: doc.id, title: doc.title, typeCode: docType?.code ?? null },
        suggestion: doc.missionSuggestion,
      });
    }
    leave();
  } });
  const treatments = useTreatmentsQuery(1, 100).data?.items ?? [];
  const [file, setFile] = useState<FileSource | null>(null);
  const [date, setDate] = useState(todayKey());
  const [treatmentId, setTreatmentId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const titleRef = useRef<ComponentRef<typeof TextInput>>(null);
  const pickedOnce = useRef(false);

  // ── Leaving: «¿Descartar los cambios?» once a file is chosen (formularios.md §7) ──
  const allowLeave = useRef(false);
  const [askDiscard, setAskDiscard] = useState(false);
  const leave = useCallback(() => {
    allowLeave.current = true;
    onClose();
  }, [onClose]);
  const dirty = file !== null;
  useEffect(
    () =>
      subscribeBeforeLeave((prevent) => {
        if (!dirty || allowLeave.current) return;
        prevent();
        setAskDiscard(true);
      }),
    [subscribeBeforeLeave, dirty],
  );

  const accept = useCallback(
    (picked: FileSource) => {
      setFile(picked);
      form.setTitle(picked.name.replace(/\.[^.]+$/, ""));
      form.startPreUpload(picked);
      void form.classify(picked);
    },
    [form],
  );

  const pick = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ACCEPTED_TYPES, copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets?.length) {
        if (!file) leave();
        return;
      }
      const asset = result.assets[0]!;
      if (asset.size != null && asset.size > MAX_UPLOAD_MB * 1024 * 1024) {
        notify({
          tone: "error",
          message: "Archivo demasiado grande",
          description: `El máximo es ${MAX_UPLOAD_MB} MB y este pesa ${friendlySize(asset.size)}.`,
        });
        if (!file) leave();
        return;
      }
      const picked: FileSource = {
        uri: asset.uri,
        name: asset.name || `documento-${Date.now()}`,
        mimeType: asset.mimeType || "application/octet-stream",
        size: asset.size ?? undefined,
      };
      accept(picked);
    } catch (err) {
      console.warn("[DocumentUpload] picker failed", err);
      notify({ tone: "error", message: "No se pudo abrir el archivo", description: "Intenta con otro archivo." });
      if (!file) leave();
    }
  }, [file, accept, leave]);

  // The system picker can't present while this screen is still sliding in: open it after the transition.
  useEffect(() => {
    if (pickedOnce.current) return;
    pickedOnce.current = true;
    if (initialFile) {
      accept(initialFile);
      return;
    }
    // The modal slides in over 350 ms (§3); wait a little past it.
    const timer = setTimeout(() => void pick(), 450);
    return () => clearTimeout(timer);
  }, [pick, accept, initialFile]);

  const uploading = form.preUpload != null && !form.preUpload.done && !form.preUpload.failed;
  const reading = form.classifying;
  const result = form.classificationResult;
  const typeName = form.catalogs.types.find((tp) => tp.id === form.selectedType)?.name;

  const titleError = (submitted || titleTouched) && !form.title.trim() ? "Escribe un título para el documento." : undefined;
  // The type is required: it decides whether a mission is suggested (Misiones DU-45).
  const typeError = submitted && !form.selectedType ? "Elige el tipo del documento." : undefined;

  const values: DocumentFieldValues = {
    title: form.title,
    typeId: form.selectedType,
    subtypeId: form.selectedSubtype,
    specialtyId: form.selectedSpecialty,
    date,
    treatmentId,
    tagIds: form.selectedTags,
    description: form.description,
  };
  const change = (patch: Partial<DocumentFieldValues>) => {
    if (patch.title !== undefined) form.setTitle(patch.title);
    if ("typeId" in patch) form.setSelectedType(patch.typeId);
    if ("subtypeId" in patch) form.setSelectedSubtype(patch.subtypeId);
    if ("specialtyId" in patch) form.setSelectedSpecialty(patch.specialtyId);
    if (patch.date !== undefined) setDate(patch.date);
    if ("treatmentId" in patch) setTreatmentId(patch.treatmentId ?? null);
    if (patch.tagIds) form.setSelectedTags(patch.tagIds);
    if (patch.description !== undefined) form.setDescription(patch.description);
  };

  const save = () => {
    setSubmitted(true);
    if (!file) return;
    if (!form.title.trim()) {
      titleRef.current?.focus();
      return;
    }
    if (!form.selectedType) return;
    void form.handleUpload(file, `${date}T00:00:00`, { treatmentId });
  };

  const saveLabel = uploading
    ? `Subiendo ${form.preUpload?.progress ?? 0} %…`
    : reading
      ? "La IA está leyendo…"
      : "Guardar documento";

  const aiBanner =
    !uploading && !reading && result?.type ? (
      <View style={[styles.banner, { backgroundColor: t.accent.aiBg }]}>
        <Sparkles size={18} color={t.accent.aiFg} />
        <View style={styles.copy}>
          <Text style={[styles.bannerTitle, { color: t.accent.aiFg }]}>{`La IA lo clasificó como ${typeName ?? result.type.name}`}</Text>
          <Text style={[styles.meta, { color: t.accent.aiFg }]}>Revisa los datos marcados antes de guardar.</Text>
        </View>
      </View>
    ) : !uploading && !reading && form.aiFailed ? (
      <View style={[styles.banner, { backgroundColor: t.surface.muted }]}>
        <Sparkles size={18} color={t.text.onMuted} />
        <View style={styles.copy}>
          <Text style={[styles.bannerTitle, { color: t.text.primary }]}>La IA no pudo leer este archivo</Text>
          <Text style={styles.meta}>Completa los datos tú; puedes guardarlo igual.</Text>
        </View>
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title="Subir archivo" onBack={() => (dirty ? setAskDiscard(true) : leave())} />
      {file ? (
        <>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <DocumentFileCard
                name={file.name}
                mimeType={file.mimeType}
                size={file.size}
                actionLabel="Cambiar"
                onAction={() => void pick()}
                progress={uploading ? form.preUpload?.progress ?? 0 : null}
                aiNote={uploading ? "Subiendo… después la IA lee el documento (unos 10 s)." : reading ? "La IA está leyendo el documento…" : null}
                banner={aiBanner}
              />
              <DocumentFields
                values={values}
                onChange={change}
                types={form.catalogs.types}
                treatments={treatments}
                tagCategories={form.catalogs.tags}
                onAddTagValue={(categoryId, value) => form.handleAddCustomTag(categoryId, value)}
                addingTagCategoryId={form.addingTag}
                aiFilled={{
                  title: !!result?.title && result.title === form.title,
                  type: !!result?.type && result.type.id === form.selectedType,
                  subtype: !!form.selectedSubtype && !!result?.subtypes?.some((s) => s.id === form.selectedSubtype),
                  specialty: !!result?.specialties?.[0] && result.specialties[0].id === form.selectedSpecialty,
                }}
                titleError={titleError}
                typeError={typeError}
                onTitleBlur={() => setTitleTouched(true)}
                titleRef={titleRef}
                loading={uploading || reading}
              />
            </ScrollView>
          </KeyboardAvoidingView>
          <BottomActionBar
            primary={{
              label: saveLabel,
              onPress: save,
              loading: form.uploading,
              loadingLabel: "Guardando…",
              disabled: uploading || reading || form.uploading,
            }}
          />
        </>
      ) : (
        // While the system picker is up, and if it could not open: one clear way to choose the file.
        <View style={styles.waiting}>
          <IconTile tone="document" size="lg" round icon={<FileUp size={24} strokeWidth={2.2} color={t.accent.docFg} />} />
          <Text style={styles.waitTitle}>Elige un PDF o una imagen</Text>
          <Text style={[styles.meta, { textAlign: "center" }]}>{`Hasta ${MAX_UPLOAD_MB} MB. La IA lo ordena por ti.`}</Text>
          <Button onPress={() => void pick()}>Elegir archivo</Button>
        </View>
      )}

      {askDiscard ? (
        <DiscardChangesDialog
          onKeep={() => setAskDiscard(false)}
          onDiscard={() => {
            setAskDiscard(false);
            leave();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[10] },
    waiting: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[3], padding: spacing[6] },
    waitTitle: { fontSize: 17, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    card: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: radii.card,
      borderWidth: 1,
      borderBottomWidth: 4,
      padding: spacing[4],
      gap: spacing[3],
    },
    fileRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    fileName: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
    meta: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    percent: { fontSize: 14, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    link: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.brand.text, paddingVertical: 12, paddingLeft: 8 },
    track: { height: 8, borderRadius: 4, backgroundColor: t.brand.tint, overflow: "hidden" },
    fill: { height: 8, borderRadius: 4, backgroundColor: t.brand.solid },
    aiNote: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    banner: { flexDirection: "row", alignItems: "flex-start", gap: spacing[3], padding: spacing[3], borderRadius: 14 },
    bannerTitle: { fontSize: 14, fontFamily: nativeFont("heading", 800) },
  });
}
