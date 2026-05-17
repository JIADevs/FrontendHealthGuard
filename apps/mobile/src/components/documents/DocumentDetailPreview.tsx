import { useMemo, useState } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import {
  Spinner,
  Typography,
  formatDate,
  fontSize,
  fontWeight,
  radii,
  spacing,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { DocFormat } from "@helu/ui";
import { DocumentPdfViewer } from "./DocumentPdfViewer";

interface DocumentDetailPreviewProps {
  title: string;
  description?: string | null;
  documentDate?: string | null;
  signedUrl?: string;
  isImage: boolean;
  docFormat: DocFormat;
  isLoading?: boolean;
}

export function DocumentDetailPreview({
  title,
  description,
  documentDate,
  signedUrl,
  isImage,
  docFormat,
  isLoading = false,
}: DocumentDetailPreviewProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [page, setPage] = useState({ current: 1, total: 1 });

  const showPageIndicator =
    !isLoading && docFormat === "pdf" && !!signedUrl && page.total > 0;

  return (
    <View style={styles.frame}>
      <View style={styles.card}>
        {isLoading ? (
          <View style={styles.centered}>
            <Spinner size="md" />
          </View>
        ) : isImage && signedUrl ? (
          <Image
            source={{ uri: signedUrl }}
            style={styles.previewImage}
            resizeMode="contain"
            accessibilityLabel={`Vista previa de ${title}`}
          />
        ) : docFormat === "pdf" && signedUrl ? (
          <DocumentPdfViewer
            uri={signedUrl}
            title={title}
            height={320}
            onPageChange={(current, total) => setPage({ current, total })}
          />
        ) : description?.trim() ? (
          <View style={styles.textPreview}>
            <Text style={styles.reportTitle}>{title.toUpperCase()}</Text>
            {documentDate ? (
              <Text style={styles.reportMeta}>Fecha: {formatDate(documentDate)}</Text>
            ) : null}
            <Text style={styles.reportBody}>{description.trim()}</Text>
          </View>
        ) : (
          <View style={styles.centered}>
            <Typography variant="bodySm" color="secondary" align="center">
              Vista previa no disponible para este formato.
            </Typography>
          </View>
        )}
      </View>
      {showPageIndicator ? (
        <Text style={styles.pageIndicator}>
          {page.current} / {page.total}
        </Text>
      ) : !isLoading && (isImage || description?.trim()) ? (
        <Text style={styles.pageIndicator}>1 / 1</Text>
      ) : null}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    frame: {
      borderWidth: 1,
      borderColor: t.border.default,
      borderRadius: radii.lg,
      padding: spacing[3],
      backgroundColor: t.surface.bgCard,
      gap: spacing[2],
    },
    card: {
      minHeight: 220,
      borderRadius: radii.md,
      backgroundColor: t.surface.bg,
      borderWidth: 1,
      borderColor: t.border.light,
      overflow: "hidden",
    },
    centered: {
      flex: 1,
      minHeight: 220,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing[5],
    },
    previewImage: {
      width: "100%",
      minHeight: 220,
      maxHeight: 360,
    },
    textPreview: {
      padding: spacing[4],
      gap: spacing[2],
    },
    reportTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      color: t.text.primary,
      letterSpacing: 0.4,
    },
    reportMeta: {
      fontSize: fontSize.sm,
      color: t.text.secondary,
    },
    reportBody: {
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: t.text.primary,
    },
    pageIndicator: {
      fontSize: fontSize.xs,
      color: t.text.muted,
    },
  });
}
