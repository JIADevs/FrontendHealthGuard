import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDashboardCore } from "@helu/api/hooks";
import { useAuthStore } from "@helu/stores";
import {
  palette,
  colors,
  radii,
  spacing,
  fontSize,
  fontWeight,
  shadows,
  overlay,
  useAppTheme,
  formatDateLocal,
  Typography,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  LogOut,
  Calendar,
  Pill,
  FileText,
  Upload,
  UserCircle,
  Bell,
  ChevronRight,
  Camera,
  Share2,
  Clock,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

// ─── Quick action data ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { key: "agenda", label: "Agendar Cita", icon: Calendar, route: "MainTabs" as const, tabParams: { screen: "Agenda" } },
  { key: "upload", label: "Subir Documento", icon: Upload, route: "DocumentUpload" as const },
  { key: "scan", label: "Escanear", icon: Camera, route: "Scanner" as const },
  { key: "share", label: "Compartir", icon: Share2, route: "ShareDocuments" as const },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const logout = useAuthStore((s) => s.logout);
  const dash = useDashboardCore();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Branded Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerGreeting}>
              {dash.isProfileLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Text style={styles.greetingText}>
                    {dash.greeting},{" "}
                    <Text style={styles.greetingName}>{dash.userFirstName ?? ""}</Text>
                  </Text>
                  <Text style={styles.subtitleText}>{dash.apptSubtitle}</Text>
                </>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => navigation.navigate("Notifications")}
              >
                <Bell size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Quick Action Chips ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <TouchableOpacity
                  key={action.key}
                  style={styles.chip}
                  onPress={() => navigation.navigate(action.route as any)}
                  activeOpacity={0.7}
                >
                  <Icon size={14} color={palette.brand[700]} />
                  <Text style={styles.chipText}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Content area (white, overlaps header) ── */}
        <View style={styles.contentArea}>
          {/* ── Metric Cards ── */}
          <View style={styles.metricRow}>
            <MetricCard
              icon={<FileText size={20} color={palette.accent.document[600]} />}
              iconBg={palette.accent.document[50]}
              value={dash.docTotal}
              label="Documentos"
              t={t}
            />
            <MetricCard
              icon={<Calendar size={20} color={palette.accent.calendar[600]} />}
              iconBg={palette.accent.calendar[50]}
              value={dash.apptTotal}
              label="Citas"
              t={t}
            />
            <MetricCard
              icon={<Pill size={20} color={palette.accent.medication[600]} />}
              iconBg={palette.accent.medication[50]}
              value={dash.medTotal}
              label="Medicamentos"
              t={t}
            />
          </View>

          {/* ── Upcoming Appointments ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Typography variant="h4">Próximas Citas</Typography>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation.navigate("MainTabs", { screen: "Agenda" } as any)}
              >
                <Typography variant="caption" color="secondary">Ver todas</Typography>
                <ChevronRight size={14} color={t.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.sectionBody}>
              {dash.isApptsLoading ? (
                <ActivityIndicator color={palette.brand[500]} style={{ padding: spacing[6] }} />
              ) : dash.upcomingAppts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Calendar size={32} color={t.text.muted} />
                  <Typography variant="bodySm" color="secondary" align="center">
                    No hay citas pendientes.
                  </Typography>
                </View>
              ) : (
                dash.upcomingAppts.map((a, i) => (
                  <View
                    key={a.id}
                    style={[
                      styles.appointmentCard,
                      i > 0 && { borderTopWidth: 1, borderTopColor: t.border.light },
                    ]}
                  >
                    <View style={[styles.apptIconContainer, { backgroundColor: palette.accent.calendar[50] }]}>
                      <Calendar size={16} color={palette.accent.calendar[600]} />
                    </View>
                    <View style={styles.apptInfo}>
                      <Typography variant="label">{a.specialty}</Typography>
                      <Typography variant="caption" color="secondary">
                        {a.doctor}{a.location ? ` — ${a.location}` : ""}
                      </Typography>
                    </View>
                    <View style={styles.apptTime}>
                      <Clock size={12} color={t.text.secondary} />
                      <Text style={[styles.apptTimeText, { color: t.text.secondary }]}>
                        {formatDateLocal(a.date)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* ── Active Medications ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Typography variant="h4">Medicamentos Activos</Typography>
              <TouchableOpacity style={styles.seeAllBtn}>
                <Typography variant="caption" color="secondary">Gestionar</Typography>
                <ChevronRight size={14} color={t.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.sectionBody}>
              {dash.isMedsLoading ? (
                <ActivityIndicator color={palette.accent.medication[500]} style={{ padding: spacing[6] }} />
              ) : dash.activeMeds.length === 0 ? (
                <View style={styles.emptyState}>
                  <Pill size={32} color={t.text.muted} />
                  <Typography variant="bodySm" color="secondary" align="center">
                    Sin medicamentos activos.
                  </Typography>
                </View>
              ) : (
                dash.activeMeds.map((m, i) => (
                  <View
                    key={m.id}
                    style={[
                      styles.appointmentCard,
                      i > 0 && { borderTopWidth: 1, borderTopColor: t.border.light },
                    ]}
                  >
                    <View style={[styles.apptIconContainer, { backgroundColor: palette.accent.medication[50] }]}>
                      <Pill size={16} color={palette.accent.medication[600]} />
                    </View>
                    <View style={styles.apptInfo}>
                      <Typography variant="label">{m.name}</Typography>
                      <Typography variant="caption" color="secondary">
                        {m.dosage} — cada {m.frequency}h
                      </Typography>
                    </View>
                    {m.nextIntakeTime && (
                      <View style={styles.apptTime}>
                        <Clock size={12} color={palette.accent.medication[600]} />
                        <Text style={[styles.apptTimeText, { color: palette.accent.medication[600] }]}>
                          {m.nextIntakeTime.slice(0, 5)}
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Metric Card Sub-component ───────────────────────────────────────────────

function MetricCard({
  icon,
  iconBg,
  value,
  label,
  t,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: number | string;
  label: string;
  t: ThemeContextValue;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.surface.bgCard,
        padding: spacing[4],
        borderRadius: radii.lg,
        alignItems: "center",
        gap: spacing[2],
        ...shadows.sm,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: iconBg,
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontSize: fontSize["2xl"],
          fontWeight: fontWeight.extrabold,
          color: t.text.primary,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: fontSize.xs,
          fontWeight: fontWeight.medium,
          color: t.text.secondary,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.brand[500],
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },

    // ── Header ──
    header: {
      backgroundColor: palette.brand[500],
      paddingHorizontal: spacing[6],
      paddingTop: spacing[4],
      paddingBottom: spacing[8],
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: spacing[5],
    },
    headerGreeting: {
      flex: 1,
      gap: spacing[1],
    },
    greetingText: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.normal,
      color: colors.white,
    },
    greetingName: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.white,
    },
    subtitleText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.normal,
      color: palette.brand[100],
      marginTop: spacing[1],
    },
    headerActions: {
      flexDirection: "row",
      gap: spacing[2],
    },
    headerIconBtn: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      backgroundColor: overlay.light,
      alignItems: "center",
      justifyContent: "center",
    },

    // ── Chips ──
    chipsRow: {
      flexDirection: "row",
      gap: spacing[2],
      paddingBottom: spacing[2],
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      backgroundColor: colors.white,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      borderRadius: radii.full,
      ...shadows.sm,
    },
    chipText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: palette.brand[700],
    },

    // ── Content ──
    contentArea: {
      flex: 1,
      backgroundColor: t.surface.bg,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      marginTop: -spacing[3],
      padding: spacing[5],
      gap: spacing[5],
    },
    metricRow: {
      flexDirection: "row",
      gap: spacing[3],
    },

    // ── Sections ──
    section: {
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      ...shadows.sm,
      overflow: "hidden",
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing[5],
      paddingVertical: spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: t.border.light,
    },
    seeAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
    },
    sectionBody: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
    },

    // ── Appointment / Med Cards ──
    appointmentCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      paddingVertical: spacing[3],
    },
    apptIconContainer: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
    },
    apptInfo: {
      flex: 1,
      gap: 2,
    },
    apptTime: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
    },
    apptTimeText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
    },

    // ── Empty State ──
    emptyState: {
      alignItems: "center",
      gap: spacing[3],
      paddingVertical: spacing[6],
    },
  });
}
