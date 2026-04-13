import { useState, useRef, useEffect, useMemo } from "react";
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
import { useNavigation, useRoute } from "@react-navigation/native";
import { X, Check, RefreshCw } from "lucide-react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useDocumentForm, type FileSource } from "../hooks/useDocumentForm";
import { DocumentClassificationForm } from "../components/DocumentClassificationForm";
import { colors, overlay, radii, spacing, fontSize, fontWeight, useAppTheme, Typography } from "@healthguard/ui";
import type { ThemeContextValue } from "@healthguard/ui";

export function ScannerScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const params = (route.params ?? {}) as RootStackParamList["Scanner"];
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const form = useDocumentForm({
    backpackId: params?.backpackId,
    backpackName: params?.backpackName,
  });

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
        <ActivityIndicator color={colors.sky[500]} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Typography variant="body" align="center">Necesitamos permiso para usar la cámara</Typography>
        <TouchableOpacity style={styles.btn} onPress={handleRequestPermission}>
          <Text style={styles.btnText}>
            {!permission.canAskAgain && permission.status === "denied"
              ? "Abrir ajustes"
              : "Conceder permiso"}
          </Text>
        </TouchableOpacity>
        {!permission.canAskAgain && (
          <Typography variant="bodySm" color="secondary" align="center">
            Parece que el permiso fue denegado permanentemente. Ve a los ajustes del dispositivo y habilita la cámara para esta app.
          </Typography>
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
            <X color={colors.white} size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.circleBtnGreen}
            onPress={() => form.handleUpload(fileSource)}
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

  // ── Camera view ──
  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" ref={cameraRef} />

      <View style={styles.overlay}>
        <View style={styles.cameraHeader}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <X color={colors.white} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.cameraControls}>
          <View style={{ width: 64 }} />
          <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchBtn}>
            <RefreshCw color={colors.white} size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: t.surface.bgCard,
      padding: spacing[6],
    },
    text:    { fontSize: fontSize.md, color: t.text.primary, textAlign: "center", marginBottom: spacing[4] },
    btn:     { backgroundColor: colors.sky[500], paddingHorizontal: spacing[5], paddingVertical: spacing[3], borderRadius: radii.md },
    btnText: { color: colors.white, fontWeight: fontWeight.semibold },
    helper:  { marginTop: spacing[4], fontSize: fontSize.sm, color: t.text.secondary, textAlign: "center", lineHeight: 18 },

    container:      { flex: 1, backgroundColor: colors.black },
    overlay:        { flex: 1, justifyContent: "space-between" },
    cameraHeader:   { padding: spacing[6], paddingTop: 48, alignItems: "flex-start" },
    closeBtn: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: overlay.darker,
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
      borderColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
    },
    captureBtnInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.white },
    switchBtn: {
      width: 48,
      height: 48,
      borderRadius: radii.full,
      backgroundColor: overlay.light,
      alignItems: "center",
      justifyContent: "center",
    },

    previewContainer: {
      height: 450,
      backgroundColor: colors.black,
      justifyContent: "center",
      alignItems: "center",
    },
    previewImage: { width: "100%", height: "100%" },

    previewControls: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 32,
      paddingBottom: 48,
      backgroundColor: t.surface.bgCard,
      paddingTop: spacing[3],
    },
    circleBtnRed: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.error[500],
      alignItems: "center",
      justifyContent: "center",
    },
    circleBtnGreen: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.success[500],
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
