import { useLayoutEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Alert, ScrollView, Image } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { getDocumentById, getSignedUrl, type Document } from "@healthguard/api";

type RouteParams = {
  id: string;
  title?: string;
};

export function DocumentDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id, title } = (route.params ?? {}) as RouteParams;

  useLayoutEffect(() => {
    if (title) {
      navigation.setOptions({ title });
    }
  }, [navigation, title]);

  const doc = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocumentById(id),
    enabled: !!id,
  });

  const signedUrl = useQuery({
    queryKey: ["signed-url", (doc.data as Document | undefined)?.fileUrl],
    queryFn: () => getSignedUrl((doc.data as Document).fileUrl),
    enabled: !!(doc.data as Document | undefined)?.fileUrl,
  });

  const d = doc.data as Document | undefined;
  const url = signedUrl.data?.url;
  const isPdf = d?.format?.toLowerCase().includes("pdf");
  const isImage = d?.format?.toLowerCase().match(/image|jpg|jpeg|png/);

  async function handleOpen() {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("No se puede abrir el documento", "Tu dispositivo no puede abrir este enlace.");
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      console.warn("Error abriendo documento", err);
      Alert.alert("Error", "No se pudo abrir el documento.");
    }
  }

  if (!id) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Documento no encontrado.</Text>
      </View>
    );
  }

  if (doc.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!d) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No se pudo cargar el documento.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{d.title}</Text>

      <View style={styles.meta}>
        <Text style={styles.metaItem}>
          <Text style={styles.metaLabel}>Fecha del documento: </Text>
          {d.documentDate ? new Date(d.documentDate).toLocaleDateString() : "—"}
        </Text>
        <Text style={styles.metaItem}>
          <Text style={styles.metaLabel}>Subido: </Text>
          {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : "—"}
        </Text>
        <Text style={styles.metaItem}>
          <Text style={styles.metaLabel}>Formato: </Text>
          {d.format || "—"}
        </Text>
        {d.fileSizeBytes ? (
          <Text style={styles.metaItem}>
            <Text style={styles.metaLabel}>Tamaño: </Text>
            {(d.fileSizeBytes / 1024).toFixed(0)} KB
          </Text>
        ) : null}
      </View>

      {(d.subtypes.length > 0 || d.customTags.length > 0 || d.specialties.length > 0) && (
        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>Etiquetas</Text>
          <View style={styles.tagsContainer}>
            {d.subtypes.map((s) => (
              <Text key={s.id} style={[styles.tag, styles.tagBlue]}>
                {s.name}
              </Text>
            ))}
            {d.specialties.map((s) => (
              <Text key={s.id} style={[styles.tag, styles.tagAmber]}>
                {s.name}
              </Text>
            ))}
            {d.customTags.map((t) => (
              <Text key={t.id} style={[styles.tag, styles.tagGreen]}>
                {t.value}
              </Text>
            ))}
          </View>
        </View>
      )}

      {url && isImage && (
        <View style={styles.preview}>
          <Image source={{ uri: url }} style={styles.image} resizeMode="contain" />
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, !url && styles.buttonDisabled]}
          onPress={handleOpen}
          disabled={!url || signedUrl.isLoading}
        >
          {signedUrl.isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Ver documento</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
  },
  meta: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metaItem: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 4,
  },
  metaLabel: {
    fontWeight: "600",
    color: "#0f172a",
  },
  tagsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
  },
  tagBlue: {
    backgroundColor: "#e0f2fe",
  },
  tagAmber: {
    backgroundColor: "#fef3c7",
  },
  tagGreen: {
    backgroundColor: "#dcfce7",
  },
  actions: {
    marginTop: 8,
  },
  preview: {
    marginBottom: 16,
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
    height: 400,
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  button: {
    backgroundColor: "#0ea5e9",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  error: {
    fontSize: 15,
    color: "#ef4444",
  },
});

