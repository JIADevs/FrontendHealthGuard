import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { getMe, getAppointments, getMedications } from "@healthguard/api";
import { useAuthStore } from "@healthguard/stores";
import { colors, radii, spacing, fontSize, fontWeight, shadows, useAppTheme } from "@healthguard/ui";
import type { ThemeContextValue } from "@healthguard/ui";
import { LogOut, Calendar, Pill } from "lucide-react-native";

export function DashboardScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

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
            <ActivityIndicator size="small" color={colors.primary[500]} style={{ marginTop: 4 }} />
          ) : (
            <Text style={styles.name}>{userQuery.data?.name || userQuery.data?.email}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={20} color={t.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Calendar size={20} color={colors.primary[500]} />
            <Text style={styles.cardTitle}>Próximas Citas</Text>
          </View>
          {appts.isLoading ? <ActivityIndicator color={colors.primary[500]} /> : (
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
            <Pill size={20} color={colors.warning[500]} />
            <Text style={styles.cardTitle}>Medicamentos Activos</Text>
          </View>
          {meds.isLoading ? <ActivityIndicator color={colors.warning[500]} /> : (
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

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: t.surface.bg },
    header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing[6], paddingBottom: spacing[4], backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium },
    greeting:    { fontSize: fontSize.md, color: t.text.secondary },
    name:        { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: t.text.primary },
    logoutBtn:   { padding: spacing[2], backgroundColor: t.border.light, borderRadius: radii.md },
    content:     { padding: spacing[4], gap: spacing[4] },
    card:        { backgroundColor: t.surface.bgCard, padding: spacing[5], borderRadius: radii.lg, ...shadows.md },
    cardHeader:  { flexDirection: "row", alignItems: "center", gap: spacing[3], marginBottom: spacing[4] },
    cardTitle:   { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: t.text.primary },
    listItem:    { paddingVertical: spacing[3], borderTopWidth: 1, borderTopColor: t.border.light },
    listTitle:   { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: t.text.primary, marginBottom: 2 },
    listSub:     { fontSize: fontSize.sm, color: t.text.secondary },
  });
}
