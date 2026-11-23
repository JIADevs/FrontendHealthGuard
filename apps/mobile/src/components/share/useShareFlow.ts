import { useCallback } from "react";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Document, ShareLink } from "@helu/api";
import type { RootStackParamList } from "../../navigation/RootNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Every way into «Compartir» and «Compartidos» (module 7). */
export function useShareFlow(navigation: Nav) {
  /** Step 1: choose documents or a backpack. */
  const openChoose = useCallback(() => navigation.navigate("ShareChoose"), [navigation]);

  /** Step 2 straight from a document. */
  const openConfigureDocument = useCallback(
    (document: Pick<Document, "id" | "title" | "kind" | "documentType" | "documentDate" | "uploadedAt">, backTitle?: string) => {
      navigation.navigate("ShareConfigure", { backTitle, target: { kind: "documents", documents: [document] } });
    },
    [navigation],
  );

  /** Step 2 straight from a backpack. */
  const openConfigureBackpack = useCallback(
    (backpack: { id: string; name: string; documentCount?: number | null }, backTitle?: string) => {
      navigation.navigate("ShareConfigure", {
        backTitle,
        target: { kind: "backpack", id: backpack.id, name: backpack.name, documentCount: backpack.documentCount ?? 0 },
      });
    },
    [navigation],
  );

  /** «Mostrar QR» of an existing link. */
  const openQr = useCallback(
    (link: ShareLink) => {
      navigation.navigate("ShareQr", {
        shareUrl: link.shareUrl,
        title: link.title,
        resourceType: link.resourceType,
        expiresAt: link.expiresAt ?? null,
        documentCount: link.documentCount ?? 1,
        mode: "view",
      });
    },
    [navigation],
  );

  const openHistory = useCallback(
    (backTitle?: string) => navigation.navigate("SharedHistory", { backTitle }),
    [navigation],
  );

  const openDetail = useCallback(
    (link: ShareLink, backTitle?: string) => {
      navigation.navigate("SharedDetail", { backTitle, linkId: link.linkId, resourceType: link.resourceType });
    },
    [navigation],
  );

  return { openChoose, openConfigureDocument, openConfigureBackpack, openQr, openHistory, openDetail };
}
