import { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  X,
  Check,
  FileUp,
  FileText as FileTextIcon,
  ImageIcon,
} from "lucide-react-native";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useDocumentForm, type FileSource } from "../hooks/useDocumentForm";
import { useKeyboardScrollPadding } from "../hooks/useKeyboardScrollPadding";
import { DocumentClassificationForm } from "../components/DocumentClassificationForm";
import { colors, palette, radii, spacing, fontSize, fontWeight, useAppTheme, Typography } from "@helu/ui";
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
  const form = useDocumentForm({
    backpackId: params?.backpackId,
    backpackName: params?.backpackName,
  });
  const scrollPaddingBottom = useKeyboardScrollPadding(120);

  const [pickerAsset, setPickerAsset] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ACCEPTED_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        if (!pickerAsset) navigation.goBack();
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
      if (!pickerAsset) navigation.goBack();
    }
  }, [pickerAsset, navigation, form]);

  useEffect(() => {
    pickDocument();
  }, []);

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
          <Typography variant="h2">Subir Documento</Typography>
          <Typography variant="body" color="secondary" align="center">
            Seleccioná un PDF o imagen desde tu dispositivo
          </Typography>
          <TouchableOpacity style={styles.pickerBtn} onPress={pickDocument}>
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
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.previewContainer}>
          {isImage ? (
            <Image source={{ uri: pickerAsset.uri }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <View style={styles.pdfPreview}>
              <FileTextIcon color={t.brand.fg} size={64} />
              <Typography variant="label" numberOfLines={2} align="center">{pickerAsset.name}</Typography>
              {pickerAsset.size != null && (
                <Typography variant="caption" color="secondary">{friendlySize(pickerAsset.size)}</Typography>
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
          <TouchableOpacity onPress={pickDocument}>
            <Text style={styles.changeFileLink}>Cambiar</Text>
          </TouchableOpacity>
        </View>

        <DocumentClassificationForm file={fileSource} {...form} />
      </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.previewControls}>
        <TouchableOpacity style={styles.circleBtnRed} onPress={() => navigation.goBack()} disabled={form.uploading}>
          <X color={colors.white} size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleBtnGreen} onPress={() => form.handleUpload(fileSource)} disabled={form.uploading}>
          {form.uploading ? <ActivityIndicator color={colors.white} /> : <Check color={colors.white} size={28} />}
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
    pickerContent:  { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
    pickerIconBg:   { width: 96, height: 96, borderRadius: 24, backgroundColor: t.brand.tintMed, alignItems: "center", justifyContent: "center", marginBottom: spacing[6] },
    pickerTitle:    { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: t.text.primary, marginBottom: spacing[2] },
    pickerSubtitle: { fontSize: fontSize.base, color: t.text.secondary, textAlign: "center", marginBottom: 32, lineHeight: 22 },
    pickerBtn:      { backgroundColor: t.brand.fg, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
    pickerBtnText:  { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.md },

    container:        { flex: 1, backgroundColor: colors.black },
    previewContainer: { height: 350, backgroundColor: t.surface.bg, justifyContent: "center", alignItems: "center" },
    previewImage:     { width: "100%", height: "100%" },
    pdfPreview:       { alignItems: "center", justifyContent: "center", gap: spacing[3], padding: spacing[6] },
    pdfName:          { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: t.text.primary, textAlign: "center", maxWidth: 260 },
    pdfSize:          { fontSize: fontSize.sm, color: t.text.secondary },

    fileInfoBar:    { flexDirection: "row", alignItems: "center", gap: spacing[2], backgroundColor: t.surface.bgCard, paddingHorizontal: spacing[5], paddingVertical: spacing[3] },
    fileInfoText:   { flex: 1, fontSize: fontSize.sm, color: t.text.primary, fontWeight: fontWeight.medium },
    changeFileLink: { fontSize: fontSize.sm, color: t.brand.fg, fontWeight: fontWeight.semibold },

    previewControls: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 32, paddingBottom: 48, backgroundColor: t.surface.bgCard, paddingTop: spacing[3] },
    circleBtnRed:    { width: 72, height: 72, borderRadius: 36, backgroundColor: t.status.errorFg, alignItems: "center", justifyContent: "center" },
    circleBtnGreen:  { width: 72, height: 72, borderRadius: 36, backgroundColor: t.status.successFg, alignItems: "center", justifyContent: "center" },
  });
}
