import { useCallback } from "react";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Document } from "@helu/api";
import type { ShareLink, ShareResourceType } from "@helu/api";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { buildBackpackShareSubtitle, buildDocumentShareSubtitle } from "./shareUtils";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function useShareFlow(navigation: Nav) {
  const openConfigureDocument = useCallback(
    (document: Document, backTitle?: string) => {
      navigation.navigate("ShareConfigure", {
        backTitle,
        resourceType: "document",
        resourceId: document.id,
        title: document.title,
        subtitle: buildDocumentShareSubtitle({
          uploadedAt: document.uploadedAt,
          fileSizeBytes: document.fileSizeBytes,
          format: document.format,
        }),
      });
    },
    [navigation],
  );

  const openConfigureBackpack = useCallback(
    (
      backpack: { id: string; name: string; documentCount?: number | null },
      backTitle?: string,
    ) => {
      navigation.navigate("ShareConfigure", {
        backTitle,
        resourceType: "backpack",
        resourceId: backpack.id,
        title: backpack.name,
        subtitle: buildBackpackShareSubtitle(backpack.documentCount),
        documentCount: backpack.documentCount ?? 0,
      });
    },
    [navigation],
  );

  const openQrResult = useCallback(
    (input: {
      shareUrl: string;
      title: string;
      resourceType: ShareResourceType;
      expiresAt: string | null;
      documentCount?: number;
      backTitle?: string;
    }) => {
      navigation.navigate("ShareQr", input);
    },
    [navigation],
  );

  const openHistory = useCallback(
    (backTitle?: string) => {
      navigation.navigate("SharedHistory", { backTitle });
    },
    [navigation],
  );

  const openDetail = useCallback(
    (link: ShareLink, backTitle?: string) => {
      navigation.navigate("SharedDetail", {
        backTitle,
        linkId: link.linkId,
        resourceType: link.resourceType,
      });
    },
    [navigation],
  );

  return {
    openConfigureDocument,
    openConfigureBackpack,
    openQrResult,
    openHistory,
    openDetail,
  };
}
