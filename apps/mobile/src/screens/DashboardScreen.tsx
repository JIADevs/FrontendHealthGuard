import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDashboardCore } from "@healthguard/api/hooks";
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
  Typography,
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

  const dash = useDashboardCore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Typography variant="bodySm" color="secondary">{dash.apptSubtitle}</Typography>
          {dash.isProfileLoading ? (
            <ActivityIndicator size="small" color={colors.primary[500]} style={{ marginTop: 4 }} />
          ) : (
            <Typography variant="h2">{dash.userName}</Typography>
          )}
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate("Profile")}>
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
            <Typography variant="h3" align="center">{dash.docTotal}</Typography>
            <Typography variant="caption" color="secondary" align="center">Documentos</Typography>
          </View>
          <View style={[styles.metricCard, { flex: 1 }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.success[50] }]}>
              <Calendar size={20} color={colors.success[600]} />
            </View>
            <Typography variant="h3" align="center">{dash.apptTotal}</Typography>
            <Typography variant="caption" color="secondary" align="center">Citas Totales</Typography>
          </View>
          <View style={[styles.metricCard, { flex: 1 }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.warning[50] }]}>
              <Pill size={20} color={colors.warning[600]} />
            </View>
            <Typography variant="h3" align="center">{dash.medTotal}</Typography>
            <Typography variant="caption" color="secondary" align="center">Medicamentos</Typography>
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
            <Typography variant="h4">Próximas Citas</Typography>
          </View>
          {dash.isApptsLoading ? (
            <ActivityIndicator color={colors.primary[500]} />
          ) : dash.upcomingAppts.length === 0 ? (
            <Typography variant="bodySm" color="secondary" align="center">No hay citas pendientes.</Typography>
          ) : (
            dash.upcomingAppts.map((a) => (
              <View key={a.id} style={styles.listItem}>
                <Typography variant="label">{a.specialty}</Typography>
                <Typography variant="bodySm" color="secondary">{formatDateLocal(a.date)} — {a.doctor}</Typography>
              </View>
            ))
          )}
        </View>

        {/* Active medications */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Pill size={20} color={colors.warning[500]} />
            <Typography variant="h4">Medicamentos Activos</Typography>
          </View>
          {dash.isMedsLoading ? (
            <ActivityIndicator color={colors.warning[500]} />
          ) : dash.activeMeds.length === 0 ? (
            <Typography variant="bodySm" color="secondary" align="center">Sin medicamentos activos.</Typography>
          ) : (
            dash.activeMeds.map((m) => (
              <View key={m.id} style={styles.listItem}>
                <Typography variant="label">{m.name}</Typography>
                <Typography variant="bodySm" color="secondary">{m.dosage} cada {m.frequency}h</Typography>
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
    container:     { flex: 1, backgroundColor: t.surface.bg },
    header:        { flexDirection: "row", alignItems: "center", gap: spacing[2], padding: spacing[6], paddingBottom: spacing[4], backgroundColor: t.surface.bgCard, borderBottomWidth: 1, borderBottomColor: t.border.medium },
    headerBtn:     { padding: spacing[2], backgroundColor: t.border.light, borderRadius: radii.md },
    content:       { padding: spacing[4], gap: spacing[4] },
    metricRow:     { flexDirection: "row", gap: spacing[3] },
    metricCard:    { backgroundColor: t.surface.bgCard, padding: spacing[4], borderRadius: radii.lg, alignItems: "center", gap: spacing[2], ...shadows.sm },
    metricIcon:    { width: 40, height: 40, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
    uploadBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing[2], backgroundColor: colors.primary[500], borderRadius: radii.md, padding: spacing[3] },
    uploadBtnText: { color: colors.white, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
    card:          { backgroundColor: t.surface.bgCard, padding: spacing[5], borderRadius: radii.lg, ...shadows.md },
    cardHeader:    { flexDirection: "row", alignItems: "center", gap: spacing[3], marginBottom: spacing[4] },
    listItem:      { paddingVertical: spacing[3], borderTopWidth: 1, borderTopColor: t.border.light, gap: 2 },
  });
}
