import { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { Camera, X, Check, RefreshCw } from "lucide-react-native";

export function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation();

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color="#0ea5e9" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Necesitamos permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function takePicture() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) setPhotoUri(photo.uri);
    }
  }

  function handleUpload() {
    setUploading(true);
    // TODO: Upload the photoUri using @healthguard/api
    setTimeout(() => {
      setUploading(false);
      navigation.goBack();
    }, 1500);
  }

  if (photoUri) {
    return (
      <View style={styles.container}>
        <View style={styles.previewPlaceholder}>
          <Text style={{ color: "#fff" }}>Vista Previa de Foto Capturada</Text>
          <Text style={{ color: "#94a3b8", fontSize: 12 }}>{photoUri}</Text>
        </View>
        
        <View style={styles.previewControls}>
          <TouchableOpacity style={styles.circleBtnRed} onPress={() => setPhotoUri(null)} disabled={uploading}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtnGreen} onPress={handleUpload} disabled={uploading}>
            {uploading ? <ActivityIndicator color="#fff" /> : <Check color="#fff" size={32} />}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef}>
        <View style={styles.cameraHeader}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.cameraControls}>
          <View style={{ width: 64 }} /> {/* Spacer */}
          <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchBtn}>
            <RefreshCw color="#fff" size={24} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 24 },
  text: { fontSize: 16, color: "#334155", textAlign: "center", marginBottom: 16 },
  btn: { backgroundColor: "#0ea5e9", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: "#fff", fontWeight: "600" },
  
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1, justifyContent: "space-between" },
  cameraHeader: { padding: 24, paddingTop: 48, alignItems: "flex-start" },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  
  cameraControls: { flexDirection: "row", padding: 32, paddingBottom: 48, justifyContent: "space-between", alignItems: "center" },
  captureBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  captureBtnInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#fff" },
  switchBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  
  previewPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  previewControls: { flexDirection: "row", justifyContent: "center", gap: 32, paddingBottom: 48 },
  circleBtnRed: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center" },
  circleBtnGreen: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#22c55e", alignItems: "center", justifyContent: "center" },
});
