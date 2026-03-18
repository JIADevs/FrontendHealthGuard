import { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, TextInput, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Share, RefreshControl, Animated, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { getDocuments, shareDocument } from "@healthguard/api";
import { FileText, Camera, Share2, Plus, FileUp, X, Search } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function DocumentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [fabOpen, setFabOpen] = useState(false);
  const [animation] = useState(() => new Animated.Value(0));

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

  const docs = useQuery({
    queryKey: ["documents", 1, debouncedSearch],
    queryFn: () =>
      getDocuments({
        page: 1,
        limit: 20,
        searchQuery: debouncedSearch || undefined,
      }),
    staleTime: 5_000,
    keepPreviousData: true,
  });

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

  function handleNavigate(screen: string) {
    closeFab();
    navigation.navigate(screen);
  }

  async function handleShare(docId: string, title: string) {
    try {
      const result = await shareDocument(docId);
      await Share.share({
        message: `Te comparto este documento de HealthGuard: ${title}\n\n${result.shareUrl}`,
        url: result.shareUrl,
        title: title,
      });
    } catch (err) {
      console.warn("Error compartiendo documento", err);
    }
  }

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

  const optionScale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const optionOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Documentos</Text>
        <View style={styles.searchBar}>
          <Search size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o etiqueta..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Buscar documentos"
          />
          {search.trim().length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => setSearch("")}
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
            >
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {docs.isLoading && !docs.isRefetching ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#0ea5e9" /></View>
      ) : (
        <FlatList
          data={docs.data?.items ?? []}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl 
              refreshing={docs.isRefetching} 
              onRefresh={() => docs.refetch()} 
              colors={["#0ea5e9"]}
              tintColor="#0ea5e9"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("DocumentDetail", { id: item.id, title: item.title })}
            >
              <View style={styles.iconBg}><FileText size={24} color="#0ea5e9" /></View>
              <View style={styles.info}>
                <Text style={styles.docTitle}>{item.title}</Text>
                <Text style={styles.docSub}>{new Date(item.uploadedAt).toLocaleDateString()} • {item.format}</Text>
              </View>
              <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare(item.id, item.title)}>
                <Share2 size={20} color="#64748b" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>
                {debouncedSearch.trim()
                  ? "Sin resultados para esta búsqueda."
                  : "No tienes documentos aún."}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB Backdrop */}
      {fabOpen && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeFab}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </Pressable>
      )}

      {/* Upload from device option */}
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
        <TouchableOpacity style={styles.fabOptionRow} onPress={() => handleNavigate("DocumentUpload")}>
          <View style={styles.fabOptionLabel}>
            <Text style={styles.fabOptionText}>Subir archivo</Text>
          </View>
          <View style={[styles.fabSmall, { backgroundColor: "#8b5cf6" }]}>
            <FileUp color="#fff" size={22} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Scan with camera option */}
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
        <TouchableOpacity style={styles.fabOptionRow} onPress={() => handleNavigate("Scanner")}>
          <View style={styles.fabOptionLabel}>
            <Text style={styles.fabOptionText}>Escanear</Text>
          </View>
          <View style={[styles.fabSmall, { backgroundColor: "#0ea5e9" }]}>
            <Camera color="#fff" size={22} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Main FAB */}
      <TouchableOpacity style={styles.fab} onPress={toggleFab} activeOpacity={0.85}>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Plus color="#fff" size={28} />
        </Animated.View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingBottom: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  list: { padding: 16, gap: 12 },
  searchBar: {
    marginTop: 14,
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    paddingVertical: 0,
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  card: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: "#fff", padding: 16, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconBg: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#e0f2fe", alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  docTitle: { fontSize: 15, fontWeight: "600", color: "#0f172a", marginBottom: 2 },
  docSub: { fontSize: 13, color: "#64748b" },
  shareBtn: { padding: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { color: "#64748b", fontSize: 15 },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },

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
});
