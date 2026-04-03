import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useBackpackDocumentsQuery, useBackpackQuery, useDeleteBackpackMutation } from "@healthguard/api/hooks";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useRoute } from "@react-navigation/native";
import { isApiError, type DocumentPage, type Document } from "@healthguard/api";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { Camera, FileText, FileUp, Plus, Share2 } from "lucide-react-native";
import { DocumentTypeIcon, useAppTheme, colors, useDebounceSearch, formatDate, Button, Modal, SearchField, Typography, ActionButton, Spinner } from "@healthguard/ui";
import type { ThemeContextValue } from "@healthguard/ui";
import { useBackpackDetail } from "../hooks/useBackpackDetail";

type RouteParams = { id: string };

export function BackpackDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { id } = (route.params ?? {}) as RouteParams;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceSearch(search);
  const [fabOpen, setFabOpen] = useState(false);
  const [animation] = useState(() => new Animated.Value(0));
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

  const toggleFab = useCallback(() => {
    const toValue = fabOpen ? 0 : 1;
    Animated.spring(animation, { toValue, friction: 6, tension: 40, useNativeDriver: true }).start();
    setFabOpen(!fabOpen);
  }, [fabOpen, animation]);

  const closeFab = useCallback(() => {
    Animated.spring(animation, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }).start();
    setFabOpen(false);
  }, [animation]);

  const openAddFromDocs = useCallback(() => {
    closeFab();
    navigation.navigate("BackpackAddDocuments", { id });
  }, [closeFab, navigation, id]);

  const openUploadNew = useCallback(() => {
    closeFab();
    navigation.navigate("DocumentUpload", { backpackId: id, backpackName: backpackQuery.data?.name });
  }, [closeFab, navigation, id, backpackQuery.data?.name]);

  const openScanner = useCallback(() => {
    closeFab();
    navigation.navigate("Scanner", { backpackId: id, backpackName: backpackQuery.data?.name });
  }, [closeFab, navigation, id, backpackQuery.data?.name]);

  const openDocument = useCallback(
    (docId: string) => navigation.navigate("DocumentDetail", { id: docId }),
    [navigation],
  );

  const shareLink = detail.shareData?.shareUrl ?? "";
  const rotation = animation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] });
  const backdropOpacity = animation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const option1TranslateY = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -80] });
  const option2TranslateY = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -150] });
  const option3TranslateY = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -220] });
  const optionScale = animation.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const optionOpacity = animation.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

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
            colors={[colors.sky[500]]}
            tintColor={colors.sky[500]}
          />
        }
        ListEmptyComponent={
          docsQuery.isLoading ? (
            <View style={styles.center}>
              <Spinner size="lg" />
            </View>
          ) : (
            <View style={styles.center}>
              <Typography variant="body" color="secondary" align="center">
                {debouncedSearch.trim() ? "Sin resultados." : "Todavía no hay documentos en esta mochila."}
              </Typography>
            </View>
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

      {fabOpen && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeFab}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </Pressable>
      )}

      <Animated.View
        style={[styles.fabOption, { transform: [{ translateY: option3TranslateY }, { scale: optionScale }], opacity: optionOpacity }]}
        pointerEvents={fabOpen ? "auto" : "none"}
      >
        <TouchableOpacity style={styles.fabOptionRow} onPress={openAddFromDocs}>
          <View style={styles.fabOptionLabel}><Typography variant="label">Desde mis documentos</Typography></View>
          <View style={[styles.fabSmall, { backgroundColor: colors.sky[500] }]}><FileText color={colors.white} size={20} /></View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[styles.fabOption, { transform: [{ translateY: option2TranslateY }, { scale: optionScale }], opacity: optionOpacity }]}
        pointerEvents={fabOpen ? "auto" : "none"}
      >
        <TouchableOpacity style={styles.fabOptionRow} onPress={openUploadNew}>
          <View style={styles.fabOptionLabel}><Typography variant="label">Nuevo documento</Typography></View>
          <View style={[styles.fabSmall, { backgroundColor: colors.violet[500] }]}><FileUp color={colors.white} size={20} /></View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[styles.fabOption, { transform: [{ translateY: option1TranslateY }, { scale: optionScale }], opacity: optionOpacity }]}
        pointerEvents={fabOpen ? "auto" : "none"}
      >
        <TouchableOpacity style={styles.fabOptionRow} onPress={openScanner}>
          <View style={styles.fabOptionLabel}><Typography variant="label">Escanear</Typography></View>
          <View style={[styles.fabSmall, { backgroundColor: colors.emerald[500] }]}><Camera color={colors.white} size={20} /></View>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity style={styles.fab} onPress={toggleFab} activeOpacity={0.85} accessibilityLabel="Agregar documento a la mochila">
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Plus color={colors.white} size={28} />
        </Animated.View>
      </TouchableOpacity>

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
            <Image source={{ uri: detail.shareData.qrCodeUrl }} style={styles.qrImg} />
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
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
    fab: { position: "absolute", bottom: 24, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: colors.sky[500], alignItems: "center", justifyContent: "center", shadowColor: colors.sky[500], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, zIndex: 20 },
    fabOption: { position: "absolute", bottom: 24, right: 24, alignItems: "flex-end", zIndex: 15 },
    fabOptionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    fabOptionLabel: { backgroundColor: t.surface.bgCard, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
    fabSmall: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 6 },
    qrWrap: { alignItems: "center", justifyContent: "center", marginVertical: 8, padding: 10, backgroundColor: t.surface.bg, borderRadius: 16, borderWidth: 1, borderColor: t.border.medium },
    qrImg: { width: 170, height: 170 },
  });
}
