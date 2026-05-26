import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { CameraView } from "expo-camera";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Check, Plus } from "lucide-react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useDocumentForm, type FileSource } from "../hooks/useDocumentForm";
import { DocumentClassificationForm } from "../components/DocumentClassificationForm";
import { scanImagesToPdfFile } from "../utils/scanImagesToPdf";
import { getUriFileSizeBytes } from "../utils/fileUriSize";
import { ScannerCameraPermission } from "../components/documents/ScannerCameraPermission";
import { useScannerCameraPermission } from "../hooks/useScannerCameraPermission";
import { colors, overlay, radii, spacing, fontSize, fontWeight, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface CapturedPhoto {
  id: string;
  uri: string;
}

type ScanPhase = "camera" | "review";

function newPhotoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ScannerScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const params = (route.params ?? {}) as RootStackParamList["Scanner"];
  const cameraPermission = useScannerCameraPermission();
  const [phase, setPhase] = useState<ScanPhase>("camera");
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [preparingUpload, setPreparingUpload] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const form = useDocumentForm({
    backpackId: params?.backpackId,
    backpackName: params?.backpackName,
  });

  const activePhoto = photos[previewIndex] ?? photos[0];

  const classifyFile: FileSource | undefined = useMemo(() => {
    const first = photos[0];
    if (!first) return undefined;
    return {
      uri: first.uri,
      name: `scan-${Date.now()}.jpg`,
      mimeType: "image/jpeg",
    };
  }, [photos]);

  useEffect(() => {
    if (phase === "review" && photos.length > 0 && !form.title) {
      const pagesLabel = photos.length > 1 ? ` (${photos.length} páginas)` : "";
      form.setTitle(`Escaneo ${new Date().toLocaleDateString()}${pagesLabel}`);
    }
  }, [phase, photos.length, form.title]);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setPreviewIndex((idx) => Math.min(idx, Math.max(0, next.length - 1)));
      if (next.length === 0) {
        setPhase("camera");
      }
      return next;
    });
  }, []);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        setPhotos((prev) => [...prev, { id: newPhotoId(), uri: photo.uri }]);
      }
    } finally {
      setCapturing(false);
    }
  }, [capturing]);

  const finishCapture = useCallback(() => {
    if (photos.length === 0) return;
    setPreviewIndex(0);
    setPhase("review");
  }, [photos.length]);

  const addMorePages = useCallback(() => {
    setPhase("camera");
  }, []);

  const handleConfirmUpload = useCallback(async () => {
    if (!photos.length || form.uploading || preparingUpload) return;

    setPreparingUpload(true);
    try {
      const file: FileSource =
        photos.length === 1
          ? {
              uri: photos[0]!.uri,
              name: `scan-${Date.now()}.jpg`,
              mimeType: "image/jpeg",
              size: await getUriFileSizeBytes(photos[0]!.uri),
            }
          : await scanImagesToPdfFile(photos.map((p) => p.uri));

      await form.handleUpload(file);
    } catch {
      Alert.alert("Error", "No se pudo preparar el documento para subir.");
    } finally {
      setPreparingUpload(false);
    }
  }, [photos, form, preparingUpload]);

  if (!cameraPermission.permissionReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={t.brand.fg} />
      </View>
    );
  }

  if (!cameraPermission.granted && cameraPermission.permission) {
    return (
      <ScannerCameraPermission
        permission={cameraPermission.permission}
        needsSettings={cameraPermission.needsSettings}
        statusMessage={cameraPermission.statusMessage}
        onRequest={cameraPermission.requestCameraAccess}
        onOpenSettings={cameraPermission.openSettings}
        onBack={() => navigation.goBack()}
      />
    );
  }

  if (phase === "review" && activePhoto) {
    const busy = form.uploading || preparingUpload;

    return (
      <View style={styles.containerForm}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 72 : 0}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing[4] }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <View style={styles.previewContainer}>
              <Image source={{ uri: activePhoto.uri }} style={styles.previewImage} resizeMode="contain" />
              {photos.length > 1 ? (
                <View style={styles.pageBadge}>
                  <Text style={styles.pageBadgeText}>
                    {previewIndex + 1} / {photos.length}
                  </Text>
                </View>
              ) : null}
            </View>

            {photos.length > 1 ? (
              <FlatList
                horizontal
                data={photos}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbStrip}
                renderItem={({ item, index }) => {
                  const selected = index === previewIndex;
                  return (
                    <TouchableOpacity
                      style={[styles.thumbWrap, selected && styles.thumbWrapSelected]}
                      onPress={() => setPreviewIndex(index)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`Página ${index + 1}`}
                    >
                      <Image source={{ uri: item.uri }} style={styles.thumbImage} />
                      <TouchableOpacity
                        style={styles.thumbRemove}
                        onPress={() => removePhoto(item.id)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Eliminar página ${index + 1}`}
                      >
                        <X color={colors.white} size={12} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : null}

            <TouchableOpacity
              style={styles.addPageLink}
              onPress={addMorePages}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Agregar otra página"
            >
              <Plus size={18} color={t.brand.fg} />
              <Text style={styles.addPageLinkText}>Agregar otra página</Text>
            </TouchableOpacity>

            <DocumentClassificationForm file={classifyFile} {...form} />
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={[styles.previewControls, { paddingBottom: spacing[5] + insets.bottom }]}>
          <TouchableOpacity
            style={styles.circleBtnRed}
            onPress={() => navigation.goBack()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Cancelar escaneo"
          >
            <X color={colors.white} size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.circleBtnGreen}
            onPress={() => void handleConfirmUpload()}
            disabled={busy || photos.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Guardar documento escaneado"
          >
            {busy ? <ActivityIndicator color={colors.white} /> : <Check color={colors.white} size={28} />}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" ref={cameraRef} />

      <View style={styles.overlay}>
        <View style={[styles.cameraHeader, { paddingTop: insets.top + spacing[4] }]}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Cerrar escáner"
          >
            <X color={colors.white} size={24} />
          </TouchableOpacity>
          {photos.length > 0 ? (
            <View style={styles.captureCountBadge}>
              <Text style={styles.captureCountText}>{photos.length}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cameraViewport} />

        <View style={[styles.bottomDock, { paddingBottom: spacing[6] + insets.bottom }]}>
          {photos.length > 0 ? (
            <FlatList
              horizontal
              data={photos}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              style={styles.thumbList}
              contentContainerStyle={styles.cameraThumbStrip}
              renderItem={({ item, index }) => (
                <View style={styles.cameraThumbWrap}>
                  <Image source={{ uri: item.uri }} style={styles.cameraThumbImage} />
                  <TouchableOpacity
                    style={styles.cameraThumbRemove}
                    onPress={() => removePhoto(item.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar foto ${index + 1}`}
                  >
                    <X color={colors.white} size={10} />
                  </TouchableOpacity>
                </View>
              )}
            />
          ) : null}

          <View style={styles.cameraControls}>
          <View style={styles.cameraSideSlot} />

          <TouchableOpacity
            style={[styles.captureBtn, capturing && styles.captureBtnDisabled]}
            onPress={() => void takePicture()}
            disabled={capturing}
            accessibilityRole="button"
            accessibilityLabel="Tomar foto"
          >
            {capturing ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <View style={styles.captureBtnInner} />
            )}
          </TouchableOpacity>

          {photos.length > 0 ? (
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={finishCapture}
              accessibilityRole="button"
              accessibilityLabel="Continuar con las fotos tomadas"
            >
              <Check color={colors.white} size={28} />
            </TouchableOpacity>
          ) : (
            <View style={styles.cameraSideSlot} />
          )}
          </View>
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
    container: { flex: 1, backgroundColor: colors.black },
    containerForm: { flex: 1, backgroundColor: t.surface.bg },
    scroll: { flex: 1, backgroundColor: t.surface.bgCard },
    scrollContent: { backgroundColor: t.surface.bgCard },
    overlay: { flex: 1 },
    cameraViewport: { flex: 1 },
    bottomDock: {
      backgroundColor: overlay.darker,
      paddingTop: spacing[2],
    },
    cameraHeader: {
      paddingHorizontal: spacing[5],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    closeBtn: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: overlay.darker,
      alignItems: "center",
      justifyContent: "center",
    },
    captureCountBadge: {
      minWidth: 36,
      height: 36,
      paddingHorizontal: spacing[2],
      borderRadius: radii.full,
      backgroundColor: t.brand.fg,
      alignItems: "center",
      justifyContent: "center",
    },
    captureCountText: {
      color: colors.white,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
    },
    thumbList: {
      maxHeight: 52,
      flexGrow: 0,
    },
    cameraThumbStrip: {
      paddingHorizontal: spacing[4],
      paddingBottom: spacing[2],
      gap: spacing[2],
      alignItems: "center",
    },
    cameraThumbWrap: {
      width: 44,
      height: 44,
      borderRadius: radii.sm,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: colors.white,
      marginRight: spacing[2],
    },
    cameraThumbImage: { width: "100%", height: "100%" },
    cameraThumbRemove: {
      position: "absolute",
      top: 1,
      right: 1,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: overlay.darker,
      alignItems: "center",
      justifyContent: "center",
    },

    cameraControls: {
      flexDirection: "row",
      paddingHorizontal: spacing[6],
      paddingTop: spacing[2],
      justifyContent: "space-between",
      alignItems: "center",
    },
    cameraSideSlot: { width: 64 },
    captureBtn: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 4,
      borderColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
    },
    captureBtnDisabled: { opacity: 0.7 },
    captureBtnInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.white },
    doneBtn: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: t.status.successFg,
      alignItems: "center",
      justifyContent: "center",
    },

    previewContainer: {
      height: 400,
      backgroundColor: colors.black,
      justifyContent: "center",
      alignItems: "center",
    },
    previewImage: { width: "100%", height: "100%" },
    pageBadge: {
      position: "absolute",
      bottom: spacing[3],
      alignSelf: "center",
      backgroundColor: overlay.darker,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: radii.full,
    },
    pageBadgeText: {
      color: colors.white,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    thumbStrip: {
      paddingHorizontal: spacing[5],
      paddingVertical: spacing[3],
      gap: spacing[2],
    },
    thumbWrap: {
      width: 64,
      height: 84,
      borderRadius: radii.sm,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: "transparent",
      marginRight: spacing[2],
    },
    thumbWrapSelected: {
      borderColor: t.brand.fg,
    },
    thumbImage: { width: "100%", height: "100%" },
    thumbRemove: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: t.status.errorFg,
      alignItems: "center",
      justifyContent: "center",
    },
    addPageLink: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[2],
      paddingVertical: spacing[3],
    },
    addPageLinkText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.brand.fg,
    },

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
