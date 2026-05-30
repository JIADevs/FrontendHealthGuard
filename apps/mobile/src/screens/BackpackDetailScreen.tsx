import { useCallback, useEffect, useMemo } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  useBackpackQuery,
  useDeleteBackpackMutation,
  useInfiniteBackpackDocuments,
} from "@helu/api/hooks";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useRoute } from "@react-navigation/native";
import { isApiError, type Document } from "@helu/api";
import type { RootStackParamList } from "../navigation/RootNavigator";
import {
  Spinner,
  Typography,
  useAppTheme,
  spacing,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { useBackpackDetail } from "../hooks/useBackpackDetail";
import {
  BackpackDetailHeader,
  BackpackDetailShareRow,
  BackpackDetailContentSection,
  BackpackDetailDeleteRow,
} from "../components/backpacks";
import { sumDocumentsBytes } from "../components/backpacks/utils/sumDocumentsBytes";
import { useShareFlow } from "../components/share";

type RouteParams = { id: string };

export function BackpackDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { id } = (route.params ?? {}) as RouteParams;

  const backpackQuery = useBackpackQuery(id);
  const docsQuery = useInfiniteBackpackDocuments(id);

  const docs = useMemo(
    () => docsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [docsQuery.data],
  );

  const detail = useBackpackDetail(id);
  const deleteMut = useDeleteBackpackMutation();
  const shareFlow = useShareFlow(navigation);

  const totalBytes = useMemo(() => sumDocumentsBytes(docs), [docs]);

  useEffect(() => {
    if (docsQuery.hasNextPage && !docsQuery.isFetchingNextPage) {
      void docsQuery.fetchNextPage();
    }
  }, [docsQuery.hasNextPage, docsQuery.isFetchingNextPage, docsQuery.fetchNextPage]);

  const handleLoadMore = useCallback(() => {
    if (docsQuery.hasNextPage && !docsQuery.isFetchingNextPage) {
      void docsQuery.fetchNextPage();
    }
  }, [docsQuery]);

  const handleRemoveDocument = useCallback(
    (doc: Document) => {
      Alert.alert(
        "Quitar documento",
        `¿Querés quitar "${doc.title}" de esta mochila? El documento no se elimina de tu biblioteca.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Quitar",
            style: "destructive",
            onPress: () => detail.removeDocument(doc.id, doc.title),
          },
        ],
      );
    },
    [detail],
  );

  const handleDeleteBackpack = useCallback(() => {
    Alert.alert("Eliminar mochila", "¿Querés eliminar esta mochila? Los documentos no se borran.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () =>
          deleteMut.mutate(id, {
            onSuccess: () => {
              Toast.show({ type: "success", text1: "Mochila eliminada" });
              navigation.goBack();
            },
            onError: (err) => {
              const msg = isApiError(err) ? err.message : "No se pudo eliminar la mochila.";
              Toast.show({ type: "error", text1: "Error al eliminar", text2: msg });
            },
          }),
      },
    ]);
  }, [deleteMut, id, navigation]);

  const openDocument = useCallback(
    (doc: Document) =>
      navigation.navigate("DocumentDetail", {
        id: doc.id,
        title: doc.title,
        backTitle: "Mochila",
      }),
    [navigation],
  );

  if (backpackQuery.isLoading && !backpackQuery.isRefetching) {
    return (
      <SafeAreaView style={styles.center}>
        <Spinner size="lg" />
      </SafeAreaView>
    );
  }

  const backpack = backpackQuery.data;
  if (!backpack) {
    return (
      <SafeAreaView style={styles.center}>
        <Typography variant="body" color="error">
          No se pudo cargar la mochila.
        </Typography>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={
              (docsQuery.isRefetching && !docsQuery.isFetchingNextPage) ||
              backpackQuery.isRefetching
            }
            onRefresh={() => {
              void backpackQuery.refetch();
              void docsQuery.refetch();
            }}
            colors={[t.brand.fg]}
            tintColor={t.brand.fg}
          />
        }
      >
        <BackpackDetailHeader backpack={backpack} totalBytes={totalBytes} />

        <BackpackDetailShareRow
          onShare={() =>
            shareFlow.openConfigureBackpack(
              { id: backpack.id, name: backpack.name, documentCount: docs.length },
              "Mochila",
            )
          }
          onEdit={() => navigation.navigate("BackpackEdit", { id })}
        />

        {docsQuery.isLoading ? (
          <View style={styles.docsLoading}>
            <Spinner size="md" />
          </View>
        ) : (
          <BackpackDetailContentSection
            documents={docs}
            onDocumentPress={openDocument}
            onAddPress={() => navigation.navigate("BackpackAddDocuments", { id })}
            onRemoveDocument={handleRemoveDocument}
            removingDocId={detail.removingDocId}
            hasNextPage={docsQuery.hasNextPage}
            isFetchingNextPage={docsQuery.isFetchingNextPage}
            onLoadMore={handleLoadMore}
          />
        )}

        <BackpackDetailDeleteRow
          onPress={handleDeleteBackpack}
          loading={deleteMut.isPending}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    scroll: { flex: 1 },
    content: {
      padding: spacing[5],
      gap: spacing[5],
      paddingBottom: spacing[10],
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing[6],
      backgroundColor: t.surface.bg,
    },
    docsLoading: {
      paddingVertical: spacing[8],
      alignItems: "center",
    },
  });
}
