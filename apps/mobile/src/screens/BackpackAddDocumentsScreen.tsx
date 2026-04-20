import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useBackpackQuery, useAddDocToBackpackMutation } from "@helu/api/hooks";
import { getBackpackDocuments, getDocuments, isApiError, type Document, type DocumentPage } from "@helu/api";
import { DocumentTypeIcon } from "@helu/ui";
import { Plus, Check } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAppTheme, colors, palette, useDebounceSearch, formatDate, SearchField, Typography, Spinner, EmptyState } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

type RouteParams = { id: string };

export function BackpackAddDocumentsScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { id } = (route.params ?? {}) as RouteParams;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceSearch(search);

  const backpackQuery = useBackpackQuery(id);

  const existingDocsQuery = useQuery({
    queryKey: ["backpack-doc-ids", id],
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

  const existingIds = useMemo(
    () => existingDocsQuery.data ?? new Set<string>(),
    [existingDocsQuery.data]
  );

  const docsQuery = useQuery({
    queryKey: ["documents", 1, debouncedSearch, "for-backpack", id],
    queryFn: () =>
      getDocuments({
        page: 1,
        limit: 20,
        searchQuery: debouncedSearch || undefined,
      }),
    enabled: !!id,
    staleTime: 5_000,
    placeholderData: keepPreviousData,
  });

  const docs = useMemo(
    () => (docsQuery.data?.items ?? []).filter((d) => !existingIds.has(d.id)),
    [docsQuery.data, existingIds]
  );

  const [addingIds, setAddingIds] = useState<Record<string, "loading" | "done">>({});

  const addMut = useAddDocToBackpackMutation();

  const handleAdd = useCallback(
    (doc: Document) => {
      if (addingIds[doc.id]) return;
      setAddingIds((prev) => ({ ...prev, [doc.id]: "loading" }));
      addMut.mutate(
        { backpackId: id, documentId: doc.id },
        {
          onSuccess: (_data, vars) => {
            const title = docs.find((d) => d.id === vars.documentId)?.title ?? "Documento";
            setAddingIds((prev) => ({ ...prev, [vars.documentId]: "done" }));
            Toast.show({ type: "success", text1: "Documento agregado", text2: title });
          },
          onError: (err, vars) => {
            setAddingIds((prev) => {
              const next = { ...prev };
              delete next[vars.documentId];
              return next;
            });
            const message = isApiError(err) ? err.message : "No se pudo agregar el documento.";
            Toast.show({ type: "error", text1: "Error al agregar", text2: message });
          },
        }
      );
    },
    [addingIds, addMut, id, docs]
  );

  const openDocument = useCallback(
    (doc: Document) => navigation.navigate("DocumentDetail", { id: doc.id, title: doc.title }),
    [navigation]
  );

  const backpackName = backpackQuery.data?.name ?? "";

  if (backpackQuery.isLoading && !backpackQuery.isRefetching) {
    return (
      <SafeAreaView style={styles.center}>
        <Spinner size="lg" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h3" numberOfLines={1}>
          Agregar a: {backpackName || "Mochila"}
        </Typography>

        <View style={{ marginTop: 14 }}>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar documentos..."
            accessibilityLabel="Buscar documentos para agregar"
          />
        </View>
      </View>

      <FlatList
        data={docs}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={docsQuery.isRefetching}
            onRefresh={() => docsQuery.refetch()}
            colors={[t.brand.fg]}
            tintColor={t.brand.fg}
          />
        }
        ListEmptyComponent={
          docsQuery.isLoading ? (
            <View style={styles.center}>
              <Spinner size="lg" />
            </View>
          ) : (
            <EmptyState
              message={debouncedSearch.trim()
                ? "Sin resultados."
                : "No hay documentos disponibles para agregar."}
            />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.cardRow}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => openDocument(item)}
              accessibilityLabel={`Abrir documento ${item.title}`}
            >
              <DocumentTypeIcon format={item.format} documentTypeName={item.documentType?.name} size={24} />
              <View style={styles.cardInfo}>
                <Typography variant="label" numberOfLines={1}>{item.title}</Typography>
                <Typography variant="caption" color="secondary">
                  {formatDate(item.uploadedAt)}
                  {item.documentType?.name ? ` • ${item.documentType.name}` : ""}
                </Typography>
              </View>
            </TouchableOpacity>

            <AddButton item={item} addingIds={addingIds} onAdd={handleAdd} />
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.goBack()} accessibilityLabel="Volver">
        <Text style={styles.fabText}>Cerrar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function AddButton({
  item,
  addingIds,
  onAdd,
}: {
  item: Document;
  addingIds: Record<string, "loading" | "done">;
  onAdd: (doc: Document) => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const state = addingIds[item.id];

  let icon: React.ReactNode;
  if (state === "loading") {
    icon = <ActivityIndicator size="small" color={colors.white} />;
  } else if (state === "done") {
    icon = <Check size={18} color={colors.white} />;
  } else {
    icon = <Plus size={18} color={colors.white} />;
  }

  return (
    <TouchableOpacity
      style={[styles.addBtn, state === "loading" && styles.addBtnLoading, state === "done" && styles.addBtnDone]}
      onPress={() => onAdd(item)}
      disabled={!!state}
      accessibilityLabel={`Agregar ${item.title} a la mochila`}
    >
      {icon}
    </TouchableOpacity>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    header: { padding: 20, backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium },
    title: { fontSize: 20, fontWeight: "800", color: t.text.primary, marginBottom: 14 },
    list: { padding: 16, gap: 12, paddingBottom: 90 },
    empty: { color: t.text.secondary, fontSize: 15, textAlign: "center" },
    cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    card: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: t.surface.bgCard, borderRadius: 16, borderWidth: 1, borderColor: t.border.medium },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 14, fontWeight: "800", color: t.text.primary, marginBottom: 2 },
    cardSub: { fontSize: 13, color: t.text.secondary },
    addBtn: { backgroundColor: t.brand.fg, borderRadius: 16, width: 48, height: 48, alignItems: "center", justifyContent: "center" },
    addBtnLoading: { opacity: 0.7 },
    addBtnDone: { backgroundColor: t.accent.docFg },
    fab: { position: "absolute", bottom: 22, left: 16, right: 16, backgroundColor: t.surface.bgCard, borderRadius: 16, borderWidth: 1, borderColor: t.border.medium, paddingVertical: 14, alignItems: "center", elevation: 2 },
    fabText: { color: t.text.primary, fontWeight: "900" },
  });
}
