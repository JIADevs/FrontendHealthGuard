import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Linking, ScrollView, StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useExtendShareMutation,
  useRevokeShareMutation,
  useShareHistoryQuery,
} from "@helu/api/hooks";
import { isApiError } from "@helu/api";
import {
  Button,
  Chip,
  ConfirmModal,
  Spinner,
  Typography,
  spacing,
  radii,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { EyeOff } from "lucide-react-native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import {
  SharedActivityCards,
  SharedDetailActions,
  ShareResourceSummaryCard,
  formatShareExpiresInHuman,
  useShareFlow,
} from "../components/share";
import { resolveExpoReachableUrl } from "../utils/shareLinks";

type RouteParams = RootStackParamList["SharedDetail"];

export function SharedDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const params = (route.params ?? {}) as RouteParams;
  const shareFlow = useShareFlow(navigation);
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const shares = useShareHistoryQuery();
  const link = useMemo(
    () => shares.data?.find((row) => row.linkId === params.linkId && row.resourceType === params.resourceType),
    [shares.data, params.linkId, params.resourceType],
  );

  useFocusEffect(
    useCallback(() => {
      // Trae view_count / last_viewed_at más recientes (p. ej. si un receptor abrió el enlace).
      void shares.refetch();
    }, [shares.refetch]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void shares.refetch();
      }
    });
    return () => sub.remove();
  }, [shares.refetch]);

  const revoke = useRevokeShareMutation();
  const extend = useExtendShareMutation();
  const [copying, setCopying] = useState(false);
  const [openingDoc, setOpeningDoc] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!link) return;
    setCopying(true);
    try {
      await Clipboard.setStringAsync(resolveExpoReachableUrl(link.shareUrl));
      Toast.show({ type: "success", text1: "Enlace copiado" });
    } catch {
      Toast.show({ type: "error", text1: "No se pudo copiar" });
    } finally {
      setCopying(false);
    }
  }, [link]);

  const handleViewQr = useCallback(() => {
    if (!link) return;
    shareFlow.openQrResult({
      shareUrl: link.shareUrl,
      title: link.title,
      resourceType: link.resourceType,
      expiresAt: link.expiresAt,
      documentCount: link.documentCount,
      backTitle: "Compartido",
    });
  }, [link, shareFlow]);

  const handleOpenDocument = useCallback(async () => {
    if (!link) return;
    setOpeningDoc(true);
    try {
      await Linking.openURL(resolveExpoReachableUrl(link.shareUrl));
    } catch {
      Toast.show({ type: "error", text1: "No se pudo abrir el documento" });
    } finally {
      setOpeningDoc(false);
    }
  }, [link]);

  const handleExtend = useCallback(() => {
    if (!link) return;
    extend.mutate(
      { linkId: link.linkId, resourceType: link.resourceType },
      {
        onSuccess: () => Toast.show({ type: "success", text1: "Enlace extendido 24h" }),
        onError: (err) =>
          Toast.show({
            type: "error",
            text1: "No se pudo extender",
            text2: isApiError(err) ? err.message : "Inténtalo de nuevo.",
          }),
      },
    );
  }, [link, extend]);

  const handleRevoke = useCallback(() => {
    if (!link) return;
    revoke.mutate(
      { linkId: link.linkId, resourceType: link.resourceType },
      {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Acceso revocado" });
          navigation.goBack();
        },
        onError: (err) =>
          Toast.show({
            type: "error",
            text1: "No se pudo revocar",
            text2: isApiError(err) ? err.message : "Inténtalo de nuevo.",
          }),
      },
    );
  }, [link, revoke, navigation]);

  if (shares.isLoading && !link) {
    return (
      <SafeAreaView style={styles.center}>
        <Spinner size="lg" />
      </SafeAreaView>
    );
  }

  if (!link) {
    return (
      <SafeAreaView style={styles.center}>
        <Typography variant="body" color="error">
          Enlace no encontrado.
        </Typography>
      </SafeAreaView>
    );
  }

  const isActive = link.status === "active";

  return (
    <>
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ShareResourceSummaryCard
            resourceType={link.resourceType}
            title={link.title}
            subtitle="Compartido · Enlace público"
          />
          <View style={styles.badges}>
            <Chip label={isActive ? "Activo" : "Expirado"} color={isActive ? "green" : "default"} />
            {isActive ? (
              <Chip label={formatShareExpiresInHuman(link.expiresAt)} color="amber" />
            ) : null}
          </View>

          <SharedActivityCards
            viewCount={link.viewCount}
            lastViewedAt={link.lastViewedAt}
            loading={shares.isFetching}
          />

          {isActive ? (
            <SharedDetailActions
              onOpenDocument={() => void handleOpenDocument()}
              onViewQr={handleViewQr}
              onCopy={() => void handleCopy()}
              onExtend={handleExtend}
              openLoading={openingDoc}
              copyLoading={copying}
              extendLoading={extend.isPending}
              extendDisabled={link.expiresAt == null}
              actionsDisabled={revoke.isPending}
            />
          ) : null}

          {isActive ? (
            <View style={styles.revokeBox}>
              <EyeOff size={20} color="#dc2626" />
              <Text style={styles.revokeCopy}>
                Revocar acceso ahora. El enlace y QR dejarán de funcionar inmediatamente.
              </Text>
              <Button variant="danger" fullWidth onPress={() => setRevokeOpen(true)} loading={revoke.isPending}>
                Revocar acceso
              </Button>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      {revokeOpen ? (
        <ConfirmModal
          title="Revocar acceso"
          message={`¿Quieres dejar de compartir «${link.title}»?`}
          confirmLabel="Revocar acceso"
          confirmVariant="danger"
          loading={revoke.isPending}
          onConfirm={handleRevoke}
          onCancel={() => setRevokeOpen(false)}
        />
      ) : null}
    </>
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
      gap: spacing[5],
      paddingBottom: spacing[10],
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.surface.bg,
    },
    badges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[2],
    },
    revokeBox: {
      padding: spacing[4],
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.medium,
      backgroundColor: t.surface.bgCard,
      gap: spacing[3],
      alignItems: "center",
    },
    revokeCopy: {
      textAlign: "center",
      color: t.text.secondary,
      fontSize: 12,
    },
  });
}
