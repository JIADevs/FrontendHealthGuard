import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function AgendaScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>Módulo de Agenda en construcción para Mobile</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingBottom: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  text: { color: "#64748b", textAlign: "center" },
});
