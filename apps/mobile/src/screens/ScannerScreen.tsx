import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { X, Check, RefreshCw } from "lucide-react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useDocumentForm, type FileSource } from "../hooks/useDocumentForm";
import { DocumentClassificationForm } from "../components/DocumentClassificationForm";

export function ScannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const form = useDocumentForm();

  useEffect(() => {
    if (photoUri && !form.title) {
      form.setTitle(`Escaneo ${new Date().toLocaleDateString()}`);
    }
  }, [photoUri]);

  async function handleRequestPermission() {
    if (!permission) {
      Alert.alert("Error", "El sistema de permisos no está listo.");
      return;
    }

    if (!permission.canAskAgain && permission.status === "denied") {
      Alert.alert(
        "Cámara Bloqueada",
        "El acceso a la cámara está desactivado en la configuración de tu celular. ¿Quieres ir a activarlo?",
        [
          { text: "No", style: "cancel" },
          { text: "Sí, abrir ajustes", onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    try {
      const response = await requestPermission();
      if (!response.granted) {
        if (!response.canAskAgain) {
          Alert.alert(
            "Permiso necesario",
            "Para usar la cámara, debes activarla en los ajustes del sistema.",
            [
              { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
              { text: "Cerrar" },
            ]
          );
        } else {
          Alert.alert("Aviso", "Necesitamos el permiso para poder escanear tus documentos.");
        }
      }
    } catch (err) {
      console.error("Error in handleRequestPermission:", err);
      Alert.alert("Error técnico", "No pudimos solicitar el permiso: " + String(err));
    }
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0ea5e9" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Necesitamos permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.btn} onPress={handleRequestPermission}>
          <Text style={styles.btnText}>
            {!permission.canAskAgain && permission.status === "denied"
              ? "Abrir ajustes"
              : "Conceder permiso"}
          </Text>
        </TouchableOpacity>
        {!permission.canAskAgain && (
          <Text style={styles.helper}>
            Parece que el permiso fue denegado permanentemente. Ve a los ajustes del dispositivo y
            habilita la cámara para esta app.
          </Text>
        )}
      </View>
    );
  }

  async function takePicture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo) setPhotoUri(photo.uri);
  }

  // ── Photo captured: preview + classification ──
  if (photoUri) {
    const fileSource: FileSource = {
      uri: photoUri,
      name: `scan-${Date.now()}.jpg`,
      mimeType: "image/jpeg",
    };

    return (
      <View style={styles.container}>
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.previewContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="contain" />
          </View>
          <DocumentClassificationForm file={fileSource} {...form} />
        </ScrollView>

        <View style={styles.previewControls}>
          <TouchableOpacity
            style={styles.circleBtnRed}
            onPress={() => setPhotoUri(null)}
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

  // ── Camera view ──
  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" ref={cameraRef} />

      <View style={styles.overlay}>
        <View style={styles.cameraHeader}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.cameraControls}>
          <View style={{ width: 64 }} />
          <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchBtn}>
            <RefreshCw color="#fff" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 24,
  },
  text: { fontSize: 16, color: "#334155", textAlign: "center", marginBottom: 16 },
  btn: { backgroundColor: "#0ea5e9", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: "#fff", fontWeight: "600" },
  helper: { marginTop: 16, fontSize: 13, color: "#64728b", textAlign: "center", lineHeight: 18 },

  container: { flex: 1, backgroundColor: "#000" },
  overlay: { flex: 1, justifyContent: "space-between" },
  cameraHeader: { padding: 24, paddingTop: 48, alignItems: "flex-start" },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraControls: {
    flexDirection: "row",
    padding: 32,
    paddingBottom: 48,
    justifyContent: "space-between",
    alignItems: "center",
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtnInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#fff" },
  switchBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  previewContainer: {
    height: 450,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: { width: "100%", height: "100%" },

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
