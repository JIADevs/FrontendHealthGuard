import { useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface DocumentZoomableImageProps {
  uri: string;
  title: string;
  /** Kept for callers; the image now measures its own frame. */
  contentHeight?: number;
}

/**
 * The whole image fitted to its frame first; pinch to zoom up to 4× and pinch back to see it whole.
 * (It used to open at 1.35× with 1× as the minimum, so the full page could never be seen.)
 */
export function DocumentZoomableImage({ uri, title }: DocumentZoomableImageProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);

  return (
    <View style={styles.frame} onLayout={(e) => setFrame(e.nativeEvent.layout)}>
      {frame ? (
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
            style={{ width: frame.width - spacing[3] * 2, height: frame.height - spacing[3] * 2 }}
            resizeMode="contain"
            accessibilityLabel={title}
          />
        </ScrollView>
      ) : null}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    frame: { flex: 1, minHeight: 0, backgroundColor: t.surface.bg },
    scroll: { flex: 1 },
    content: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: spacing[3] },
  });
}
