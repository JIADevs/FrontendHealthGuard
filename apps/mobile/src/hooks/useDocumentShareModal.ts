import { useCallback, useEffect, useState } from "react";
import { Linking, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { useQueryClient } from "@tanstack/react-query";
import { useActiveDocumentSharesQuery, QK } from "@helu/api/hooks";
import { shareDocument, isApiError, type Document } from "@helu/api";
import { resolveExpoReachableUrl } from "../utils/shareLinks";

export function useDocumentShareModal() {
  const queryClient = useQueryClient();
  const activeShares = useActiveDocumentSharesQuery();

  const [shareTarget, setShareTarget] = useState<Document | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const closeShare = useCallback(() => {
    setShareTarget(null);
    setShareUrl(null);
    setIsPreparing(false);
    setIsCopying(false);
  }, []);

  const openShare = useCallback((doc: Document) => {
    setShareTarget(doc);
    setShareUrl(null);
  }, []);

  useEffect(() => {
    if (!shareTarget) return;

    let cancelled = false;

    const prepareLink = async () => {
      setIsPreparing(true);
      try {
        const existing = (activeShares.data ?? []).find((s) => s.documentId === shareTarget.id);
        let url = existing?.shareUrl;

        if (!url) {
          const result = await shareDocument(shareTarget.id);
          url = result.shareUrl;
          void queryClient.invalidateQueries({ queryKey: QK.documentSharesActive() });
        }

        if (!cancelled) {
          setShareUrl(resolveExpoReachableUrl(url));
        }
      } catch (err) {
        if (!cancelled) {
          Toast.show({
            type: "error",
            text1: "Error al compartir",
            text2: isApiError(err) ? err.message : "No se pudo generar el enlace.",
          });
          closeShare();
        }
      } finally {
        if (!cancelled) setIsPreparing(false);
      }
    };

    if (activeShares.isLoading) {
      setIsPreparing(true);
      return;
    }

    void prepareLink();

    return () => {
      cancelled = true;
    };
  }, [shareTarget, activeShares.isLoading, activeShares.data, queryClient, closeShare]);

  const getSharePayload = useCallback(() => {
    if (!shareTarget || !shareUrl) return null;
    const message = `Documento «${shareTarget.title}». Enlace: ${shareUrl}`;
    return { url: shareUrl, message };
  }, [shareTarget, shareUrl]);

  const ensureReady = useCallback(() => {
    if (!shareUrl || isPreparing) {
      Toast.show({
        type: "info",
        text1: "Preparando enlace",
        text2: "Espera un momento…",
      });
      return false;
    }
    return true;
  }, [shareUrl, isPreparing]);

  const copyLink = useCallback(async () => {
    const payload = getSharePayload();
    if (!payload || !ensureReady()) return;

    setIsCopying(true);
    try {
      await Clipboard.setStringAsync(payload.url);
      Toast.show({
        type: "success",
        text1: "Enlace copiado",
        text2: "Ya puedes pegarlo donde quieras.",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "No se pudo copiar",
        text2: "Prueba de nuevo.",
      });
    } finally {
      setIsCopying(false);
    }
  }, [getSharePayload, ensureReady]);

  const shareWhatsApp = useCallback(async () => {
    const payload = getSharePayload();
    if (!payload || !ensureReady()) return;

    const waUrl = `whatsapp://send?text=${encodeURIComponent(payload.message)}`;
    try {
      const canOpen = await Linking.canOpenURL(waUrl);
      if (!canOpen) {
        await Share.share({ message: payload.message });
        return;
      }
      await Linking.openURL(waUrl);
    } catch {
      Toast.show({
        type: "error",
        text1: "No se pudo abrir WhatsApp",
        text2: "Comprueba que la app esté instalada.",
      });
    }
  }, [getSharePayload, ensureReady]);

  const shareEmail = useCallback(async () => {
    const payload = getSharePayload();
    if (!payload || !ensureReady()) return;

    const subject = encodeURIComponent(`Documento: ${shareTarget?.title ?? "Helu"}`);
    const body = encodeURIComponent(payload.message);
    const mailUrl = `mailto:?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailUrl);
      if (!canOpen) {
        Toast.show({
          type: "error",
          text1: "No se pudo abrir el correo",
          text2: "Configura una app de correo en el dispositivo.",
        });
        return;
      }
      await Linking.openURL(mailUrl);
    } catch {
      Toast.show({
        type: "error",
        text1: "Error al abrir correo",
        text2: "Inténtalo de nuevo.",
      });
    }
  }, [getSharePayload, ensureReady, shareTarget?.title]);

  const shareLink = useCallback(async () => {
    const payload = getSharePayload();
    if (!payload || !ensureReady()) return;

    try {
      await Share.share({ message: payload.url });
    } catch {
      /* usuario canceló */
    }
  }, [getSharePayload, ensureReady]);

  const shareMore = useCallback(async () => {
    const payload = getSharePayload();
    if (!payload || !ensureReady()) return;

    try {
      await Share.share({
        message: payload.message,
        url: payload.url,
      });
    } catch {
      /* usuario canceló */
    }
  }, [getSharePayload, ensureReady]);

  const isSharePendingFor = useCallback(
    (docId: string) => shareTarget?.id === docId && isPreparing,
    [shareTarget?.id, isPreparing],
  );

  return {
    shareTarget,
    shareUrl,
    isPreparing,
    isCopying,
    openShare,
    closeShare,
    copyLink,
    shareWhatsApp,
    shareEmail,
    shareLink,
    shareMore,
    isSharePendingFor,
  };
}
