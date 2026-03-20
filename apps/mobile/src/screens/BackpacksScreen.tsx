import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getBackpacks, isApiError, type BackpackPage } from "@healthguard/api";
import { FileText, Plus, Search, X } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import Toast from "react-native-toast-message";
import { useAppTheme, colors } from "@healthguard/ui";
import type { ThemeContextValue } from "@healthguard/ui";

export function BackpacksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
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

  const query = useQuery({
    queryKey: ["backpacks", 1, debouncedSearch],
    queryFn: () =>
      getBackpacks({
        page: 1,
        limit: 20,
        searchQuery: debouncedSearch || undefined,
      }),
    staleTime: 5_000,
    placeholderData: keepPreviousData,
  });

  const items = useMemo(() => (query.data?.items ?? []) as BackpackPage["items"], [query.data]);

  const navigateToCreate = useCallback(() => {
    navigation.navigate("BackpackEdit", { id: undefined });
  }, [navigation]);

  const navigateToDetail = useCallback(
    (id: string) => navigation.navigate("BackpackDetail", { id }),
    [navigation]
  );

  useEffect(() => {
    if (!query.error) return;
    const message = isApiError(query.error) ? query.error.message : "Error inesperado";
    Toast.show({ type: "error", text1: "No se pudieron cargar mochilas", text2: message });
  }, [query.error]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mochilas</Text>

        <View style={styles.toolbarRow}>
          <View style={styles.searchBar}>
            <Search size={18} color={t.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre..."
              placeholderTextColor={t.text.muted}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              accessibilityLabel="Buscar mochilas"
            />
            {search.trim().length > 0 && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => setSearch("")}
                accessibilityRole="button"
                accessibilityLabel="Limpiar búsqueda"
              >
                <X size={18} color={t.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.createBtn} onPress={navigateToCreate} accessibilityLabel="Crear mochila">
            <Plus size={18} color={colors.white} />
            <Text style={styles.createBtnText}>Crear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {query.isLoading && !query.isRefetching ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.sky[500]} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              colors={[colors.sky[500]]}
              tintColor={colors.sky[500]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>
                {debouncedSearch.trim()
                  ? "Sin mochilas para esta búsqueda."
                  : "Todavía no tenés mochilas. Creá la primera."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigateToDetail(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Abrir mochila ${item.name}`}
            >
              <View style={styles.iconBg}>
                <FileText size={22} color={colors.sky[500]} />
              </View>
              <View style={styles.info}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardSub}>
                  {item.documentCount} documento{item.documentCount === 1 ? "" : "s"}
                  {item.createdAt ? ` • ${new Date(item.createdAt).toLocaleDateString()}` : ""}
                </Text>
              </View>
              <Pressable style={styles.chevron} accessibilityLabel="Detalle" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    header: { padding: 24, paddingBottom: 16, backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium },
    title: { fontSize: 24, fontWeight: "800", color: t.text.primary, marginBottom: 12 },
    toolbarRow: { flexDirection: "row", gap: 12, alignItems: "center" },
    searchBar: {
      flex: 1,
      backgroundColor: t.border.light,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    searchInput: { flex: 1, fontSize: 14, color: t.text.primary, paddingVertical: 0 },
    clearBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: t.border.medium },
    createBtn: { backgroundColor: colors.sky[500], borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", gap: 8, alignItems: "center" },
    createBtnText: { color: colors.white, fontSize: 14, fontWeight: "700" },
    list: { padding: 16, gap: 12 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    empty: { color: t.text.secondary, fontSize: 15, textAlign: "center" },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      backgroundColor: t.surface.bgCard,
      padding: 16,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    iconBg: { width: 48, height: 48, borderRadius: 12, backgroundColor: t.border.light, alignItems: "center", justifyContent: "center" },
    info: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: "700", color: t.text.primary, marginBottom: 2 },
    cardSub: { fontSize: 13, color: t.text.secondary },
    chevron: { width: 10, height: 10, borderRadius: 6, backgroundColor: t.border.medium },
  });
}
