import { useCallback, useMemo, useState } from "react";
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
import { useBackpackDocumentsQuery, useBackpackQuery, useDeleteBackpackMutation } from "@healthguard/api/hooks";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useRoute } from "@react-navigation/native";
import { isApiError, type DocumentPage, type Document } from "@healthguard/api";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { DocumentTypeIcon } from "@healthguard/ui";
import { Camera, FileText, FileUp, Plus, Search, Share2, Trash2, Edit2, X } from "lucide-react-native";
import { useAppTheme, colors, useDebounceSearch, formatDate } from "@healthguard/ui";
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
        <ActivityIndicator size="large" color={colors.sky[500]} />
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
          <Trash2 size={18} color={colors.error[500]} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={t.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar documentos..."
          placeholderTextColor={t.text.muted}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Buscar dentro de la mochila"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.trim().length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setSearch("")} accessibilityLabel="Limpiar búsqueda">
            <X size={18} color={t.text.secondary} />
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
            colors={[colors.sky[500]]}
            tintColor={colors.sky[500]}
          />
        }
        ListEmptyComponent={
          docsQuery.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.sky[500]} />
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
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardSub}>
                {formatDate(item.uploadedAt)}
                {item.documentType?.name ? ` • ${item.documentType.name}` : ""}
              </Text>
            </View>
            <View style={styles.actionsRight}>
              <TouchableOpacity
                onPress={() => handleRemove(item)}
                style={styles.removeBtn}
                disabled={detail.removingDocId === item.id}
                accessibilityLabel={`Eliminar ${item.title} del backpack`}
              >
                {detail.removingDocId === item.id ? (
                  <ActivityIndicator size="small" color={t.text.secondary} />
                ) : (
                  <Trash2 size={18} color={t.text.secondary} />
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.bottomBtn, styles.primaryBtn]}
          onPress={detail.shareBackpack}
          disabled={detail.isSharing}
          accessibilityLabel="Compartir mochila"
        >
          {detail.isSharing
            ? <ActivityIndicator size="small" color={colors.white} />
            : <Share2 size={18} color={colors.white} />}
          <Text style={styles.primaryBtnText}>Compartir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomBtn, styles.ghostBtn]}
          onPress={() => navigation.navigate("BackpackEdit", { id })}
          accessibilityLabel="Editar mochila"
        >
          <Edit2 size={18} color={colors.sky[500]} />
        </TouchableOpacity>
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
          <View style={styles.fabOptionLabel}><Text style={styles.fabOptionText}>Desde mis documentos</Text></View>
          <View style={[styles.fabSmall, { backgroundColor: colors.sky[500] }]}><FileText color={colors.white} size={20} /></View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[styles.fabOption, { transform: [{ translateY: option2TranslateY }, { scale: optionScale }], opacity: optionOpacity }]}
        pointerEvents={fabOpen ? "auto" : "none"}
      >
        <TouchableOpacity style={styles.fabOptionRow} onPress={openUploadNew}>
          <View style={styles.fabOptionLabel}><Text style={styles.fabOptionText}>Nuevo documento</Text></View>
          <View style={[styles.fabSmall, { backgroundColor: colors.violet[500] }]}><FileUp color={colors.white} size={20} /></View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[styles.fabOption, { transform: [{ translateY: option1TranslateY }, { scale: optionScale }], opacity: optionOpacity }]}
        pointerEvents={fabOpen ? "auto" : "none"}
      >
        <TouchableOpacity style={styles.fabOptionRow} onPress={openScanner}>
          <View style={styles.fabOptionLabel}><Text style={styles.fabOptionText}>Escanear</Text></View>
          <View style={[styles.fabSmall, { backgroundColor: colors.emerald[500] }]}><Camera color={colors.white} size={20} /></View>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity style={styles.fab} onPress={toggleFab} activeOpacity={0.85} accessibilityLabel="Agregar documento a la mochila">
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Plus color={colors.white} size={28} />
        </Animated.View>
      </TouchableOpacity>

      {detail.shareData && (
        <View style={styles.modalOverlay} pointerEvents="auto">
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Compartir mochila</Text>
            <Text style={styles.modalSub}>Link (válido hasta expiración):</Text>
            <Text style={styles.linkText} numberOfLines={2}>{shareLink}</Text>
            <View style={styles.qrWrap}>
              <Image source={{ uri: detail.shareData.qrCodeUrl }} style={styles.qrImg} />
            </View>

            <TouchableOpacity
              style={[styles.modalBtn, styles.primaryBtn]}
              onPress={() => Share.share({ url: shareLink, message: "Comparto una mochila con documentos médicos." })}
              accessibilityLabel="Compartir link"
            >
              <Text style={styles.primaryBtnText}>Compartir</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalBtn, styles.secondaryBtn]} onPress={detail.clearShareData} accessibilityLabel="Cerrar">
              <Text style={styles.secondaryBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {deleteDocTarget && (
        <View style={styles.modalOverlay} pointerEvents="auto">
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Eliminar documento</Text>
            <Text style={styles.modalSub}>
              ¿Querés eliminar "{deleteDocTarget.title}" de esta mochila?
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.secondaryBtn]}
                onPress={() => setDeleteDocTarget(null)}
                accessibilityLabel="Cancelar eliminación"
              >
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.dangerBtn]}
                onPress={() => {
                  const target = deleteDocTarget;
                  setDeleteDocTarget(null);
                  detail.removeDocument(target.id, target.title);
                }}
                accessibilityLabel="Confirmar eliminación"
              >
                <Text style={styles.dangerBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    header: { padding: 20, backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium, flexDirection: "row", gap: 12, alignItems: "center" },
    title: { fontSize: 22, fontWeight: "800", color: t.text.primary, marginBottom: 2 },
    subtitle: { fontSize: 13, color: t.text.secondary },
    iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: t.surface.bgCard },
    searchBar: { margin: 16, marginTop: 10, backgroundColor: t.surface.bgCard, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: t.border.medium },
    searchInput: { flex: 1, fontSize: 14, color: t.text.primary, paddingVertical: 0 },
    clearBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: t.border.medium },
    list: { padding: 16, gap: 12, paddingBottom: 96 },
    empty: { color: t.text.secondary, fontSize: 15, textAlign: "center" },
    card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: t.surface.bgCard, borderRadius: 16, borderWidth: 1, borderColor: t.border.medium },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 14, fontWeight: "800", color: t.text.primary, marginBottom: 2 },
    cardSub: { fontSize: 13, color: t.text.secondary },
    actionsRight: { flexDirection: "row" },
    removeBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: t.surface.bg, borderWidth: 1, borderColor: t.border.medium },
    bottomActions: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, backgroundColor: t.surface.bgCard, borderTopWidth: 1, borderTopColor: t.border.medium, flexDirection: "row", gap: 10, alignItems: "center", paddingRight: 92 },
    bottomBtn: { flex: 1, borderRadius: 16, paddingVertical: 12, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
    primaryBtn: { backgroundColor: colors.sky[500] },
    primaryBtnText: { color: colors.white, fontWeight: "800", fontSize: 14 },
    secondaryBtn: { backgroundColor: t.surface.bgCard, borderWidth: 1, borderColor: colors.sky[500] },
    secondaryBtnText: { color: colors.sky[500], fontWeight: "800", fontSize: 14 },
    dangerBtn: { backgroundColor: colors.error[500] },
    dangerBtnText: { color: colors.white, fontWeight: "800", fontSize: 14 },
    ghostBtn: { backgroundColor: t.surface.bgCard, borderWidth: 1, borderColor: t.border.medium },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
    fab: { position: "absolute", bottom: 24, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: colors.sky[500], alignItems: "center", justifyContent: "center", shadowColor: colors.sky[500], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, zIndex: 20 },
    fabOption: { position: "absolute", bottom: 24, right: 24, alignItems: "flex-end", zIndex: 15 },
    fabOptionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    fabOptionLabel: { backgroundColor: t.surface.bgCard, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
    fabOptionText: { fontSize: 14, fontWeight: "600", color: t.text.primary },
    fabSmall: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 6 },
    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
    modal: { width: "90%", backgroundColor: t.surface.bgCard, borderRadius: 18, padding: 18, gap: 10, elevation: 10, shadowColor: "#000", shadowOpacity: 0.25 },
    modalTitle: { fontSize: 18, fontWeight: "900", color: t.text.primary, marginTop: 2 },
    modalSub: { fontSize: 13, color: t.text.secondary, marginTop: -2 },
    confirmActions: { flexDirection: "row", gap: 10, marginTop: 8 },
    linkText: { fontSize: 13, color: t.text.primary, paddingVertical: 4 },
    qrWrap: { alignItems: "center", justifyContent: "center", marginVertical: 8, padding: 10, backgroundColor: t.surface.bg, borderRadius: 16, borderWidth: 1, borderColor: t.border.medium },
    qrImg: { width: 170, height: 170 },
    modalBtn: { flex: 1, minHeight: 48, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  });
}
