import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ShareExpiresIn } from "@helu/api";
import { useShareBackpackMutation, useShareDocumentMutation } from "@helu/api/hooks";
import { isApiError } from "@helu/api";
import { spacing, Spinner, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { RootStackParamList } from "../navigation/RootNavigator";
import {
  ShareExpirationPicker,
  SharePermissionsSection,
  ShareResourceSummaryCard,
  useShareFlow,
} from "../components/share";

type RouteParams = RootStackParamList["ShareConfigure"];

export function ShareConfigureScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const params = (route.params ?? {}) as RouteParams;
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const shareFlow = useShareFlow(navigation);

  const [expiresIn, setExpiresIn] = useState<ShareExpiresIn>("24h");
  const shareDocument = useShareDocumentMutation();
  const shareBackpack = useShareBackpackMutation();
  const isPending = shareDocument.isPending || shareBackpack.isPending;

  const handleGenerate = useCallback(() => {
    const onSuccess = (result: { shareUrl: string; expiresAt: string | null; existing?: boolean }) => {
      if (result.existing) {
        Toast.show({
          type: "info",
          text1: "Enlace ya existente",
          text2: "Este recurso ya tiene un enlace activo. Te mostramos el QR y la URL actuales.",
        });
      }
      shareFlow.openQrResult({
        shareUrl: result.shareUrl,
        title: params.title,
        resourceType: params.resourceType,
        expiresAt: result.expiresAt,
        documentCount: params.documentCount,
        backTitle: "Compartir",
      });
    };
    const onError = (err: unknown) => {
      Toast.show({
        type: "error",
        text1: "Error al compartir",
        text2: isApiError(err) ? err.message : "No se pudo generar el enlace.",
      });
    };

    if (params.resourceType === "document") {
      shareDocument.mutate({ documentId: params.resourceId, expiresIn }, { onSuccess, onError });
      return;
    }
    shareBackpack.mutate({ backpackId: params.resourceId, expiresIn }, { onSuccess, onError });
  }, [params, expiresIn, shareDocument, shareBackpack, shareFlow]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={isPending}
          style={styles.headerAction}
          accessibilityRole="button"
          accessibilityLabel="Generar enlace"
        >
          {isPending ? (
            <Spinner size="sm" color="primary" />
          ) : (
            <Text style={styles.headerActionText}>Generar</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleGenerate, isPending, styles]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ShareResourceSummaryCard
          resourceType={params.resourceType}
          title={params.title}
          subtitle={params.subtitle}
        />
        <ShareExpirationPicker value={expiresIn} onChange={setExpiresIn} />
        <SharePermissionsSection />
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
      gap: spacing[5],
      paddingBottom: spacing[10],
    },
    headerAction: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      minWidth: 56,
      alignItems: "center",
    },
    headerActionText: {
      color: t.brand.fg,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
