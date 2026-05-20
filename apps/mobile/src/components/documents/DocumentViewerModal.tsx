import { useMemo } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, FileText } from "lucide-react-native";
import {
  Spinner,
  Typography,
  spacing,
  radii,
  shadows,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { DocFormat } from "@helu/ui";
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

export function DocumentViewerModal({
  visible,
  title,
  uri,
  format,
  loading = false,
  onClose,
}: DocumentViewerModalProps) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useMemo(
    () => makeStyles(t, insets.top, insets.bottom),
    [t, insets.top, insets.bottom],
  );

  const contentHeight = Math.max(
    windowHeight - insets.top - insets.bottom - 88,
    320,
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle={t.mode === "dark" ? "light-content" : "dark-content"} />
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <FileText size={20} color={t.brand.fg} strokeWidth={2.25} />
            </View>
            <View style={styles.titleWrap}>
              <Typography variant="caption" color="secondary">
                Ver documento
              </Typography>
              <Typography variant="h4" numberOfLines={2}>
                {title}
              </Typography>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Cerrar visor"
          >
            <X size={20} color={t.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.viewerFrame}>
          {loading ? (
            <View style={styles.centered}>
              <Spinner size="lg" />
              <Typography variant="bodySm" color="secondary">
                Cargando documento…
              </Typography>
            </View>
          ) : !uri ? (
            <View style={styles.centered}>
              <Typography variant="bodySm" color="secondary" align="center">
                No se pudo obtener el archivo.
              </Typography>
            </View>
          ) : format === "pdf" ? (
            <DocumentPdfViewer uri={uri} title={title} />
          ) : format === "image" ? (
            <DocumentZoomableImage uri={uri} title={title} contentHeight={contentHeight} />
          ) : (
            <View style={styles.centered}>
              <Typography variant="bodySm" color="secondary" align="center">
                Vista previa no disponible para este formato.
              </Typography>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(t: ThemeContextValue, topInset: number, bottomInset: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: t.surface.bg,
      paddingTop: topInset,
      paddingBottom: bottomInset,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      marginHorizontal: spacing[4],
      marginBottom: spacing[3],
      padding: spacing[4],
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.light,
      ...shadows.sm,
    },
    titleRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },
    titleIcon: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      backgroundColor: t.brand.tint,
      alignItems: "center",
      justifyContent: "center",
    },
    titleWrap: {
      flex: 1,
      gap: spacing[1],
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.sm,
      backgroundColor: t.surface.bg,
      borderWidth: 1,
      borderColor: t.border.light,
    },
    viewerFrame: {
      flex: 1,
      minHeight: 0,
      marginHorizontal: spacing[4],
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
      overflow: "hidden",
      ...shadows.sm,
    },
    centered: {
      flex: 1,
      minHeight: 0,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing[6],
      gap: spacing[3],
    },
  });
}
