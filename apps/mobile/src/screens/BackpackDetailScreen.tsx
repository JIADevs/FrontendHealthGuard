import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getBackpackById, getBackpackDocuments, removeDocFromBackpack, deleteBackpack, shareBackpack, isApiError, type DocumentPage, type Document } from "@healthguard/api";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { DocumentTypeIcon } from "../components/DocumentTypeIcon";
import { Camera, FileText, FileUp, Plus, Search, Share2, Trash2, Edit2, X } from "lucide-react-native";
type RouteParams = { id: string };

export function BackpackDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { id } = (route.params ?? {}) as RouteParams;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fabOpen, setFabOpen] = useState(false);
  const [animation] = useState(() => new Animated.Value(0));
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

  const docsQuery = useQuery({
    queryKey: ["backpack-docs", id, 1, debouncedSearch],
    queryFn: () =>
      getBackpackDocuments({
        backpackId: id,
        page: 1,
        limit: 20,
        searchQuery: debouncedSearch || undefined,
      }),
    enabled: !!id,
    staleTime: 5_000,
    keepPreviousData: true,
  });

  const docs = useMemo(() => (docsQuery.data?.items ?? []) as DocumentPage["items"], [docsQuery.data]);

  const removeMut = useMutation({
    mutationFn: ({ documentId }: { documentId: string; title: string }) =>
      removeDocFromBackpack(id, documentId),
    onMutate: async ({ documentId, title }) => {
      await queryClient.cancelQueries({ queryKey: ["backpack-docs", id] });
      const previousDocs = queryClient.getQueryData(["backpack-docs", id, 1, debouncedSearch]);
      queryClient.setQueryData(
        ["backpack-docs", id, 1, debouncedSearch],
        (old: DocumentPage | undefined) =>
          old ? { ...old, items: old.items.filter((d) => d.id !== documentId) } : old
      );
      return { previousDocs, title };
    },
    onError: (err, _, ctx) => {
      queryClient.setQueryData(["backpack-docs", id, 1, debouncedSearch], ctx?.previousDocs);
      const message = isApiError(err) ? err.message : "No se pudo eliminar el documento.";
      Toast.show({ type: "error", text1: "Error al eliminar", text2: message });
    },
    onSuccess: (_data, vars) => {
      Toast.show({ type: "success", text1: "Documento eliminado", text2: vars.title });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["backpack-docs", id], exact: false });
      queryClient.invalidateQueries({ queryKey: ["backpack", id], exact: false });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async () => deleteBackpack(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backpacks"], exact: false });
      Toast.show({ type: "success", text1: "Mochila eliminada" });
      navigation.goBack();
    },
    onError: (err) => {
      const message = isApiError(err) ? err.message : "No se pudo eliminar la mochila.";
      Toast.show({ type: "error", text1: "Error al eliminar", text2: message });
    },
  });

  const shareMut = useMutation({
    mutationFn: async () => shareBackpack(id),
  });

  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState<null | { shareUrl: string; qrCodeUrl: string }>(null);

  const handleRemove = useCallback(
    (doc: Document) => {
      Alert.alert("Eliminar del backpack", `¿Querés eliminar "${doc.title}" de esta mochila?`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => removeMut.mutate({ documentId: doc.id, title: doc.title }),
        },
      ]);
    },
    [removeMut]
  );

  const handleDeleteBackpack = useCallback(() => {
    Alert.alert("Eliminar mochila", "¿Querés eliminar esta mochila y sus enlaces?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => deleteMut.mutate() },
    ]);
  }, [deleteMut]);

  const toggleFab = useCallback(() => {
    const toValue = fabOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setFabOpen(!fabOpen);
  }, [fabOpen, animation]);

  const closeFab = useCallback(() => {
    Animated.spring(animation, {
      toValue: 0,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setFabOpen(false);
  }, [animation]);

  const openAddFromDocs = useCallback(() => {
    closeFab();
    navigation.navigate("BackpackAddDocuments", { id });
  }, [closeFab, navigation, id]);

  const openUploadNew = useCallback(() => {
    closeFab();
    navigation.navigate("DocumentUpload", {
      backpackId: id,
      backpackName: backpackQuery.data?.name,
    });
  }, [closeFab, navigation, id, backpackQuery.data?.name]);

  const openScanner = useCallback(() => {
    closeFab();
    navigation.navigate("Scanner", {
      backpackId: id,
      backpackName: backpackQuery.data?.name,
    });
  }, [closeFab, navigation, id, backpackQuery.data?.name]);

  const openShare = useCallback(async () => {
    try {
      const res = await shareMut.mutateAsync();
      setShareData({ shareUrl: res.shareUrl, qrCodeUrl: res.qrCodeUrl });
      setShareOpen(true);
      Toast.show({ type: "success", text1: "Link generado", text2: "Listo para compartir" });
    } catch (err) {
      const message = isApiError(err) ? err.message : "No se pudo generar el link de compartición.";
      Toast.show({ type: "error", text1: "Error al compartir", text2: message });
    }
  }, [shareMut]);

  const openDocument = useCallback(
    (docId: string) => navigation.navigate("DocumentDetail", { id: docId }),
    [navigation]
  );

  const shareLink = useMemo(() => shareData?.shareUrl ?? "", [shareData]);
  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });
  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const option1TranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  });
  const option2TranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -150],
  });
  const option3TranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -220],
  });
  const optionScale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });
  const optionOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  if (backpackQuery.isLoading && !backpackQuery.isRefetching) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </SafeAreaView>
    );
  }

  const backpack = backpackQuery.data;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {backpack?.name ?? "Mochila"}
          </Text>
          <Text style={styles.subtitle}>
            {backpack?.documentCount ?? 0} documento{(backpack?.documentCount ?? 0) === 1 ? "" : "s"}
          </Text>
        </View>

        <TouchableOpacity style={styles.iconBtn} onPress={handleDeleteBackpack} accessibilityLabel="Eliminar mochila">
          <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar documentos..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Buscar dentro de la mochila"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.trim().length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setSearch("")} accessibilityLabel="Limpiar búsqueda">
            <X size={18} color="#64748b" />
          </TouchableOpacity>
        )}
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
                {debouncedSearch.trim() ? "Sin resultados." : "Todavía no hay documentos en esta mochila."}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openDocument(item.id)} accessibilityLabel={`Abrir ${item.title}`}>
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
            <View style={styles.actionsRight}>
              <TouchableOpacity
                onPress={() => handleRemove(item)}
                style={styles.removeBtn}
                accessibilityLabel={`Eliminar ${item.title} del backpack`}
              >
                <Trash2 size={18} color="#64748b" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.bottomBtn, styles.primaryBtn]}
          onPress={openShare}
          accessibilityLabel="Compartir mochila"
        >
          <Share2 size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Compartir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomBtn, styles.ghostBtn]}
          onPress={() => navigation.navigate("BackpackEdit", { id })}
          accessibilityLabel="Editar mochila"
        >
          <Edit2 size={18} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      {fabOpen && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeFab}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </Pressable>
      )}

      <Animated.View
        style={[
          styles.fabOption,
          {
            transform: [{ translateY: option3TranslateY }, { scale: optionScale }],
            opacity: optionOpacity,
          },
        ]}
        pointerEvents={fabOpen ? "auto" : "none"}
      >
        <TouchableOpacity style={styles.fabOptionRow} onPress={openAddFromDocs}>
          <View style={styles.fabOptionLabel}>
            <Text style={styles.fabOptionText}>Desde mis documentos</Text>
          </View>
          <View style={[styles.fabSmall, { backgroundColor: "#0ea5e9" }]}>
            <FileText color="#fff" size={20} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.fabOption,
          {
            transform: [{ translateY: option2TranslateY }, { scale: optionScale }],
            opacity: optionOpacity,
          },
        ]}
        pointerEvents={fabOpen ? "auto" : "none"}
      >
        <TouchableOpacity style={styles.fabOptionRow} onPress={openUploadNew}>
          <View style={styles.fabOptionLabel}>
            <Text style={styles.fabOptionText}>Nuevo documento</Text>
          </View>
          <View style={[styles.fabSmall, { backgroundColor: "#8b5cf6" }]}>
            <FileUp color="#fff" size={20} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.fabOption,
          {
            transform: [{ translateY: option1TranslateY }, { scale: optionScale }],
            opacity: optionOpacity,
          },
        ]}
        pointerEvents={fabOpen ? "auto" : "none"}
      >
        <TouchableOpacity style={styles.fabOptionRow} onPress={openScanner}>
          <View style={styles.fabOptionLabel}>
            <Text style={styles.fabOptionText}>Escanear</Text>
          </View>
          <View style={[styles.fabSmall, { backgroundColor: "#14b8a6" }]}>
            <Camera color="#fff" size={20} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity style={styles.fab} onPress={toggleFab} activeOpacity={0.85} accessibilityLabel="Agregar documento a la mochila">
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Plus color="#fff" size={28} />
        </Animated.View>
      </TouchableOpacity>

      {shareOpen && shareData && (
        <View style={styles.modalOverlay} pointerEvents="auto">
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Compartir mochila</Text>
            <Text style={styles.modalSub}>Link (válido hasta expiración):</Text>
            <Text style={styles.linkText} numberOfLines={2}>
              {shareLink}
            </Text>
            <View style={styles.qrWrap}>
              <Image source={{ uri: shareData.qrCodeUrl }} style={styles.qrImg} />
            </View>

            <TouchableOpacity
              style={[styles.modalBtn, styles.primaryBtn]}
              onPress={() => {
                Share.share({ url: shareLink, message: "Comparto una mochila con documentos médicos." });
              }}
              accessibilityLabel="Compartir link"
            >
              <Text style={styles.primaryBtnText}>Compartir</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalBtn, styles.secondaryBtn]} onPress={() => setShareOpen(false)} accessibilityLabel="Cerrar">
              <Text style={styles.secondaryBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  header: { padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", flexDirection: "row", gap: 12, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 2 },
  subtitle: { fontSize: 13, color: "#64748b" },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  searchBar: { margin: 16, marginTop: 10, backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a", paddingVertical: 0 },
  clearBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#e2e8f0" },
  list: { padding: 16, gap: 12, paddingBottom: 96 },
  empty: { color: "#64748b", fontSize: 15, textAlign: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 2 },
  cardSub: { fontSize: 13, color: "#64748b" },
  actionsRight: { flexDirection: "row" },
  removeBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0" },
  bottomActions: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e2e8f0", flexDirection: "row", gap: 10, alignItems: "center", paddingRight: 92 },
  bottomBtn: { flex: 1, borderRadius: 16, paddingVertical: 12, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  primaryBtn: { backgroundColor: "#0ea5e9" },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  secondaryBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#0ea5e9" },
  secondaryBtnText: { color: "#0ea5e9", fontWeight: "800", fontSize: 14 },
  ghostBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0ea5e9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  fabOption: {
    position: "absolute",
    bottom: 24,
    right: 24,
    alignItems: "flex-end",
    zIndex: 15,
  },
  fabOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fabOptionLabel: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  fabOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  fabSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  modal: { width: "90%", backgroundColor: "#fff", borderRadius: 18, padding: 18, gap: 10, elevation: 10, shadowColor: "#000", shadowOpacity: 0.25 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#0f172a", marginTop: 2 },
  modalSub: { fontSize: 13, color: "#64748b", marginTop: -2 },
  linkText: { fontSize: 13, color: "#0f172a", paddingVertical: 4 },
  qrWrap: { alignItems: "center", justifyContent: "center", marginVertical: 8, padding: 10, backgroundColor: "#f8fafc", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  qrImg: { width: 170, height: 170 },
  modalBtn: { borderRadius: 14, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
});

