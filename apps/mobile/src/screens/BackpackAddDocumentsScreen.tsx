import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { getBackpackById, getBackpackDocuments, getDocuments, addDocToBackpack, isApiError, type Document } from "@healthguard/api";
import { DocumentTypeIcon } from "../components/DocumentTypeIcon";
import { Search, Plus, Check, X } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type RouteParams = { id: string };

export function BackpackAddDocumentsScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { id } = (route.params ?? {}) as RouteParams;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = search.trim();
    if (!trimmed) {
      setDebouncedSearch("");
      return;
    }
    debounceRef.current = setTimeout(() => setDebouncedSearch(trimmed), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const backpackQuery = useQuery({
    queryKey: ["backpack", id],
    queryFn: () => getBackpackById(id),
    enabled: !!id,
  });

  const existingDocsQuery = useQuery({
    queryKey: ["backpack-docs", id, 1, ""],
    queryFn: () => getBackpackDocuments({ backpackId: id, page: 1, limit: 200 }),
    enabled: !!id,
    staleTime: 5_000,
  });

  const existingIds = useMemo(
    () => new Set((existingDocsQuery.data?.items ?? []).map((d) => d.id)),
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
    keepPreviousData: true,
  });

  const docs = useMemo(
    () => (docsQuery.data?.items ?? []).filter((d) => !existingIds.has(d.id)),
    [docsQuery.data, existingIds]
  );

  const [addingIds, setAddingIds] = useState<Record<string, "loading" | "done">>({});

  const addMut = useMutation({
    mutationFn: async ({ documentId }: { documentId: string }) => addDocToBackpack(id, documentId),
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["backpack-docs", id], exact: false });
      queryClient.invalidateQueries({ queryKey: ["backpack", id], exact: false });
    },
  });

  const handleAdd = useCallback(
    (doc: Document) => {
      if (addingIds[doc.id]) return;
      setAddingIds((prev) => ({ ...prev, [doc.id]: "loading" }));
      addMut.mutate({ documentId: doc.id });
    },
    [addingIds, addMut]
  );

  const openDocument = useCallback(
    (doc: Document) => navigation.navigate("DocumentDetail", { id: doc.id, title: doc.title }),
    [navigation]
  );

  const backpackName = backpackQuery.data?.name ?? "";

  if (backpackQuery.isLoading && !backpackQuery.isRefetching) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          Agregar a: {backpackName || "Mochila"}
        </Text>

        <View style={styles.searchBar}>
          <Search size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar documentos..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Buscar documentos para agregar"
          />
          {search.trim().length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setSearch("")} accessibilityLabel="Limpiar búsqueda">
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          )}
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
            colors={["#0ea5e9"]}
            tintColor="#0ea5e9"
          />
        }
        ListEmptyComponent={
          docsQuery.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#0ea5e9" />
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.empty}>
                {debouncedSearch.trim()
                  ? "Sin resultados."
                  : existingIds.size > 0 && (docsQuery.data?.items.length ?? 0) === existingIds.size
                  ? "Todos tus documentos ya están en esta mochila."
                  : "No hay documentos disponibles."}
              </Text>
            </View>
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
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardSub}>
                  {new Date(item.uploadedAt).toLocaleDateString()}
                  {item.documentType?.name ? ` • ${item.documentType.name}` : ""}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.addBtn,
                addingIds[item.id] === "loading" && styles.addBtnLoading,
                addingIds[item.id] === "done" && styles.addBtnDone,
              ]}
              onPress={() => handleAdd(item)}
              disabled={!!addingIds[item.id]}
              accessibilityLabel={`Agregar ${item.title} a la mochila`}
            >
              {addingIds[item.id] === "loading" ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : addingIds[item.id] === "done" ? (
                <Check size={18} color="#fff" />
              ) : (
                <Plus size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.goBack()} accessibilityLabel="Volver">
        <Text style={styles.fabText}>Cerrar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  header: { padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  title: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 14 },
  searchBar: { backgroundColor: "#f1f5f9", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a" },
  clearBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#e2e8f0" },
  list: { padding: 16, gap: 12, paddingBottom: 90 },
  empty: { color: "#64748b", fontSize: 15, textAlign: "center" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  card: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 2 },
  cardSub: { fontSize: 13, color: "#64748b" },
  addBtn: { backgroundColor: "#0ea5e9", borderRadius: 16, width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  addBtnLoading: { opacity: 0.7 },
  addBtnDone: { backgroundColor: "#22c55e" },
  fab: { position: "absolute", bottom: 22, left: 16, right: 16, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", paddingVertical: 14, alignItems: "center", elevation: 2 },
  fabText: { color: "#0f172a", fontWeight: "900" },
});

