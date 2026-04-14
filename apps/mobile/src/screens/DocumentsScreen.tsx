import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Share, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDocumentsQuery, useShareDocumentMutation } from "@helu/api/hooks";
import { Camera, Share2, FileUp } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { DocumentTypeIcon } from "@helu/ui";
import { colors, palette, overlay, radii, spacing, shadows, useAppTheme, useDebounceSearch, formatDate, PAGE_SIZE_LIST, Card, cardContentStyle, SearchField, Typography, Spinner, EmptyState } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { ExpandableFAB } from "../components/ExpandableFAB";

export function DocumentsScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceSearch(search);

  const docs = useDocumentsQuery(debouncedSearch, 1, PAGE_SIZE_LIST);
  const shareMut = useShareDocumentMutation();

  async function handleShare(docId: string, title: string) {
    try {
      const result = await shareMut.mutateAsync(docId);
      await Share.share({
        message: `Te comparto este documento de Helu: ${title}\n\n${result.shareUrl}`,
        url: result.shareUrl,
        title: title,
      });
    } catch (err) {
      console.warn("Error compartiendo documento", err);
    }
  }

  const fabOptions = useMemo(() => [
    {
      label: 'Subir archivo',
      icon: <FileUp color={colors.white} size={22} />,
      color: colors.violet[500],
      onPress: () => navigation.navigate('DocumentUpload' as any),
    },
    {
      label: 'Escanear',
      icon: <Camera color={colors.white} size={22} />,
      color: palette.brand[500],
      onPress: () => navigation.navigate('Scanner' as any),
    },
  ], [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Typography variant="h2">Documentos</Typography>
          <TouchableOpacity
            style={styles.shareAllBtn}
            onPress={() => navigation.navigate("ShareDocuments")}
            accessibilityRole="button"
            accessibilityLabel="Compartir documentos"
          >
            <Share2 size={18} color={palette.brand[500]} />
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: 14 }}>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o etiqueta..."
            accessibilityLabel="Buscar documentos"
          />
        </View>
      </View>

      {docs.isLoading && !docs.isRefetching ? (
        <View style={styles.center}><Spinner size="lg" /></View>
      ) : (
        <FlatList
          data={docs.data?.items ?? []}
          keyExtractor={(d) => d.id}
          contentContainerStyle={cardContentStyle}
          refreshControl={
            <RefreshControl
              refreshing={docs.isRefetching}
              onRefresh={() => docs.refetch()}
              colors={[palette.brand[500]]}
              tintColor={palette.brand[500]}
            />
          }
          renderItem={({ item }) => (
            <Card
              title={item.title}
              subtitle={`${formatDate(item.uploadedAt)}${item.documentType?.name ? ` • ${item.documentType.name}` : ""}`}
              icon={<DocumentTypeIcon format={item.format} documentTypeName={item.documentType?.name} />}
              onPress={() => navigation.navigate("DocumentDetail", { id: item.id, title: item.title })}
              actions={
                <TouchableOpacity onPress={() => handleShare(item.id, item.title)}>
                  <Share2 size={20} color={t.text.secondary} />
                </TouchableOpacity>
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              message={debouncedSearch.trim()
                ? "Sin resultados para esta búsqueda."
                : "No tienes documentos aún."}
            />
          }
        />
      )}

      <ExpandableFAB options={fabOptions} />
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: t.surface.bg },
    header:      { padding: spacing[6], paddingBottom: spacing[4], backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium },
    titleRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    shareAllBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: palette.brand[50], borderWidth: 1, borderColor: palette.brand[200] },
    center:     { flex: 1, alignItems: "center", justifyContent: "center" },
  });
}
