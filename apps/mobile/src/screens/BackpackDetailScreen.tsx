import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useBackpackDocumentsQuery, useBackpackQuery, useDeleteBackpackMutation } from "@helu/api/hooks";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useRoute } from "@react-navigation/native";
import { isApiError, type DocumentPage, type Document } from "@helu/api";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { Camera, FileText, FileUp, Share2 } from "lucide-react-native";
import { DocumentTypeIcon, useAppTheme, colors, palette, useDebounceSearch, formatDate, Button, Modal, SearchField, Typography, ActionButton, Spinner, EmptyState } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { useBackpackDetail } from "../hooks/useBackpackDetail";
import { ExpandableFAB } from "../components/ExpandableFAB";
import { qrCodeImageUriForShareUrl, resolveExpoReachableUrl } from "../utils/shareLinks";

type RouteParams = { id: string };

export function BackpackDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { id } = (route.params ?? {}) as RouteParams;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceSearch(search);
  const [deleteDocTarget, setDeleteDocTarget] = useState<Document | null>(null);

  const backpackQuery = useBackpackQuery(id);
  const docsQuery = useBackpackDocumentsQuery(id, debouncedSearch);
  const docs = useMemo(() => (docsQuery.data?.items ?? []) as DocumentPage["items"], [docsQuery.data]);

  const detail = useBackpackDetail(id);
  const deleteMut = useDeleteBackpackMutation();

  const handleRemove = useCallback((doc: Document) => {
    setDeleteDocTarget(doc);
  }, []);

  const handleDeleteBackpack = useCallback(() => {
    Alert.alert("Eliminar mochila", "¿Querés eliminar esta mochila y sus enlaces?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar", style: "destructive", onPress: () => deleteMut.mutate(id, {
          onSuccess: () => { Toast.show({ type: "success", text1: "Mochila eliminada" }); navigation.goBack(); },
          onError: (err) => { const msg = isApiError(err) ? err.message : "No se pudo eliminar la mochila."; Toast.show({ type: "error", text1: "Error al eliminar", text2: msg }); },
        }),
      },
    ]);
  }, [deleteMut, id, navigation]);

  const fabOptions = useMemo(() => [
    {
      label: 'Desde mis documentos',
      icon: <FileText color={colors.white} size={20} />,
      color: t.brand.fg,
      onPress: () => navigation.navigate('BackpackAddDocuments' as any, { id }),
    },
    {
      label: 'Nuevo documento',
      icon: <FileUp color={colors.white} size={20} />,
      color: t.accent.aiFg,
      onPress: () => navigation.navigate('DocumentUpload' as any, { backpackId: id, backpackName: backpackQuery.data?.name }),
    },
    {
      label: 'Escanear',
      icon: <Camera color={colors.white} size={20} />,
      color: t.accent.notifFg,
      onPress: () => navigation.navigate('Scanner' as any, { backpackId: id, backpackName: backpackQuery.data?.name }),
    },
  ], [navigation, id, backpackQuery.data?.name]);

  const openDocument = useCallback(
    (docId: string) => navigation.navigate("DocumentDetail", { id: docId }),
    [navigation],
  );

  const shareLink = resolveExpoReachableUrl(detail.shareData?.shareUrl ?? "");
  const shareQrUri = detail.shareData?.shareUrl
    ? qrCodeImageUriForShareUrl(detail.shareData.shareUrl)
    : "";

  if (backpackQuery.isLoading && !backpackQuery.isRefetching) {
    return (
      <SafeAreaView style={styles.center}>
        <Spinner size="lg" />
      </SafeAreaView>
    );
  }

  const backpack = backpackQuery.data;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Typography variant="h3" numberOfLines={1}>{backpack?.name ?? "Mochila"}</Typography>
          <Typography variant="bodySm" color="secondary">
            {backpack?.documentCount ?? 0} documento{(backpack?.documentCount ?? 0) === 1 ? "" : "s"}
          </Typography>
        </View>

        <ActionButton action="delete" onPress={handleDeleteBackpack} />
      </View>

      <View style={{ margin: 16, marginTop: 10 }}>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar documentos..."
          accessibilityLabel="Buscar dentro de la mochila"
        />
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
              message={debouncedSearch.trim() ? "Sin resultados." : "Todavía no hay documentos en esta mochila."}
            />
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openDocument(item.id)} accessibilityLabel={`Abrir ${item.title}`}>
            <DocumentTypeIcon format={item.format} documentTypeName={item.documentType?.name} size={24} />
            <View style={styles.cardInfo}>
              <Typography variant="label" numberOfLines={1}>{item.title}</Typography>
              <Typography variant="bodySm" color="secondary">
                {formatDate(item.uploadedAt)}{item.documentType?.name ? ` • ${item.documentType.name}` : ""}
              </Typography>
            </View>
            <View style={styles.actionsRight}>
              <ActionButton
                action="delete"
                size="sm"
                onPress={() => handleRemove(item)}
                disabled={detail.removingDocId === item.id}
                loading={detail.removingDocId === item.id}
              />
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.bottomActions}>
        <Button onPress={detail.shareBackpack} disabled={detail.isSharing} loading={detail.isSharing} fullWidth>
          <Share2 size={18} color={colors.white} /> Compartir
        </Button>
        <ActionButton action="edit" onPress={() => navigation.navigate("BackpackEdit", { id })} />
      </View>

      <ExpandableFAB options={fabOptions} accessibilityLabel="Agregar documento a la mochila" />

      {detail.shareData && (
        <Modal
          title="Compartir mochila"
          onClose={detail.clearShareData}
          footer={
            <>
              <Button fullWidth onPress={() => Share.share({ url: shareLink, message: "Comparto una mochila con documentos médicos." })}>
                Compartir
              </Button>
              <Button variant="secondary" fullWidth onPress={detail.clearShareData}>Cerrar</Button>
            </>
          }
        >
          <Typography variant="bodySm" color="secondary">Link (válido hasta expiración):</Typography>
          <View style={{ paddingVertical: 4, marginBottom: 8 }}>
            <Typography variant="bodySm" numberOfLines={2}>{shareLink}</Typography>
          </View>
          <View style={styles.qrWrap}>
            <Image source={{ uri: shareQrUri }} style={styles.qrImg} />
          </View>
        </Modal>
      )}

      {deleteDocTarget && (
        <Modal
          title="Eliminar documento"
          onClose={() => setDeleteDocTarget(null)}
          footer={
            <>
              <Button variant="secondary" fullWidth onPress={() => setDeleteDocTarget(null)}>Cancelar</Button>
              <Button variant="danger" fullWidth onPress={() => {
                const target = deleteDocTarget;
                setDeleteDocTarget(null);
                detail.removeDocument(target.id, target.title);
              }}>Eliminar</Button>
            </>
          }
        >
          <Typography variant="bodySm" color="secondary">
            ¿Querés eliminar "{deleteDocTarget.title}" de esta mochila?
          </Typography>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    header: { padding: 20, backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium, flexDirection: "row", gap: 12, alignItems: "center" },
    iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: t.surface.bgCard },
    list: { padding: 16, gap: 12, paddingBottom: 96 },
    card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: t.surface.bgCard, borderRadius: 16, borderWidth: 1, borderColor: t.border.medium },
    cardInfo: { flex: 1 },
    actionsRight: { flexDirection: "row" },
    removeBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: t.surface.bg, borderWidth: 1, borderColor: t.border.medium },
    bottomActions: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, backgroundColor: t.surface.bgCard, borderTopWidth: 1, borderTopColor: t.border.medium, flexDirection: "row", gap: 10, alignItems: "center", paddingRight: 92 },
    ghostBtn: { backgroundColor: t.surface.bgCard, borderWidth: 1, borderColor: t.border.medium },
    qrWrap: { alignItems: "center", justifyContent: "center", marginVertical: 8, padding: 10, backgroundColor: t.surface.bg, borderRadius: 16, borderWidth: 1, borderColor: t.border.medium },
    qrImg: { width: 170, height: 170 },
  });
}
