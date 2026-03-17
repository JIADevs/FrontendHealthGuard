import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Share, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { getDocuments, shareDocument } from "@healthguard/api";
import { FileText, Camera, Share2 } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

export function DocumentsScreen() {
  const navigation = useNavigation<any>();
  const docs = useQuery({
    queryKey: ["documents"],
    queryFn: () => getDocuments({ page: 1, limit: 20 }),
  });

  async function handleShare(docId: string, title: string) {
    try {
      const result = await shareDocument(docId);
      await Share.share({
        message: `Te comparto este documento de HealthGuard: ${title}\n\n${result.shareUrl}`,
        url: result.shareUrl,
        title: title,
      });
    } catch (err) {
      console.warn("Error compartiendo documento", err);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Documentos</Text>
      </View>

      {docs.isLoading && !docs.isRefetching ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#0ea5e9" /></View>
      ) : (
        <FlatList
          data={docs.data?.items ?? []}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl 
              refreshing={docs.isRefetching} 
              onRefresh={() => docs.refetch()} 
              colors={["#0ea5e9"]}
              tintColor="#0ea5e9"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("DocumentDetail", { id: item.id, title: item.title })}
            >
              <View style={styles.iconBg}><FileText size={24} color="#0ea5e9" /></View>
              <View style={styles.info}>
                <Text style={styles.docTitle}>{item.title}</Text>
                <Text style={styles.docSub}>{new Date(item.uploadedAt).toLocaleDateString()} • {item.format}</Text>
              </View>
              <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare(item.id, item.title)}>
                <Share2 size={20} color="#64748b" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No tienes documentos aún.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate("Scanner")}
      >
        <Camera color="#fff" size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingBottom: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  list: { padding: 16, gap: 12 },
  card: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: "#fff", padding: 16, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconBg: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#e0f2fe", alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  docTitle: { fontSize: 15, fontWeight: "600", color: "#0f172a", marginBottom: 2 },
  docSub: { fontSize: 13, color: "#64748b" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { color: "#64748b", fontSize: 15 },
  fab: { position: "absolute", bottom: 24, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: "#0ea5e9", alignItems: "center", justifyContent: "center", shadowColor: "#0ea5e9", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }
});
