import { useCallback, useEffect, useMemo } from "react";
import { View, StyleSheet, SectionList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { isApiError } from "@helu/api";
import type { RootStackParamList } from "../navigation/RootNavigator";
import Toast from "react-native-toast-message";
import { Spinner, EmptyState, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { useBackpacksList } from "../hooks/useBackpacksList";
import {
  BackpacksListHeader,
  BackpacksSearchToolbar,
  BackpackListItem,
  BackpacksFAB,
} from "../components/backpacks";
import { DocumentsSectionHeader } from "../components/documents/DocumentsSectionHeader";

export function BackpacksScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    search,
    setSearch,
    debouncedSearch,
    sections,
    totalCount,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useBackpacksList();

  const navigateToCreate = useCallback(() => {
    navigation.navigate("BackpackEdit", { id: undefined });
  }, [navigation]);

  const navigateToDetail = useCallback(
    (id: string) => navigation.navigate("BackpackDetail", { id }),
    [navigation],
  );

  useEffect(() => {
    if (!error) return;
    const message = isApiError(error) ? error.message : "Error inesperado";
    Toast.show({ type: "error", text1: "No se pudieron cargar mochilas", text2: message });
  }, [error]);

  const isEmpty = sections.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <BackpacksListHeader totalCount={totalCount} />
        <BackpacksSearchToolbar value={search} onChange={setSearch} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={isEmpty ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              colors={[t.brand.fg]}
              tintColor={t.brand.fg}
            />
          }
          renderSectionHeader={({ section }) => (
            <DocumentsSectionHeader title={section.title} />
          )}
          renderItem={({ item }) => (
            <BackpackListItem
              backpack={item}
              onPress={() => navigateToDetail(item.id)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              message={
                debouncedSearch.trim()
                  ? "Sin mochilas para esta búsqueda."
                  : "Todavía no tenés mochilas. Creá la primera."
              }
            />
          }
        />
      )}

      <BackpacksFAB onPress={navigateToCreate} />
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.surface.bg,
    },
    header: {
      paddingHorizontal: spacing[5],
      paddingTop: spacing[4],
      paddingBottom: spacing[3],
      backgroundColor: t.surface.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: t.border.medium,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    list: {
      paddingBottom: spacing[12] + 56,
    },
    emptyList: {
      flexGrow: 1,
      paddingBottom: spacing[12] + 56,
    },
  });
}
