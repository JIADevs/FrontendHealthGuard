import { useState, useCallback, useMemo } from "react";
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
  KeyboardAvoidingView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";

import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  X,
  Check,
  FileUp,
  FileText as FileTextIcon,
  ImageIcon,
  Link2,
} from "lucide-react-native";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { DocumentKind } from "@helu/api";
import { useDocumentForm, type FileSource } from "../hooks/useDocumentForm";
import { useTreatmentsQuery } from "@helu/api/hooks";
import type { Treatment } from "@helu/api";
import { useKeyboardScrollPadding } from "../hooks/useKeyboardScrollPadding";
import { DocumentClassificationForm } from "../components/DocumentClassificationForm";
import { DocumentPortalForm } from "../components/documents";
import { colors, radii, spacing, fontSize, fontWeight, useAppTheme, Typography } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

function isImageMime(mime: string) {
  return mime.startsWith("image/");
}

function friendlySize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploadScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const params = (route.params ?? {}) as RootStackParamList["DocumentUpload"];
  const initialKind: DocumentKind = params?.initialKind === "LINK" ? "LINK" : "FILE";
  const form = useDocumentForm({
    backpackId: params?.backpackId,
    backpackName: params?.backpackName,
  });
  const treatmentsQuery = useTreatmentsQuery(1, 100);
  const treatments = treatmentsQuery.data?.items ?? [];
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = useKeyboardScrollPadding(spacing[4]);

  const [pickerAsset, setPickerAsset] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [treatmentId, setTreatmentId] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState("");
  const [portalUsername, setPortalUsername] = useState("");
  const [portalPassword, setPortalPassword] = useState("");

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ACCEPTED_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const picked = result.assets[0];
      setPickerAsset(picked);
      form.setTitle(
        picked.name?.replace(/\.[^.]+$/, "") ?? `Documento ${new Date().toLocaleDateString()}`
      );
    } catch (err) {
      console.warn("Error picking document", err);
      Alert.alert("Error", "No se pudo seleccionar el archivo.");
    }
  }, [form]);

  const treatmentSection =
    treatments.length > 0 ? (
      <View style={styles.treatmentSection}>
        <Text style={styles.treatmentLabel}>Tratamiento</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.treatmentChips}
        >
          {treatments.map((treatment: Treatment) => {
            const selected = treatmentId === treatment.id;
            return (
              <TouchableOpacity
                key={treatment.id}
                style={[
                  styles.treatmentChip,
                  {
                    borderColor: selected ? t.brand.fg : t.border.medium,
                    backgroundColor: selected ? t.brand.tint : t.surface.bgCard,
                  },
                ]}
                onPress={() => setTreatmentId(selected ? null : treatment.id)}
              >
                <Text
                  style={[
                    styles.treatmentChipText,
                    { color: selected ? t.brand.fg : t.text.secondary },
                  ]}
                  numberOfLines={1}
                >
                  {treatment.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    ) : null;

  if (initialKind === "LINK") {
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 72 : 0}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
            bounces
          >
            <View style={styles.linkHero}>
              <View style={styles.linkIconBg}>
                <Link2 color={t.brand.fg} size={48} />
              </View>
              <Typography variant="h2">Resultado de examen virtual</Typography>
              <Typography variant="body" color="secondary" align="center">
                Ingresá el enlace al portal de resultados
              </Typography>
            </View>

            <DocumentPortalForm
              portalUrl={portalUrl}
              portalUsername={portalUsername}
              portalPassword={portalPassword}
              onPortalUrlChange={setPortalUrl}
              onPortalUsernameChange={setPortalUsername}
              onPortalPasswordChange={setPortalPassword}
              disabled={form.uploading}
            />

            <DocumentClassificationForm
              {...form}
              variant="upload"
              showAiClassify={false}
              formTitle="Datos del documento"
            />

            {treatmentSection}
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={[styles.previewControls, { paddingBottom: spacing[5] + insets.bottom }]}>
          <TouchableOpacity
            style={styles.circleBtnRed}
            onPress={() => navigation.goBack()}
            disabled={form.uploading}
          >
            <X color={colors.white} size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.circleBtnGreen}
            onPress={() => {
              void form.handleCreateLink({
                portalUrl,
                portalUsername,
                portalPassword,
                treatmentId,
              });
            }}
            disabled={form.uploading}
          >
            {form.uploading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Check color={colors.white} size={28} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!pickerAsset) {
    return (
      <View style={styles.pickerScreen}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <X color={t.text.secondary} size={24} />
        </TouchableOpacity>

        <View style={styles.pickerContent}>
          <View style={styles.pickerIconBg}>
            <FileUp color={t.brand.fg} size={48} />
          </View>
          <Typography variant="h2">Subir archivo</Typography>
          <Typography variant="body" color="secondary" align="center">
            Seleccioná un PDF o imagen desde tu dispositivo
          </Typography>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => void pickDocument()}>
            <Text style={styles.pickerBtnText}>Elegir archivo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isImage = isImageMime(pickerAsset.mimeType || "");
  const fileSource: FileSource = {
    uri: pickerAsset.uri,
    name: pickerAsset.name || `upload-${Date.now()}`,
    mimeType: pickerAsset.mimeType || "application/octet-stream",
    size: pickerAsset.size ?? undefined,
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 72 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          bounces
        >
          <View style={styles.previewContainer}>
            {isImage ? (
              <Image
                source={{ uri: pickerAsset.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.pdfPreview}>
                <FileTextIcon color={t.brand.fg} size={64} />
                <Typography variant="label" numberOfLines={2} align="center">
                  {pickerAsset.name}
                </Typography>
                {pickerAsset.size != null && (
                  <Typography variant="caption" color="secondary">
                    {friendlySize(pickerAsset.size)}
                  </Typography>
                )}
              </View>
            )}
          </View>

          <View style={styles.fileInfoBar}>
            {isImage ? (
              <ImageIcon color={t.text.secondary} size={16} />
            ) : (
              <FileTextIcon color={t.text.secondary} size={16} />
            )}
            <Text style={styles.fileInfoText} numberOfLines={1}>{pickerAsset.name}</Text>
            <TouchableOpacity onPress={() => void pickDocument()}>
              <Text style={styles.changeFileLink}>Cambiar</Text>
            </TouchableOpacity>
          </View>

          <DocumentClassificationForm file={fileSource} {...form} />

          {treatmentSection}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.previewControls, { paddingBottom: spacing[5] + insets.bottom }]}>
        <TouchableOpacity
          style={styles.circleBtnRed}
          onPress={() => navigation.goBack()}
          disabled={form.uploading}
        >
          <X color={colors.white} size={24} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.circleBtnGreen}
          onPress={() => form.handleUpload(fileSource, undefined, { treatmentId })}
          disabled={form.uploading}
        >
          {form.uploading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Check color={colors.white} size={28} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    pickerScreen: { flex: 1, backgroundColor: t.surface.bgCard },
    closeBtn: {
      position: "absolute",
      top: Platform.OS === "ios" ? 56 : 24,
      left: 20,
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: t.border.light,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    pickerContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    pickerIconBg: {
      width: 96,
      height: 96,
      borderRadius: 24,
      backgroundColor: t.brand.tintMed,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing[6],
    },
    pickerBtn: {
      backgroundColor: t.brand.fg,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 14,
      marginTop: spacing[6],
    },
    pickerBtnText: {
      color: colors.white,
      fontWeight: fontWeight.bold,
      fontSize: fontSize.md,
    },
    linkHero: {
      alignItems: "center",
      paddingHorizontal: spacing[5],
      paddingTop: spacing[10],
      paddingBottom: spacing[4],
      gap: spacing[2],
      backgroundColor: t.surface.bgCard,
    },
    linkIconBg: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: t.brand.tintMed,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing[2],
    },
    container: { flex: 1, backgroundColor: t.surface.bg },
    scroll: { flex: 1, backgroundColor: t.surface.bgCard },
    scrollContent: { backgroundColor: t.surface.bgCard },
    previewContainer: {
      height: 350,
      backgroundColor: t.surface.bg,
      justifyContent: "center",
      alignItems: "center",
    },
    previewImage: { width: "100%", height: "100%" },
    pdfPreview: {
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[3],
      padding: spacing[6],
    },
    fileInfoBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      backgroundColor: t.surface.bgCard,
      paddingHorizontal: spacing[5],
      paddingVertical: spacing[3],
    },
    fileInfoText: {
      flex: 1,
      fontSize: fontSize.sm,
      color: t.text.primary,
      fontWeight: fontWeight.medium,
    },
    changeFileLink: {
      fontSize: fontSize.sm,
      color: t.brand.fg,
      fontWeight: fontWeight.semibold,
    },
    treatmentSection: {
      paddingHorizontal: spacing[5],
      paddingVertical: spacing[4],
      gap: spacing[2],
    },
    treatmentLabel: {
      color: t.text.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    treatmentChips: { gap: spacing[2], paddingRight: spacing[2] },
    treatmentChip: {
      maxWidth: 180,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: radii.full,
      borderWidth: 1,
    },
    treatmentChipText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
    previewControls: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 32,
      backgroundColor: t.surface.bgCard,
      paddingTop: spacing[3],
      borderTopWidth: 1,
      borderTopColor: t.border.light,
    },
    circleBtnRed: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: t.status.errorFg,
      alignItems: "center",
      justifyContent: "center",
    },
    circleBtnGreen: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: t.status.successFg,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
