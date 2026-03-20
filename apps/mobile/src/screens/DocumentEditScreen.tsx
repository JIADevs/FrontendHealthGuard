import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { FileUp, FileText as FileTextIcon, Check, X as XIcon } from "lucide-react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { DocumentClassificationForm } from "../components/DocumentClassificationForm";
import { useDocumentForm, type FileSource } from "../hooks/useDocumentForm";
import {
  getDocumentById,
  getSignedUrl,
  updateDocument,
  uploadFileFromUri,
  isApiError,
  type DocumentCreate,
  type Document,
} from "@healthguard/api";
import { colors, radii, spacing, fontSize, fontWeight, useAppTheme } from "@healthguard/ui";
import type { ThemeContextValue } from "@healthguard/ui";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

function isImageMime(mime: string) {
  return mime.toLowerCase().startsWith("image/");
}

function friendlySize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type RouteParams = { id: string };

export function DocumentEditScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { id } = (route.params ?? {}) as RouteParams;

  const form = useDocumentForm();

  const docQuery = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocumentById(id),
    enabled: !!id,
  });

  const signedUrlQuery = useQuery({
    queryKey: ["signed-url", (docQuery.data as Document | undefined)?.fileUrl],
    queryFn: () => getSignedUrl((docQuery.data as Document).fileUrl),
    enabled: !!(docQuery.data as Document | undefined)?.fileUrl,
  });

  const [replacementFile, setReplacementFile] = useState<FileSource | null>(null);
  const [saving, setSaving] = useState(false);
  const didInitRef = useRef(false);

  const currentMimeType = replacementFile?.mimeType ?? (docQuery.data as Document | undefined)?.format ?? "";
  const currentIsImage = isImageMime(currentMimeType);
  const signedUrl = signedUrlQuery.data?.url;

  useEffect(() => {
    if (!docQuery.data || didInitRef.current) return;
    didInitRef.current = true;
    const d = docQuery.data as Document;
    form.setTitle(d.title);
    form.setSelectedType(d.documentType?.id);
    form.setSelectedSpecialty(d.specialties?.[0]?.id);
    form.setSelectedTags(d.customTags?.map((t) => t.id) ?? []);
  }, [docQuery.data]);

  const pickReplacementFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ACCEPTED_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const picked = result.assets[0];
      const file: FileSource = {
        uri: picked.uri,
        name: picked.name || `upload-${Date.now()}`,
        mimeType: picked.mimeType || "application/octet-stream",
        size: picked.size ?? undefined,
      };

      if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
        Alert.alert("Archivo demasiado grande", `El tamaño máximo permitido es 25 MB. Tu archivo pesa ${friendlySize(file.size)}.`);
        return;
      }

      setReplacementFile(file);
    } catch (err) {
      console.warn("Error picking replacement file", err);
      Alert.alert("Error", "No se pudo seleccionar el archivo.");
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!docQuery.data || saving) return;

    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      Alert.alert("Título requerido", "El título del documento no puede estar vacío.");
      return;
    }

    setSaving(true);
    try {
      const d = docQuery.data as Document;
      let fileUrl = d.fileUrl;
      let format = d.format;
      let file_size_bytes: number | undefined = d.fileSizeBytes ?? undefined;

      if (replacementFile) {
        if (replacementFile.size && replacementFile.size > MAX_FILE_SIZE_BYTES) {
          Alert.alert("Archivo demasiado grande", `El tamaño máximo permitido es 25 MB. Tu archivo pesa ${friendlySize(replacementFile.size)}.`);
          setSaving(false);
          return;
        }
        const uploaded = await uploadFileFromUri(replacementFile.uri, replacementFile.name, replacementFile.mimeType);
        fileUrl = uploaded.storagePath;
        format = replacementFile.mimeType;
        file_size_bytes = replacementFile.size ?? undefined;
      }

      const payload: DocumentCreate = {
        title: trimmedTitle,
        description: d.description ?? undefined,
        fileUrl,
        format,
        file_size_bytes,
        documentDate: d.documentDate ?? undefined,
        treatmentId: d.treatmentId ?? undefined,
        typeId: form.selectedType,
        subtypeIds: [],
        specialtyIds: form.selectedSpecialty ? [form.selectedSpecialty] : [],
        tagValueIds: form.selectedTags,
      };

      await updateDocument(id, payload);
      queryClient.invalidateQueries({ queryKey: ["documents"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      Toast.show({ type: "success", text1: "Cambios guardados", text2: trimmedTitle });
      navigation.goBack();
    } catch (err) {
      console.warn("Error saving document", err);
      const message = isApiError(err)
        ? err.fieldErrors
          ? Object.entries(err.fieldErrors).map(([f, m]) => `${f}: ${m}`).join("\n")
          : err.message
        : "No se pudo guardar el documento.";
      Toast.show({ type: "error", text1: "No se pudieron guardar los cambios", text2: message });
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  }, [docQuery.data, saving, form, replacementFile, id, queryClient, navigation]);

  if (!id) {
    return (
      <View style={styles.center}><Text style={styles.error}>Documento no encontrado.</Text></View>
    );
  }

  if (docQuery.isLoading && !docQuery.isRefetching) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color={colors.sky[500]} /></View>
    );
  }

  const d = docQuery.data as Document | undefined;

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <View style={styles.previewContainer}>
          {replacementFile ? (
            currentIsImage ? (
              <Image source={{ uri: replacementFile.uri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.pdfPreview}>
                <FileTextIcon color={colors.sky[500]} size={64} />
                <Text style={styles.pdfName} numberOfLines={2}>{replacementFile.name}</Text>
                {replacementFile.size != null && <Text style={styles.pdfSize}>{friendlySize(replacementFile.size)}</Text>}
              </View>
            )
          ) : d ? (
            currentIsImage && signedUrl ? (
              <Image source={{ uri: signedUrl }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.pdfPreview}>
                <FileTextIcon color={colors.sky[500]} size={64} />
                <Text style={styles.pdfName} numberOfLines={2}>Adjunto actual</Text>
                <Text style={styles.pdfSize}>{d.format}</Text>
              </View>
            )
          ) : null}
        </View>

        <View style={styles.fileInfoBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fileInfoTitle} numberOfLines={1}>{replacementFile ? "Nuevo adjunto" : "Adjunto actual"}</Text>
            <Text style={styles.fileInfoSub} numberOfLines={1}>{replacementFile ? replacementFile.name : d?.format ?? ""}</Text>
          </View>
          <TouchableOpacity style={styles.changeFileBtn} onPress={pickReplacementFile} accessibilityRole="button" accessibilityLabel="Reemplazar adjunto">
            <FileUp size={16} color={colors.white} />
            <Text style={styles.changeFileBtnText}>Cambiar</Text>
          </TouchableOpacity>
        </View>

        {replacementFile && (
          <TouchableOpacity style={styles.clearReplacementLink} onPress={() => setReplacementFile(null)} accessibilityRole="button" accessibilityLabel="Cancelar reemplazo">
            <Text style={styles.clearReplacementText}>Restaurar adjunto actual</Text>
          </TouchableOpacity>
        )}

        <DocumentClassificationForm file={replacementFile ?? undefined} {...form} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.circleBtnSecondary} onPress={() => navigation.goBack()} disabled={saving} accessibilityRole="button" accessibilityLabel="Cancelar edición">
          <XIcon color={colors.white} size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.circleBtnPrimary, saving && styles.circleBtnPrimaryDisabled]} onPress={handleSave} disabled={saving} accessibilityRole="button" accessibilityLabel="Guardar cambios">
          {saving ? <ActivityIndicator color={colors.white} /> : <Check color={colors.white} size={32} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:        { flex: 1, backgroundColor: t.surface.bgCard },
    center:           { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing[6], backgroundColor: t.surface.bgCard },
    error:            { color: colors.error[500], fontSize: fontSize.md, fontWeight: fontWeight.bold },
    content:          { paddingBottom: 96 },
    previewContainer: { height: 360, backgroundColor: t.surface.bg, justifyContent: "center", alignItems: "center" },
    previewImage:     { width: "100%", height: "100%" },
    pdfPreview:       { alignItems: "center", justifyContent: "center", gap: spacing[3], padding: spacing[5] },
    pdfName:          { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: t.text.primary, textAlign: "center", maxWidth: 320 },
    pdfSize:          { fontSize: fontSize.sm, color: t.text.secondary, textAlign: "center" },
    fileInfoBar:      { flexDirection: "row", alignItems: "center", gap: spacing[3], backgroundColor: t.surface.bgCard, paddingHorizontal: spacing[5], paddingVertical: spacing[3] },
    fileInfoTitle:    { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: t.text.primary },
    fileInfoSub:      { fontSize: fontSize.sm, color: t.text.secondary, marginTop: 2 },
    changeFileBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing[2], paddingHorizontal: 14, height: 40, borderRadius: radii.md, backgroundColor: colors.sky[500] },
    changeFileBtnText:    { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
    clearReplacementLink: { paddingHorizontal: spacing[5], paddingBottom: 10 },
    clearReplacementText: { color: t.text.secondary, fontWeight: fontWeight.semibold },
    bottomBar: {
      position: "absolute",
      bottom: Platform.OS === "ios" ? 32 : 16,
      left: 20,
      right: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing[5],
    },
    circleBtnSecondary:      { width: 64, height: 64, borderRadius: 32, backgroundColor: t.border.medium, alignItems: "center", justifyContent: "center" },
    circleBtnPrimary:        { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.sky[500], alignItems: "center", justifyContent: "center", shadowColor: colors.sky[500], shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
    circleBtnPrimaryDisabled: { opacity: 0.6 },
  });
}
