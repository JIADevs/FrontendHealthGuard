import { useCallback, useMemo, useState } from "react";
import { ScrollView, Share, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import * as Clipboard from "expo-clipboard";
import { useRoute } from "@react-navigation/native";
import { spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { ShareQrPanel, buildBackpackShareSubtitle, formatShareExpirationLabel } from "../components/share";
import { resolveExpoReachableUrl } from "../utils/shareLinks";

type RouteParams = RootStackParamList["ShareQr"];

export function ShareQrScreen() {
  const route = useRoute();
  const params = (route.params ?? {}) as RouteParams;
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [copying, setCopying] = useState(false);

  const subtitle =
    params.resourceType === "backpack"
      ? buildBackpackShareSubtitle(params.documentCount)
      : undefined;

  const handleCopy = useCallback(async () => {
    setCopying(true);
    try {
      await Clipboard.setStringAsync(resolveExpoReachableUrl(params.shareUrl));
      Toast.show({ type: "success", text1: "Enlace copiado" });
    } catch {
      Toast.show({ type: "error", text1: "No se pudo copiar" });
    } finally {
      setCopying(false);
    }
  }, [params.shareUrl]);

  const handleSend = useCallback(async () => {
    const url = resolveExpoReachableUrl(params.shareUrl);
    try {
      await Share.share({
        url,
        message: `«${params.title}». Enlace: ${url}`,
      });
    } catch {
      /* cancelado */
    }
  }, [params.shareUrl, params.title]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ShareQrPanel
          title={params.title}
          subtitle={subtitle}
          shareUrl={params.shareUrl}
          expiresAt={params.expiresAt}
          onCopy={() => void handleCopy()}
          onSend={() => void handleSend()}
          copyLoading={copying}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.surface.bg,
    },
    content: {
      padding: spacing[5],
      paddingBottom: spacing[10],
    },
  });
}
