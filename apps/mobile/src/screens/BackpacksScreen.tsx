import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBackpacksQuery } from "@helu/api/hooks";
import { isApiError, type BackpackPage } from "@helu/api";
import { FileText, Plus } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import Toast from "react-native-toast-message";
import { useAppTheme, colors, palette, useDebounceSearch, formatDate, Card, cardContentStyle, SearchField, Typography, Spinner } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

export function BackpacksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceSearch(search);

  const query = useBackpacksQuery(debouncedSearch);

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
        <Typography variant="h2">Mochilas</Typography>

        <View style={styles.toolbarRow}>
          <View style={{ flex: 1 }}>
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nombre..."
              accessibilityLabel="Buscar mochilas"
            />
          </View>

          <TouchableOpacity style={styles.createBtn} onPress={navigateToCreate} accessibilityLabel="Crear mochila">
            <Plus size={18} color={colors.white} />
            <Text style={styles.createBtnText}>Crear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {query.isLoading && !query.isRefetching ? (
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(b) => b.id}
          contentContainerStyle={cardContentStyle}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              colors={[palette.brand[500]]}
              tintColor={palette.brand[500]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Typography variant="body" color="secondary" align="center">
                {debouncedSearch.trim()
                  ? "Sin mochilas para esta búsqueda."
                  : "Todavía no tenés mochilas. Creá la primera."}
              </Typography>
            </View>
          }
          renderItem={({ item }) => (
            <Card
              title={item.name}
              subtitle={`${item.documentCount} documento${item.documentCount === 1 ? "" : "s"}` + (item.createdAt ? ` • ${formatDate(item.createdAt)}` : "")}
              icon={<FileText size={22} color={palette.brand[500]} />}
              onPress={() => navigateToDetail(item.id)}
            />
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
    titleRow: { marginBottom: 12 },
    toolbarRow: { flexDirection: "row", gap: 12, alignItems: "center" },
    createBtn: { backgroundColor: palette.brand[500], borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", gap: 8, alignItems: "center" },
    createBtnText: { color: colors.white, fontSize: 14, fontWeight: "700" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  });
}
