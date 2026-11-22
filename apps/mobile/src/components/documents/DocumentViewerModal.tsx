import { useMemo } from "react";
import { Modal, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { IconButton, Spinner, nativeFont, radii, spacing, useAppTheme, type DocFormat, type ThemeContextValue } from "@helu/ui";
import { DocumentPdfViewer } from "./DocumentPdfViewer";
import { DocumentZoomableImage } from "./DocumentZoomableImage";

interface DocumentViewerModalProps {
  visible: boolean;
  title: string;
  uri?: string;
  format: DocFormat;
  loading?: boolean;
  onClose: () => void;
}

/**
 * Full-screen viewer opened from the detail preview. v2 header (kit `mback`, with ✕ because it is a
 * modal): 44 px round button, the title, and the document fitted to the frame; pinch to zoom.
 */
export function DocumentViewerModal({ visible, title, uri, format, loading = false, onClose }: DocumentViewerModalProps) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <StatusBar barStyle={t.mode === "dark" ? "light-content" : "dark-content"} />
      <View style={[styles.root, { paddingTop: insets.top + spacing[2], paddingBottom: insets.bottom + spacing[2] }]}>
        <View style={styles.header}>
          <IconButton icon={<X size={20} strokeWidth={2.4} color={t.text.primary} />} accessibilityLabel="Cerrar" onPress={onClose} />
          <View style={styles.titles}>
            <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
            {uri && !loading && (format === "pdf" || format === "image") ? (
              <Text style={styles.subtitle}>Pellizca para acercar</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.frame}>
          {loading ? (
            <View style={styles.centered}>
              <Spinner size="lg" />
              <Text style={styles.subtitle}>Cargando documento…</Text>
            </View>
          ) : !uri ? (
            <View style={styles.centered}>
              <Text style={styles.message}>No pudimos abrir el archivo.</Text>
            </View>
          ) : format === "pdf" ? (
            <DocumentPdfViewer uri={uri} title={title} />
          ) : format === "image" ? (
            <DocumentZoomableImage uri={uri} title={title} />
          ) : (
            <View style={styles.centered}>
              <Text style={styles.message}>No hay vista previa para este formato. Descárgalo para abrirlo.</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.surface.bg },
    header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: spacing[4], paddingBottom: spacing[3] },
    titles: { flex: 1 },
    title: { fontSize: 18, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    subtitle: { fontSize: 13, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    frame: {
      flex: 1,
      minHeight: 0,
      marginHorizontal: spacing[4],
      borderRadius: radii.card,
      borderWidth: 1,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
      overflow: "hidden",
    },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing[6], gap: spacing[3] },
    message: { fontSize: 15, lineHeight: 22, fontFamily: nativeFont("body", 400), color: t.text.secondary, textAlign: "center" },
  });
}
