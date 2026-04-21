import { useLayoutEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { View, Text, StyleSheet, Linking, Alert, ScrollView, Image, Share } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import Toast from "react-native-toast-message";
import { useDocumentQuery, useTagCategoriesQuery, useShareDocumentMutation } from "@helu/api/hooks";
import { getSignedUrl, isApiError, type Document, type TagCategoryOut } from "@helu/api";
import { Share2 } from "lucide-react-native";
import { resolveExpoReachableUrl } from "../utils/shareLinks";
import { colors, palette, radii, spacing, fontSize, fontWeight, shadows, useAppTheme, formatDate, formatFileSize, Button, Typography, Spinner } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

type RouteParams = {
  id: string;
  title?: string;
};

export function DocumentDetailScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id, title } = (route.params ?? {}) as RouteParams;

  useLayoutEffect(() => {
    if (title) {
      navigation.setOptions({ title });
    }
  }, [navigation, title]);

  const doc = useDocumentQuery(id);
  const shareMut = useShareDocumentMutation();

  const signedUrl = useQuery({
    queryKey: ["signed-url", (doc.data as Document | undefined)?.fileUrl],
    queryFn: () => getSignedUrl((doc.data as Document).fileUrl),
    enabled: !!(doc.data as Document | undefined)?.fileUrl,
  });

  const d = doc.data as Document | undefined;
  const url = signedUrl.data?.url;
  const isImage = d?.format?.toLowerCase().match(/image|jpg|jpeg|png/);

  const tagCategoriesQuery = useTagCategoriesQuery();

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    const cats = (tagCategoriesQuery.data as TagCategoryOut[] | undefined) ?? [];
    for (const c of cats) map[c.id] = c.name;
    return map;
  }, [tagCategoriesQuery.data]);

  async function handleShareLink() {
    if (!d) return;
    try {
      const result = await shareMut.mutateAsync(d.id);
      const link = resolveExpoReachableUrl(result.shareUrl);
      Toast.show({
        type: "success",
        text1: "Enlace generado",
        text2: "Elegí cómo compartirlo en el siguiente paso.",
      });
      await Share.share({
        message: `Te comparto este documento de Helu: ${d.title}\n\n${link}`,
        url: link,
        title: d.title,
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "No se pudo generar el enlace",
        text2: isApiError(err) ? err.message : "Intentá de nuevo.",
      });
    }
  }

  async function handleOpen() {
    if (!url) return;
    const openUrl = resolveExpoReachableUrl(url);
    try {
      const supported = await Linking.canOpenURL(openUrl);
      if (!supported) {
        Alert.alert("No se puede abrir el documento", "Tu dispositivo no puede abrir este enlace.");
        return;
      }
      await Linking.openURL(openUrl);
    } catch (err) {
      console.warn("Error abriendo documento", err);
      Alert.alert("Error", "No se pudo abrir el documento.");
    }
  }

  if (!id) {
    return (
      <View style={styles.center}>
        <Typography variant="body" color="error">Documento no encontrado.</Typography>
      </View>
    );
  }

  if (doc.isLoading) {
    return (
      <View style={styles.center}>
        <Spinner size="lg" />
      </View>
    );
  }

  if (!d) {
    return (
      <View style={styles.center}>
        <Typography variant="body" color="error">No se pudo cargar el documento.</Typography>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2">{d.title}</Typography>

      <View style={styles.meta}>
        {d.documentType?.name ? (
          <Text style={styles.metaItem}>
            <Text style={styles.metaLabel}>Tipo de documento: </Text>
            {d.documentType.name}
          </Text>
        ) : null}
        <Text style={styles.metaItem}>
          <Text style={styles.metaLabel}>Fecha del documento: </Text>
          {formatDate(d.documentDate)}
        </Text>
        <Text style={styles.metaItem}>
          <Text style={styles.metaLabel}>Subido: </Text>
          {formatDate(d.uploadedAt)}
        </Text>
        <Text style={styles.metaItem}>
          <Text style={styles.metaLabel}>Formato: </Text>
          {d.format || "—"}
        </Text>
        {d.fileSizeBytes ? (
          <Text style={styles.metaItem}>
            <Text style={styles.metaLabel}>Tamaño: </Text>
            {formatFileSize(d.fileSizeBytes)}
          </Text>
        ) : null}
      </View>

      {(d.documentType || d.subtypes.length > 0 || d.customTags.length > 0 || d.specialties.length > 0) && (
        <View style={styles.tagsSection}>
          <Typography variant="h4">Etiquetas</Typography>
          <View style={styles.tagsContainer}>
            {d.documentType && (
              <Text style={[styles.tag, styles.tagBlue]}>
                Tipo de documento: {d.documentType.name}
              </Text>
            )}
            {d.subtypes.map((s) => (
              <Text key={s.id} style={[styles.tag, styles.tagBlue]}>
                Subtipo: {s.name}
              </Text>
            ))}
            {d.specialties.map((s) => (
              <Text key={s.id} style={[styles.tag, styles.tagAmber]}>
                Especialidad: {s.name}
              </Text>
            ))}
            {d.customTags.map((t) => {
              const catId = t.categoryId ?? (t as { category_id?: string }).category_id;
              const categoryName = catId ? categoryMap[catId] : null;
              const label = categoryName ? `${categoryName}: ${t.value}` : t.value;
              return (
                <Text key={t.id} style={[styles.tag, styles.tagGreen]}>
                  {label}
                </Text>
              );
            })}
          </View>
        </View>
      )}

      {url && isImage && (
        <View style={styles.preview}>
          <Image source={{ uri: resolveExpoReachableUrl(url) }} style={styles.image} resizeMode="contain" />
        </View>
      )}

      <View style={styles.actions}>
        <Button onPress={handleOpen} disabled={!url || signedUrl.isLoading} loading={signedUrl.isLoading} fullWidth>
          Ver documento
        </Button>
        <Button
          variant="secondary"
          onPress={handleShareLink}
          disabled={shareMut.isPending}
          loading={shareMut.isPending}
          fullWidth
        >
          <Share2 size={18} color={palette.brand[500]} /> Compartir enlace
        </Button>
        <Button variant="secondary" onPress={() => navigation.navigate("DocumentEdit", { id: d.id })} disabled={doc.isLoading} fullWidth>
          Editar
        </Button>
      </View>
    </ScrollView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content:   { padding: spacing[5] },
    center:    { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing[6] },
    title:     { fontSize: fontSize["2xl"], fontWeight: fontWeight.extrabold, color: t.text.primary, marginBottom: spacing[4] },

    meta: {
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      padding: spacing[4],
      marginBottom: spacing[5],
      ...shadows.md,
    },
    metaItem:  { fontSize: 14, color: t.text.secondary, marginBottom: 4 },
    metaLabel: { fontWeight: fontWeight.semibold, color: t.text.primary },

    tagsSection:   { marginBottom: spacing[6] },
    sectionTitle:  { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: t.text.primary, marginBottom: spacing[2] },
    tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
    tag:           {
      paddingHorizontal: 10,
      paddingVertical: 0,
      minHeight: 28,
      lineHeight: 16,
      textAlignVertical: "center",
      includeFontPadding: false,
      borderRadius: radii.full,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: t.text.primary,
    },
    tagBlue:       { backgroundColor: t.brand.tintMed },
    tagAmber:      { backgroundColor: t.status.warningBg },
    tagGreen:      { backgroundColor: t.status.successBg },

    actions:         { marginTop: spacing[2], flexDirection: "column", gap: spacing[3] },
    preview:         { marginBottom: spacing[4], backgroundColor: colors.black, borderRadius: radii.lg, overflow: "hidden", height: 400 },
    image:           { flex: 1, width: "100%", height: "100%" },
    error:               { fontSize: fontSize.base, color: t.status.errorFg },
  });
}
