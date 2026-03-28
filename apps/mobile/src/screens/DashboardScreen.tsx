import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useProfileQuery,
  useDocumentsQuery,
  useAppointmentsQuery,
  useMedicationsQuery,
} from "@healthguard/api/hooks";
import { useAuthStore } from "@healthguard/stores";
import {
  colors,
  radii,
  spacing,
  fontSize,
  fontWeight,
  shadows,
  useAppTheme,
  formatDateLocal,
  todayISODate,
} from "@healthguard/ui";
import type { ThemeContextValue } from "@healthguard/ui";
import { LogOut, Calendar, Pill, FileText, Upload, UserCircle } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function DashboardScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const logout = useAuthStore((s) => s.logout);
  const userQuery = useProfileQuery();
  const docs  = useDocumentsQuery("", 1, 1);
  const appts = useAppointmentsQuery("", 1, 3, todayISODate());
  const meds  = useMedicationsQuery(1, 3);

  const todayApptCount = appts.data?.items.filter((a) => a.status === "PENDING").length ?? 0;
  const apptSubtitle = todayApptCount > 0
    ? `Tienes ${todayApptCount} cita${todayApptCount > 1 ? "s" : ""} pendiente${todayApptCount > 1 ? "s" : ""} hoy.`
    : "No tienes citas pendientes hoy.";

  const docTotal  = docs.isLoading  ? "—" : String(docs.data?.total  ?? "—");
  const apptTotal = appts.isLoading ? "—" : String(appts.data?.total ?? "—");
  const medTotal  = meds.isLoading  ? "—" : String(meds.data?.total  ?? "—");

  const apptItems = appts.data?.items ?? [];
  const medItems  = meds.data?.items  ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{apptSubtitle}</Text>
          {userQuery.isLoading ? (
            <ActivityIndicator size="small" color={colors.primary[500]} style={{ marginTop: 4 }} />
          ) : (
            <Text style={styles.name}>{userQuery.data?.name || userQuery.data?.email}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate("Profile")}
        >
          <UserCircle size={20} color={t.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn} onPress={logout}>
          <LogOut size={20} color={t.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stat cards */}
        <View style={styles.metricRow}>
          <View style={[styles.metricCard, { flex: 1 }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.primary[50] }]}>
              <FileText size={20} color={colors.primary[600]} />
            </View>
            <Text style={styles.metricValue}>{docTotal}</Text>
            <Text style={styles.metricLabel}>Documentos</Text>
          </View>
          <View style={[styles.metricCard, { flex: 1 }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.success[50] }]}>
              <Calendar size={20} color={colors.success[600]} />
            </View>
            <Text style={styles.metricValue}>{apptTotal}</Text>
            <Text style={styles.metricLabel}>Citas Totales</Text>
          </View>
          <View style={[styles.metricCard, { flex: 1 }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.warning[50] }]}>
              <Pill size={20} color={colors.warning[600]} />
            </View>
            <Text style={styles.metricValue}>{medTotal}</Text>
            <Text style={styles.metricLabel}>Medicamentos</Text>
          </View>
        </View>

        {/* Quick action */}
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => navigation.navigate("DocumentUpload", {})}
        >
          <Upload size={16} color={colors.white} />
          <Text style={styles.uploadBtnText}>Subir Documento</Text>
        </TouchableOpacity>

        {/* Upcoming appointments */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Calendar size={20} color={colors.primary[500]} />
            <Text style={styles.cardTitle}>Próximas Citas</Text>
          </View>
          {appts.isLoading ? (
            <ActivityIndicator color={colors.primary[500]} />
          ) : apptItems.length === 0 ? (
            <Text style={styles.emptyText}>No hay citas pendientes.</Text>
          ) : (
            apptItems.map((a) => (
              <View key={a.id} style={styles.listItem}>
                <Text style={styles.listTitle}>{a.specialty}</Text>
                <Text style={styles.listSub}>{formatDateLocal(a.date)} — {a.doctor}</Text>
              </View>
            ))
          )}
        </View>

        {/* Active medications */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Pill size={20} color={colors.warning[500]} />
            <Text style={styles.cardTitle}>Medicamentos Activos</Text>
          </View>
          {meds.isLoading ? (
            <ActivityIndicator color={colors.warning[500]} />
          ) : medItems.length === 0 ? (
            <Text style={styles.emptyText}>Sin medicamentos activos.</Text>
          ) : (
            medItems.map((m) => (
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
    container:      { flex: 1, backgroundColor: t.surface.bg },
    header:         { flexDirection: "row", alignItems: "center", gap: spacing[2], padding: spacing[6], paddingBottom: spacing[4], backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium },
    greeting:       { fontSize: fontSize.sm, color: t.text.secondary, marginBottom: 2 },
    name:           { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: t.text.primary },
    headerBtn:      { padding: spacing[2], backgroundColor: t.border.light, borderRadius: radii.md },
    content:        { padding: spacing[4], gap: spacing[4] },
    metricRow:      { flexDirection: "row", gap: spacing[3] },
    metricCard:     { backgroundColor: t.surface.bgCard, padding: spacing[4], borderRadius: radii.lg, alignItems: "center", gap: spacing[2], ...shadows.sm },
    metricIcon:     { width: 40, height: 40, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
    metricValue:    { fontSize: fontSize["2xl"], fontWeight: fontWeight.extrabold, color: t.text.primary },
    metricLabel:    { fontSize: fontSize.xs, color: t.text.secondary, textAlign: "center" },
    uploadBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing[2], backgroundColor: colors.primary[500], borderRadius: radii.md, padding: spacing[3] },
    uploadBtnText:  { color: colors.white, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
    card:           { backgroundColor: t.surface.bgCard, padding: spacing[5], borderRadius: radii.lg, ...shadows.md },
    cardHeader:     { flexDirection: "row", alignItems: "center", gap: spacing[3], marginBottom: spacing[4] },
    cardTitle:      { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: t.text.primary },
    listItem:       { paddingVertical: spacing[3], borderTopWidth: 1, borderTopColor: t.border.light },
    listTitle:      { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: t.text.primary, marginBottom: 2 },
    listSub:        { fontSize: fontSize.sm, color: t.text.secondary },
    emptyText:      { fontSize: fontSize.sm, color: t.text.secondary, textAlign: "center", paddingVertical: spacing[2] },
  });
}
