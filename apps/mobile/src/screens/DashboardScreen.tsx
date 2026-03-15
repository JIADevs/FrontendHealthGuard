import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { getMe, getAppointments, getMedications } from "@healthguard/api";
import { useAuthStore } from "@healthguard/stores";
import { LogOut, Calendar, Pill } from "lucide-react-native";

export function DashboardScreen() {
  const logout = useAuthStore((s) => s.logout);
  const userQuery = useQuery({ queryKey: ["me"], queryFn: getMe });

  const appts = useQuery({
    queryKey: ["appointments"],
    queryFn: () => getAppointments({ limit: 3 }),
  });

  const meds = useQuery({
    queryKey: ["medications"],
    queryFn: () => getMedications({ limit: 3 }),
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola,</Text>
          {userQuery.isLoading ? (
            <ActivityIndicator size="small" color="#0ea5e9" style={{ marginTop: 4 }} />
          ) : (
            <Text style={styles.name}>{userQuery.data?.name || userQuery.data?.email}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Calendar size={20} color="#0ea5e9" />
            <Text style={styles.cardTitle}>Próximas Citas</Text>
          </View>
          {appts.isLoading ? <ActivityIndicator color="#0ea5e9" /> : (
            appts.data?.items.map((a) => (
              <View key={a.id} style={styles.listItem}>
                <Text style={styles.listTitle}>{a.specialty}</Text>
                <Text style={styles.listSub}>{a.date} — {a.doctor}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Pill size={20} color="#f59e0b" />
            <Text style={styles.cardTitle}>Medicamentos Activos</Text>
          </View>
          {meds.isLoading ? <ActivityIndicator color="#f59e0b" /> : (
            meds.data?.items.map((m) => (
              <View key={m.id} style={styles.listItem}>
                <Text style={styles.listTitle}>{m.name}</Text>
                <Text style={styles.listSub}>{m.dosage} cada {m.frequency}h</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 24, paddingBottom: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  greeting: { fontSize: 16, color: "#64748b" },
  name: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  logoutBtn: { padding: 8, backgroundColor: "#f1f5f9", borderRadius: 12 },
  content: { padding: 16, gap: 16 },
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#334155" },
  listItem: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  listTitle: { fontSize: 15, fontWeight: "600", color: "#0f172a", marginBottom: 2 },
  listSub: { fontSize: 13, color: "#64748b" },
});
