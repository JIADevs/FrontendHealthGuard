import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { Link2 } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useDocumentQuery, useTreatmentsQuery } from "@helu/api/hooks";
import { isApiError, updateDocument, type Document, type DocumentCreate } from "@helu/api";
import {
  BottomActionBar,
  Button,
  DiscardChangesDialog,
  Skeleton,
  SkeletonGroup,
  TextField,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import type { SubscribeBeforeLeave } from "../agenda/AppointmentForm";
import { useDocumentForm, type FileSource } from "../../hooks/useDocumentForm";
import { notify } from "../../lib/notify";
import { useRecentlySaved } from "../../lib/recentlySaved";
import { DocumentFields, type DocumentFieldValues } from "./DocumentFields";
import { DocumentFileCard, MAX_UPLOAD_MB, friendlySize } from "./DocumentUpload";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

function fileNameOf(doc: Document): string {
  const last = (doc.fileUrl ?? "").split("/").pop() ?? "";
  // Stored as «<uuid>_<name>»: show the name the person uploaded.
  return last.replace(/^[0-9a-f-]{36}_/i, "") || doc.title;
}

function dayKey(doc: Document): string {
  const raw = doc.documentDate ?? doc.uploadedAt;
  return raw.slice(0, 10);
}

function validUrl(value: string): boolean {
  return /^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(value.trim());
}

export interface DocumentEditProps {
  id: string;
  onClose: () => void;
  subscribeBeforeLeave: SubscribeBeforeLeave;
}

/**
 * Mockup «Editar documento»: «Adjunto actual» with «Reemplazar», the same fields as when uploading,
 * and the fixed «Guardar cambios» bar. Leaving with changes asks «¿Descartar los cambios?». Portal
 * links edit the URL and the user or code; a saved password stays as it is.
 */
export function DocumentEdit({ id, onClose, subscribeBeforeLeave }: DocumentEditProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const queryClient = useQueryClient();
  const docQuery = useDocumentQuery(id);
  const doc = docQuery.data as Document | undefined;
  const form = useDocumentForm({ skipNavigateBackOnUpload: true });
  const treatments = useTreatmentsQuery(1, 100).data?.items ?? [];
  const isLink = doc?.kind === "LINK";

  const [date, setDate] = useState("");
  const [treatmentId, setTreatmentId] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState("");
  const [portalUser, setPortalUser] = useState("");
  const [replacement, setReplacement] = useState<FileSource | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const titleRef = useRef<ComponentRef<typeof TextInput>>(null);
  const baseline = useRef<string | null>(null);

  // Fill the form once with the saved document.
  const loadedId = useRef<string | null>(null);
  useEffect(() => {
    if (!doc || loadedId.current === doc.id) return;
    loadedId.current = doc.id;
    form.setTitle(doc.title);
    form.setDescription(doc.description ?? "");
    form.setSelectedType(doc.documentType?.id);
    form.setSelectedSpecialty(doc.specialties?.[0]?.id);
    form.setSelectedTags(doc.customTags.map((tag) => tag.id));
    setDate(dayKey(doc));
    setTreatmentId(doc.treatmentId ?? null);
    setPortalUrl(doc.portalUrl ?? "");
    setPortalUser(doc.portalUsername ?? "");
    baseline.current = null;
  }, [doc, form]);

  const snapshot = JSON.stringify([
    form.title,
    form.description,
    form.selectedType,
    form.selectedSpecialty,
    [...form.selectedTags].sort(),
    date,
    treatmentId,
    portalUrl,
    portalUser,
    replacement?.uri ?? null,
  ]);
  if (doc && loadedId.current === doc.id && baseline.current === null && date) baseline.current = snapshot;
  const dirty = baseline.current !== null && snapshot !== baseline.current;

  // ── Leaving: «¿Descartar los cambios?» (formularios.md §7) ──
  const allowLeave = useRef(false);
  const [askDiscard, setAskDiscard] = useState(false);
  const leave = useCallback(() => {
    allowLeave.current = true;
    onClose();
  }, [onClose]);
  useEffect(
    () =>
      subscribeBeforeLeave((prevent) => {
        if (!dirty || allowLeave.current) return;
        prevent();
        setAskDiscard(true);
      }),
    [subscribeBeforeLeave, dirty],
  );

  const replace = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ACCEPTED_TYPES, copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0]!;
      if (asset.size != null && asset.size > MAX_UPLOAD_MB * 1024 * 1024) {
        notify({ tone: "error", message: "Archivo demasiado grande", description: `El máximo es ${MAX_UPLOAD_MB} MB y este pesa ${friendlySize(asset.size)}.` });
        return;
      }
      const picked: FileSource = {
        uri: asset.uri,
        name: asset.name || `documento-${Date.now()}`,
        mimeType: asset.mimeType || "application/octet-stream",
        size: asset.size ?? undefined,
      };
      setReplacement(picked);
      form.startPreUpload(picked);
    } catch (err) {
      console.warn("[DocumentEdit] picker failed", err);
      notify({ tone: "error", message: "No se pudo abrir el archivo", description: "Intenta con otro archivo." });
    }
  };

  const titleError = submitted && !form.title.trim() ? "Escribe un título para el documento." : undefined;
  const urlError = isLink && submitted && !validUrl(portalUrl) ? "Revisa la dirección: debe empezar por https://" : undefined;
  const uploading = replacement !== null && form.preUpload != null && !form.preUpload.done && !form.preUpload.failed;

  const save = async () => {
    setSubmitted(true);
    if (!doc) return;
    if (!form.title.trim()) {
      titleRef.current?.focus();
      return;
    }
    if (isLink && !validUrl(portalUrl)) return;
    setSaving(true);
    try {
      let fileUrl = doc.fileUrl ?? undefined;
      let format = doc.format ?? undefined;
      let size = doc.fileSizeBytes ?? undefined;
      if (replacement) {
        const uploaded = await form.uploadFile(replacement);
        fileUrl = uploaded.storagePath;
        format = replacement.mimeType;
        size = replacement.size;
      }
      const payload: DocumentCreate = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        kind: doc.kind,
        documentDate: `${date}T00:00:00`,
        treatmentId,
        typeId: form.selectedType,
        subtypeIds: doc.subtypes.map((s) => s.id),
        specialtyIds: form.selectedSpecialty ? [form.selectedSpecialty] : [],
        tagValueIds: form.selectedTags,
        fileUrl,
        format,
        file_size_bytes: size,
        portalUrl: isLink ? portalUrl.trim() : doc.portalUrl ?? undefined,
        portalUsername: isLink ? portalUser.trim() || undefined : doc.portalUsername ?? undefined,
      };
      await updateDocument(id, payload);
      // Fire and forget: the screen closes as soon as the PUT lands; the lists refetch behind it.
      void queryClient.invalidateQueries({ queryKey: ["documents"], exact: false });
      void queryClient.invalidateQueries({ queryKey: ["document", id] });
      void queryClient.invalidateQueries({ queryKey: ["treatments"], exact: false });
      void queryClient.invalidateQueries({ queryKey: ["backpack-docs"], exact: false });
      useRecentlySaved.getState().markDocument(id);
      notify({ message: "Cambios guardados", description: form.title.trim() });
      leave();
    } catch (err) {
      notify({
        tone: "error",
        message: "No se pudo guardar",
        description: isApiError(err) ? "Revisa los datos e intenta de nuevo." : "Revisa tu conexión e intenta de nuevo.",
        action: { label: "Reintentar", onPress: () => void save() },
      });
    } finally {
      setSaving(false);
    }
  };

  const values: DocumentFieldValues = {
    title: form.title,
    typeId: form.selectedType,
    specialtyId: form.selectedSpecialty,
    date,
    treatmentId,
    tagIds: form.selectedTags,
    description: form.description,
  };
  const change = (patch: Partial<DocumentFieldValues>) => {
    if (patch.title !== undefined) form.setTitle(patch.title);
    if ("typeId" in patch) form.setSelectedType(patch.typeId);
    if ("specialtyId" in patch) form.setSelectedSpecialty(patch.specialtyId);
    if (patch.date !== undefined) setDate(patch.date);
    if ("treatmentId" in patch) setTreatmentId(patch.treatmentId ?? null);
    if (patch.tagIds) form.setSelectedTags(patch.tagIds);
    if (patch.description !== undefined) form.setDescription(patch.description);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title="Editar documento" onBack={() => (dirty ? setAskDiscard(true) : leave())} />
      {!doc ? (
        docQuery.isLoading ? (
          <SkeletonGroup label="Cargando el documento" style={styles.content}>
            <Skeleton height={76} radius={18} />
            <Skeleton height={320} radius={18} />
          </SkeletonGroup>
        ) : (
          <View style={styles.centered}>
            <Text style={styles.h3}>No encontramos este documento</Text>
            <Button variant="secondary" onPress={leave}>
              Volver
            </Button>
          </View>
        )
      ) : (
        <>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              {isLink ? (
                <View style={styles.card}>
                  <Text style={styles.lbl}>Portal de resultados</Text>
                  <TextField
                    label="URL del portal"
                    value={portalUrl}
                    onChange={setPortalUrl}
                    autoCapitalize="none"
                    textContentType="URL"
                    leadingIcon={<Link2 size={18} color={t.text.muted} />}
                    error={urlError}
                  />
                  <TextField label="Usuario o código de acceso (opcional)" value={portalUser} onChange={setPortalUser} autoCapitalize="none" />
                </View>
              ) : (
                <View style={styles.group}>
                  <Text style={styles.lbl}>Adjunto actual</Text>
                  <DocumentFileCard
                    name={replacement?.name ?? fileNameOf(doc)}
                    mimeType={replacement?.mimeType ?? doc.format ?? ""}
                    size={replacement?.size ?? doc.fileSizeBytes ?? undefined}
                    actionLabel="Reemplazar"
                    onAction={() => void replace()}
                    progress={uploading ? form.preUpload?.progress ?? 0 : null}
                  />
                </View>
              )}
              <DocumentFields
                values={values}
                onChange={change}
                types={form.catalogs.types}
                treatments={treatments}
                tagCategories={form.catalogs.tags}
                onAddTagValue={(categoryId, value) => form.handleAddCustomTag(categoryId, value)}
                addingTagCategoryId={form.addingTag}
                titleError={titleError}
                titleRef={titleRef}
                loading={form.catalogsLoading}
              />
            </ScrollView>
          </KeyboardAvoidingView>
          <BottomActionBar
            primary={{
              label: uploading ? `Subiendo ${form.preUpload?.progress ?? 0} %…` : "Guardar cambios",
              onPress: () => void save(),
              loading: saving,
              loadingLabel: "Guardando…",
              disabled: saving || uploading,
            }}
          />
        </>
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
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[3], padding: spacing[6] },
    h3: { fontSize: 17, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    group: { gap: spacing[2] },
    lbl: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    card: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: radii.card,
      borderWidth: 1,
      borderBottomWidth: 4,
      padding: spacing[4],
      gap: spacing[4],
    },
  });
}
