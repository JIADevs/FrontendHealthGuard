import { useState, useEffect, useCallback } from "react";
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
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
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
import { DocumentClassificationForm } from "../components/DocumentClassificationForm";

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const form = useDocumentForm();

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

  // ── No file selected: show picker prompt ──
  if (!pickerAsset) {
    return (
      <View style={styles.pickerScreen}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <X color="#64748b" size={24} />
        </TouchableOpacity>

        <View style={styles.pickerContent}>
          <View style={styles.pickerIconBg}>
            <FileUp color="#0ea5e9" size={48} />
          </View>
          <Text style={styles.pickerTitle}>Subir Documento</Text>
          <Text style={styles.pickerSubtitle}>
            Seleccioná un PDF o imagen desde tu dispositivo
          </Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={pickDocument}>
            <Text style={styles.pickerBtnText}>Elegir archivo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── File selected: preview + classification form ──
  const isImage = isImageMime(pickerAsset.mimeType || "");
  const fileSource: FileSource = {
    uri: pickerAsset.uri,
    name: pickerAsset.name || `upload-${Date.now()}`,
    mimeType: pickerAsset.mimeType || "application/octet-stream",
    size: pickerAsset.size ?? undefined,
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        {/* Preview */}
        <View style={styles.previewContainer}>
          {isImage ? (
            <Image
              source={{ uri: pickerAsset.uri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.pdfPreview}>
              <FileTextIcon color="#0ea5e9" size={64} />
              <Text style={styles.pdfName} numberOfLines={2}>
                {pickerAsset.name}
              </Text>
              {pickerAsset.size != null && (
                <Text style={styles.pdfSize}>{friendlySize(pickerAsset.size)}</Text>
              )}
            </View>
          )}
        </View>

        {/* File info bar */}
        <View style={styles.fileInfoBar}>
          {isImage ? (
            <ImageIcon color="#64748b" size={16} />
          ) : (
            <FileTextIcon color="#64748b" size={16} />
          )}
          <Text style={styles.fileInfoText} numberOfLines={1}>
            {pickerAsset.name}
          </Text>
          <TouchableOpacity onPress={pickDocument}>
            <Text style={styles.changeFileLink}>Cambiar</Text>
          </TouchableOpacity>
        </View>

        <DocumentClassificationForm file={fileSource} {...form} />
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.previewControls}>
        <TouchableOpacity
          style={styles.circleBtnRed}
          onPress={() => navigation.goBack()}
          disabled={form.uploading}
        >
          <X color="#fff" size={24} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.circleBtnGreen}
          onPress={() => form.handleUpload(fileSource)}
          disabled={form.uploading}
        >
          {form.uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Check color="#fff" size={32} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerScreen: { flex: 1, backgroundColor: "#fff" },
  closeBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 24,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f1f5f9",
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
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  pickerTitle: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  pickerSubtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  pickerBtn: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  pickerBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  container: { flex: 1, backgroundColor: "#000" },

  previewContainer: {
    height: 350,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: { width: "100%", height: "100%" },
  pdfPreview: { alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  pdfName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    textAlign: "center",
    maxWidth: 260,
  },
  pdfSize: { fontSize: 13, color: "#64748b" },

  fileInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  fileInfoText: { flex: 1, fontSize: 13, color: "#334155", fontWeight: "500" },
  changeFileLink: { fontSize: 13, color: "#0ea5e9", fontWeight: "600" },

  previewControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    paddingBottom: 48,
    backgroundColor: "#fff",
    paddingTop: 12,
  },
  circleBtnRed: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  circleBtnGreen: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },
});
