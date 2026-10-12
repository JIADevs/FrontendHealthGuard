import { useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  type ImageStyle,
} from "react-native";
import { spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

/** Escala inicial al abrir documento en pantalla completa (1 = tamaño contenido). */
export const DOCUMENT_VIEWER_INITIAL_ZOOM = 1.35;

interface DocumentZoomableImageProps {
  uri: string;
  title: string;
  /** Altura útil del área de contenido (pantalla menos cabecera). */
  contentHeight: number;
}

export function DocumentZoomableImage({ uri, title, contentHeight }: DocumentZoomableImageProps) {
  const t = useAppTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(t), [t]);

  const zoom = DOCUMENT_VIEWER_INITIAL_ZOOM;
  const imageStyle: ImageStyle = {
    width: width * zoom,
    height: Math.max(contentHeight * zoom, 280),
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      maximumZoomScale={4}
      minimumZoomScale={1}
      bouncesZoom
      centerContent
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    >
      <Image
        source={{ uri }}
        style={imageStyle}
        resizeMode="contain"
        accessibilityLabel={title}
      />
    </ScrollView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: t.surface.bg,
    },
    content: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing[3],
    },
  });
}
