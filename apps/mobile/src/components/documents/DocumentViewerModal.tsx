import { useMemo } from "react";
import { Modal, View, TouchableOpacity, Image, StyleSheet, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { Spinner, Typography, spacing, radii, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { DocFormat } from "@helu/ui";
import { DocumentPdfViewer } from "./DocumentPdfViewer";

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
  const styles = useMemo(() => makeStyles(t, insets.top), [t, insets.top]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <Typography variant="h4" numberOfLines={1}>
              {title}
            </Typography>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Cerrar visor"
          >
            <X size={22} color={t.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {loading ? (
            <View style={styles.centered}>
              <Spinner size="lg" />
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
            <Image
              source={{ uri }}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel={title}
            />
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

function makeStyles(t: ThemeContextValue, topInset: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: t.surface.bgCard,
      paddingTop: topInset,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      paddingHorizontal: spacing[5],
      paddingVertical: spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: t.border.light,
    },
    titleWrap: {
      flex: 1,
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.sm,
      backgroundColor: t.border.light,
    },
    body: {
      flex: 1,
    },
    image: {
      flex: 1,
      width: "100%",
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing[6],
    },
  });
}
