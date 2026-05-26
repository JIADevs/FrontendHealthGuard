import { useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { Spinner, Typography, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { DOCUMENT_VIEWER_INITIAL_ZOOM } from "./DocumentZoomableImage";

export interface DocumentPdfViewerProps {
  uri: string;
  title: string;
  /** Altura fija para vista embebida; omitir para pantalla completa */
  height?: number;
}

const EMBEDDED_HEIGHT = 320;

/** Porcentaje de zoom para visor PDF nativo en iOS (#zoom=NN). */
const PDF_ZOOM_PERCENT = Math.round(DOCUMENT_VIEWER_INITIAL_ZOOM * 100);

function googlePdfEmbedUrl(remoteUri: string): string {
  return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(remoteUri)}`;
}

function pdfUriWithDefaultZoom(uri: string): string {
  const hash = `zoom=${PDF_ZOOM_PERCENT}`;
  if (uri.includes("#")) {
    return `${uri}&${hash}`;
  }
  return `${uri}#${hash}`;
}

export function DocumentPdfViewer({
  uri,
  title,
  height,
}: DocumentPdfViewerProps) {
  const t = useAppTheme();
  const isFullscreen = height == null;
  const resolvedHeight = height ?? EMBEDDED_HEIGHT;
  const styles = useMemo(
    () => makeStyles(t, resolvedHeight, isFullscreen),
    [t, resolvedHeight, isFullscreen],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const webViewUri = useMemo(() => {
    if (Platform.OS === "android") {
      return googlePdfEmbedUrl(uri);
    }
    return isFullscreen ? pdfUriWithDefaultZoom(uri) : uri;
  }, [uri, isFullscreen]);

  if (error) {
    return (
      <View style={[styles.centered, isFullscreen && styles.fullscreen]}>
        <Typography variant="bodySm" color="secondary" align="center">
          {error}
        </Typography>
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreen]}>
      {loading ? (
        <View style={styles.loaderOverlay}>
          <Spinner size="md" />
        </View>
      ) : null}
      <WebView
        source={{ uri: webViewUri }}
        style={[styles.webview, isFullscreen && styles.fullscreen]}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError("No se pudo cargar el PDF.");
        }}
        onHttpError={() => {
          setLoading(false);
          setError("No se pudo cargar el PDF.");
        }}
        startInLoadingState
        scalesPageToFit
        originWhitelist={["*"]}
        allowsInlineMediaPlayback
        setBuiltInZoomControls={Platform.OS === "android"}
        setDisplayZoomControls={false}
        accessibilityLabel={`Vista previa de ${title}`}
      />
    </View>
  );
}

function makeStyles(t: ThemeContextValue, height: number, isFullscreen: boolean) {
  return StyleSheet.create({
    container: {
      width: "100%",
      ...(isFullscreen ? { flex: 1, minHeight: 0 } : { height }),
      backgroundColor: t.surface.bg,
      overflow: "hidden",
    },
    fullscreen: {
      flex: 1,
      minHeight: 0,
    },
    webview: {
      flex: 1,
      width: "100%",
      minHeight: 0,
      ...(isFullscreen ? {} : { height }),
      backgroundColor: t.surface.bg,
    },
    centered: {
      width: "100%",
      ...(isFullscreen ? { flex: 1, minHeight: 0 } : { height }),
      alignItems: "center",
      justifyContent: "center",
      padding: spacing[4],
    },
    loaderOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.surface.bg,
      zIndex: 1,
    },
  });
}
