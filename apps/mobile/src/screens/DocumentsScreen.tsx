import { useState, useCallback, useMemo } from "react";
import { View, Text, TextInput, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Share, RefreshControl, Animated, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDocumentsQuery, useShareDocumentMutation } from "@healthguard/api/hooks";
import { Camera, Share2, Plus, FileUp, X, Search } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { DocumentTypeIcon } from "../components/DocumentTypeIcon";
import { colors, overlay, radii, spacing, fontSize, fontWeight, shadows, useAppTheme, useDebounceSearch, formatDate, PAGE_SIZE_LIST } from "@healthguard/ui";
import type { ThemeContextValue } from "@healthguard/ui";

export function DocumentsScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [fabOpen, setFabOpen] = useState(false);
  const [animation] = useState(() => new Animated.Value(0));

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceSearch(search);

  const docs = useDocumentsQuery(debouncedSearch, 1, PAGE_SIZE_LIST);
  const shareMut = useShareDocumentMutation();

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
      const result = await shareMut.mutateAsync(docId);
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
          <Search size={18} color={t.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o etiqueta..."
            placeholderTextColor={t.text.muted}
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
              <X size={18} color={t.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {docs.isLoading && !docs.isRefetching ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.sky[500]} /></View>
      ) : (
        <FlatList
          data={docs.data?.items ?? []}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={docs.isRefetching}
              onRefresh={() => docs.refetch()}
              colors={[colors.sky[500]]}
              tintColor={colors.sky[500]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("DocumentDetail", { id: item.id, title: item.title })}
            >
              <DocumentTypeIcon format={item.format} documentTypeName={item.documentType?.name} />
              <View style={styles.info}>
                <Text style={styles.docTitle}>{item.title}</Text>
                <Text style={styles.docSub}>
                  {formatDate(item.uploadedAt)}
                  {item.documentType?.name ? ` • ${item.documentType.name}` : ""}
                </Text>
              </View>
              <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare(item.id, item.title)}>
                <Share2 size={20} color={t.text.secondary} />
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
          <View style={[styles.fabSmall, { backgroundColor: colors.violet[500] }]}>
            <FileUp color={colors.white} size={22} />
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
          <View style={[styles.fabSmall, { backgroundColor: colors.sky[500] }]}>
            <Camera color={colors.white} size={22} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Main FAB */}
      <TouchableOpacity style={styles.fab} onPress={toggleFab} activeOpacity={0.85}>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Plus color={colors.white} size={28} />
        </Animated.View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: t.surface.bg },
    header:      { padding: spacing[6], paddingBottom: spacing[4], backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium },
    title:       { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: t.text.primary },
    list:        { padding: spacing[4], gap: spacing[3] },
    searchBar: {
      marginTop: 14,
      backgroundColor: t.border.light,
      borderRadius: 14,
      paddingHorizontal: spacing[3],
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: t.text.primary,
      paddingVertical: 0,
    },
    clearBtn: {
      width: 32,
      height: 32,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.border.medium,
    },
    card:       { flexDirection: "row", alignItems: "center", gap: spacing[4], backgroundColor: t.surface.bgCard, padding: spacing[4], borderRadius: radii.lg, ...shadows.md },
    info:       { flex: 1 },
    docTitle:   { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: t.text.primary, marginBottom: 2 },
    docSub:     { fontSize: fontSize.sm, color: t.text.secondary },
    shareBtn:   { padding: spacing[2] },
    center:     { flex: 1, alignItems: "center", justifyContent: "center" },
    empty:      { color: t.text.secondary, fontSize: fontSize.base },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: overlay.dark,
    },

    fab: {
      position: "absolute",
      bottom: spacing[6],
      right: spacing[6],
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.sky[500],
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.sky[500],
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 20,
    },

    fabOption: {
      position: "absolute",
      bottom: spacing[6],
      right: spacing[6],
      alignItems: "flex-end",
      zIndex: 15,
    },
    fabOptionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },
    fabOptionLabel: {
      backgroundColor: t.surface.bgCard,
      paddingHorizontal: 14,
      paddingVertical: spacing[2],
      borderRadius: 10,
      ...shadows.md,
    },
    fabOptionText: {
      fontSize: 14,
      fontWeight: fontWeight.semibold,
      color: t.text.primary,
    },
    fabSmall: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 6,
    },
  });
}
