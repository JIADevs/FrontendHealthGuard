import { useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { Spinner, Typography, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

export interface DocumentPdfViewerProps {
  uri: string;
  title: string;
  /** Altura fija para vista embebida; omitir para pantalla completa */
  height?: number;
}

const EMBEDDED_HEIGHT = 320;

function googlePdfEmbedUrl(remoteUri: string): string {
  return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(remoteUri)}`;
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
    // iOS fits the page to the width by itself; pinch to zoom from there.
    return uri;
  }, [uri]);

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
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.surface.bg,
      zIndex: 1,
    },
  });
}
