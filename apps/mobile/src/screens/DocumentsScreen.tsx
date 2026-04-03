import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Share, RefreshControl, Animated, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDocumentsQuery, useShareDocumentMutation } from "@healthguard/api/hooks";
import { Camera, Share2, Plus, FileUp } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { DocumentTypeIcon } from "@healthguard/ui";
import { colors, overlay, radii, spacing, shadows, useAppTheme, useDebounceSearch, formatDate, PAGE_SIZE_LIST, Card, cardContentStyle, SearchField, Typography, Spinner } from "@healthguard/ui";
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
        <View style={styles.titleRow}>
          <Typography variant="h2">Documentos</Typography>
          <TouchableOpacity
            style={styles.shareAllBtn}
            onPress={() => navigation.navigate("ShareDocuments")}
            accessibilityRole="button"
            accessibilityLabel="Compartir documentos"
          >
            <Share2 size={18} color={colors.sky[500]} />
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
              colors={[colors.sky[500]]}
              tintColor={colors.sky[500]}
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
            <View style={styles.center}>
              <Typography variant="body" color="secondary" align="center">
                {debouncedSearch.trim()
                  ? "Sin resultados para esta búsqueda."
                  : "No tienes documentos aún."}
              </Typography>
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
            <Typography variant="label">Subir archivo</Typography>
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
            <Typography variant="label">Escanear</Typography>
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
    titleRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    shareAllBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: colors.sky[50], borderWidth: 1, borderColor: colors.sky[200] },
    center:     { flex: 1, alignItems: "center", justifyContent: "center" },

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
