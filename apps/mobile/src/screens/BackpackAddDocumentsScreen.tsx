import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import {
  useBackpackQuery,
  useAddDocToBackpackMutation,
  useInfiniteDocumentsCatalog,
  backpackQueryKeys,
} from "@helu/api/hooks";
import { getBackpackDocuments, isApiError, type Document, type DocumentPage } from "@helu/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAppTheme, useDebounceSearch, Spinner } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  BackpackAddDocumentsHeader,
  BackpackDocumentPickerList,
} from "../components/backpacks";

type RouteParams = { id: string };

export function BackpackAddDocumentsScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { id } = (route.params ?? {}) as RouteParams;

  const [search, setSearch] = useState("");
  const [addingIds, setAddingIds] = useState<Record<string, "loading" | "done">>({});
  const debouncedSearch = useDebounceSearch(search);

  const backpackQuery = useBackpackQuery(id);

  const existingDocsQuery = useQuery({
    queryKey: backpackQueryKeys.backpackDocIds(id),
    queryFn: async () => {
      const ids = new Set<string>();
      let page = 1;
      let totalPages = 1;
      do {
        const res: DocumentPage = await getBackpackDocuments({
          backpackId: id,
          page,
          limit: 100,
        });
        res.items.forEach((doc) => ids.add(doc.id));
        totalPages = res.totalPages;
        page += 1;
      } while (page <= totalPages);
      return ids;
    },
    enabled: !!id,
    staleTime: 5_000,
  });

  const existingIdsReady = existingDocsQuery.isSuccess;

  const existingIds = useMemo(
    () => existingDocsQuery.data ?? new Set<string>(),
    [existingDocsQuery.data],
  );

  const catalogQuery = useInfiniteDocumentsCatalog(debouncedSearch);

  const docs = useMemo(() => {
    if (!existingIdsReady) return [];
    const items = catalogQuery.data?.pages.flatMap((p) => p.items) ?? [];
    return items.filter(
      (d) => !existingIds.has(d.id) && addingIds[d.id] !== "done",
    );
  }, [catalogQuery.data, existingIds, existingIdsReady, addingIds]);

  const addMut = useAddDocToBackpackMutation();

  const handleAdd = useCallback(
    (doc: Document) => {
      if (addingIds[doc.id]) return;
      setAddingIds((prev) => ({ ...prev, [doc.id]: "loading" }));
      addMut.mutate(
        { backpackId: id, documentId: doc.id },
        {
          onSuccess: (_data, vars) => {
            const title = doc.title ?? "Documento";
            setAddingIds((prev) => ({ ...prev, [vars.documentId]: "done" }));
            Toast.show({ type: "success", text1: "Documento agregado", text2: title });
          },
          onError: (err, vars) => {
            if (isApiError(err) && err.isConflict) {
              setAddingIds((prev) => ({ ...prev, [vars.documentId]: "done" }));
              Toast.show({
                type: "info",
                text1: "Ya en la mochila",
                text2: "Este documento ya estaba agregado.",
              });
              return;
            }
            setAddingIds((prev) => {
              const next = { ...prev };
              delete next[vars.documentId];
              return next;
            });
            const message = isApiError(err) ? err.message : "No se pudo agregar el documento.";
            Toast.show({ type: "error", text1: "Error al agregar", text2: message });
          },
        },
      );
    },
    [addingIds, addMut, id],
  );

  const openDocument = useCallback(
    (doc: Document) => navigation.navigate("DocumentDetail", { id: doc.id, title: doc.title }),
    [navigation],
  );

  const handleLoadMore = useCallback(() => {
    if (catalogQuery.hasNextPage && !catalogQuery.isFetchingNextPage) {
      void catalogQuery.fetchNextPage();
    }
  }, [catalogQuery]);

  const listLoading =
    !existingIdsReady ||
    existingDocsQuery.isLoading ||
    (catalogQuery.isLoading && docs.length === 0);

  if (backpackQuery.isLoading && !backpackQuery.isRefetching) {
    return (
      <SafeAreaView style={styles.center} edges={["bottom"]}>
        <Spinner size="lg" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <BackpackAddDocumentsHeader search={search} onSearchChange={setSearch} />

      <BackpackDocumentPickerList
        mode="add"
        documents={docs}
        loading={listLoading}
        isRefetching={catalogQuery.isRefetching && !catalogQuery.isFetchingNextPage}
        onRefresh={() => {
          void catalogQuery.refetch();
          void existingDocsQuery.refetch();
        }}
        emptyMessage={
          debouncedSearch.trim()
            ? "Sin resultados."
            : "No hay documentos disponibles para agregar."
        }
        onDocumentPress={openDocument}
        addingIds={addingIds}
        onAdd={handleAdd}
        hasNextPage={catalogQuery.hasNextPage}
        isFetchingNextPage={catalogQuery.isFetchingNextPage}
        onLoadMore={handleLoadMore}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.goBack()} accessibilityLabel="Volver">
        <Text style={styles.fabText}>Cerrar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    fab: {
      position: "absolute",
      bottom: 22,
      left: 16,
      right: 16,
      backgroundColor: t.surface.bgCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border.medium,
      paddingVertical: 14,
      alignItems: "center",
      elevation: 2,
    },
    fabText: { color: t.text.primary, fontWeight: "900" },
  });
}
