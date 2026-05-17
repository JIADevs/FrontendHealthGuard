import { useCallback, useMemo, useState } from "react";
import { Alert, Linking, Share } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useDocumentQuery,
  useTagCategoriesQuery,
  useDeleteDocumentMutation,
  useActiveDocumentSharesQuery,
  QK,
} from "@helu/api/hooks";
import { getSignedUrl, shareDocument, isApiError, type Document } from "@helu/api";
import { resolveDocFormat } from "@helu/ui";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { resolveDocumentTheme } from "../components/documents/utils/resolveDocumentTheme";
import {
  buildTagCategoryMap,
  getDocumentDetailTags,
  getDocumentSubtitle,
} from "../components/documents/utils/documentDetailMeta";
import { resolveExpoReachableUrl } from "../utils/shareLinks";

export function useDocumentDetail(id: string) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const [sharePending, setSharePending] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const docQuery = useDocumentQuery(id);
  const tagCatalog = useTagCategoriesQuery();
  const activeShares = useActiveDocumentSharesQuery();
  const deleteMut = useDeleteDocumentMutation();

  const document = docQuery.data as Document | undefined;
  const theme = useMemo(
    () => (document ? resolveDocumentTheme(document) : null),
    [document],
  );

  const categoryMap = useMemo(() => {
    const raw = Array.isArray(tagCatalog.data) ? tagCatalog.data : [];
    return buildTagCategoryMap(raw.map((cat) => ({ id: cat.id, name: cat.name })));
  }, [tagCatalog.data]);

  const subtitle = useMemo(
    () => (document ? getDocumentSubtitle(document, categoryMap) : null),
    [document, categoryMap],
  );

  const detailTags = useMemo(
    () => (document ? getDocumentDetailTags(document, categoryMap) : []),
    [document, categoryMap],
  );

  const signedUrlQuery = useQuery({
    queryKey: ["signed-url", document?.fileUrl],
    queryFn: () => getSignedUrl(document!.fileUrl),
    enabled: !!document?.fileUrl,
  });

  const signedUrl = signedUrlQuery.data?.url;
  const docFormat = resolveDocFormat(document?.format ?? "");
  const isImage = docFormat === "image";

  const canOpenInApp = docFormat === "pdf" || docFormat === "image";

  const handleOpen = useCallback(async () => {
    if (!signedUrl) return;
    if (canOpenInApp) {
      setViewerOpen(true);
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(signedUrl);
      if (!canOpen) {
        Toast.show({
          type: "error",
          text1: "No se pudo abrir",
          text2: "El enlace del documento no es válido.",
        });
        return;
      }
      await Linking.openURL(signedUrl);
    } catch {
      Toast.show({
        type: "error",
        text1: "Error al abrir",
        text2: "No se pudo abrir el documento.",
      });
    }
  }, [signedUrl, canOpenInApp]);

  const closeViewer = useCallback(() => setViewerOpen(false), []);

  const activeShareForDoc = useMemo(
    () => (activeShares.data ?? []).find((s) => s.documentId === document?.id),
    [activeShares.data, document?.id],
  );

  const handleShareLink = useCallback(async () => {
    if (!document || sharePending) return;
    setSharePending(true);
    try {
      let shareUrl = activeShareForDoc?.shareUrl;
      const createdNewLink = !shareUrl;

      if (!shareUrl) {
        const result = await shareDocument(document.id);
        shareUrl = result.shareUrl;
        void queryClient.invalidateQueries({ queryKey: QK.documentSharesActive() });
      }

      const resolved = resolveExpoReachableUrl(shareUrl);
      await Share.share({
        url: resolved,
        message: `Documento «${document.title}». Enlace: ${resolved}`,
      });

      if (createdNewLink) {
        Toast.show({
          type: "success",
          text1: "Enlace listo",
          text2: "Compartí el documento con quien quieras.",
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error al compartir",
        text2: isApiError(err) ? err.message : "No se pudo generar el enlace.",
      });
    } finally {
      setSharePending(false);
    }
  }, [document, sharePending, activeShareForDoc, queryClient]);

  const handleDelete = useCallback(() => {
    if (!document) return;
    Alert.alert(
      "Eliminar documento",
      `¿Estás seguro de eliminar «${document.title}»? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            deleteMut.mutate(document.id, {
              onSuccess: () => {
                Toast.show({ type: "success", text1: "Documento eliminado" });
                navigation.goBack();
              },
              onError: (err) => {
                Toast.show({
                  type: "error",
                  text1: "Error al eliminar",
                  text2: isApiError(err) ? err.message : "No se pudo eliminar el documento.",
                });
              },
            });
          },
        },
      ],
    );
  }, [document, deleteMut, navigation]);

  return {
    document,
    theme,
    subtitle,
    detailTags,
    isLoading: docQuery.isLoading,
    signedUrl,
    signedUrlLoading: signedUrlQuery.isLoading,
    isImage,
    docFormat,
    sharePending,
    deletePending: deleteMut.isPending,
    viewerOpen,
    closeViewer,
    handleOpen,
    handleShareLink,
    handleDelete,
  };
}
