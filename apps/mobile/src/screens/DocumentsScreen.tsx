import { useMemo, useCallback } from "react";
import { View, StyleSheet, SectionList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { Spinner, EmptyState, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { useDocumentsList } from "../hooks/useDocumentsList";
import type { Document } from "../hooks/useDocumentsList";
import {
  DocumentsListHeader,
  DocumentsSearchToolbar,
  DocumentsFilterChips,
  DocumentsFilterSheet,
  DocumentsSectionHeader,
  DocumentListItem,
  DocumentsFAB,
} from "../components/documents";

export function DocumentsScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    search,
    setSearch,
    debouncedSearch,
    draftFilters,
    setDraftFilters,
    categoryFilter,
    setCategoryFilter,
    filterSheetVisible,
    openFilterSheet,
    closeFilterSheet,
    applyFilters,
    hasHiddenSelection,
    hasActiveFilter,
    tagCategories,
    tagsLoading,
    sections,
    totalCount,
    isLoading,
    isRefetching,
    refetch,
  } = useDocumentsList();

  const handleOpen = useCallback(
    (doc: Document) => {
      navigation.navigate("DocumentDetail", { id: doc.id, title: doc.title });
    },
    [navigation],
  );

  const handleUpload = useCallback(() => {
    navigation.navigate("DocumentUpload");
  }, [navigation]);

  const isEmpty = sections.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <DocumentsListHeader totalCount={totalCount} />
        <DocumentsSearchToolbar
          value={search}
          onChange={setSearch}
          onFilterPress={openFilterSheet}
          filterActive={hasActiveFilter}
        />
        <DocumentsFilterChips
          selected={categoryFilter}
          onSelect={setCategoryFilter}
          onMorePress={openFilterSheet}
          hasHiddenSelection={hasHiddenSelection}
        />
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
            <DocumentListItem document={item} onPress={() => handleOpen(item)} />
          )}
          ListEmptyComponent={
            <EmptyState
              message={
                debouncedSearch.trim() || hasActiveFilter
                  ? "Sin resultados para esta búsqueda."
                  : "No tienes documentos aún."
              }
            />
          }
        />
      )}

      <DocumentsFAB onPress={handleUpload} />

      <DocumentsFilterSheet
        visible={filterSheetVisible}
        draft={draftFilters}
        onChangeDraft={setDraftFilters}
        onApply={applyFilters}
        onClose={closeFilterSheet}
        tagCategories={tagCategories}
        tagsLoading={tagsLoading}
      />
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
