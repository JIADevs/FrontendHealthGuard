import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import {
  useDocumentQuery,
  useTagCategoriesQuery,
} from "@helu/api/hooks";
import { useDocumentDeleteWithUndo } from "./useDocumentDeleteWithUndo";
import { getSignedUrl, type Document } from "@helu/api";
import { resolveDocFormat } from "@helu/ui";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { resolveDocumentTheme } from "../components/documents/utils/resolveDocumentTheme";
import {
  buildTagCategoryMap,
  getDocumentDetailTags,
  getDocumentSubtitle,
} from "../components/documents/utils/documentDetailMeta";

export function useDocumentDetail(id: string) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const docQuery = useDocumentQuery(id);
  const tagCatalog = useTagCategoriesQuery();
  const {
    deleteTarget,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deletePending,
  } = useDocumentDeleteWithUndo({
    onDeleted: () => navigation.goBack(),
  });

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

  const handleDelete = useCallback(() => {
    if (!document) return;
    requestDelete(document);
  }, [document, requestDelete]);

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
    deletePending,
    deleteTarget,
    cancelDelete,
    confirmDelete,
    handleDelete,
  };
}
