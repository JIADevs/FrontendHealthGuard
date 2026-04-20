import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDashboardCore } from "@helu/api/hooks";
import { useAuthStore } from "@helu/stores";
import {
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
  Calendar,
  Pill,
  FileText,
  Upload,
  Bell,
  ChevronRight,
  Camera,
  Share2,
  Clock,
  MapPin,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats "2026-04-27" → { day: "27", month: "abr" } */
function splitDate(dateStr: string): { day: string; month: string } {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDate().toString();
  const month = d.toLocaleDateString("es", { month: "short" }).replace(".", "");
  return { day, month };
}

/** Formats file extension to friendly label */
function formatKind(format: string): string {
  const f = format.toLowerCase();
  if (f.includes("pdf")) return "PDF";
  if (f.includes("png") || f.includes("jpg") || f.includes("jpeg") || f.includes("webp")) return "Imagen";
  return format.toUpperCase();
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const logout = useAuthStore((s) => s.logout);
  const dash = useDashboardCore();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Status bar strip — brand color behind clock/signal */}
      <View style={[styles.statusBarBg, { height: insets.top }]} />
      <StatusBar barStyle="light-content" translucent={false} />
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
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate("Notifications")}
            >
              <Bell size={20} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* ── Quick Action Chips ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
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
                  <Icon size={14} color={t.brand.tintText} />
                  <Text style={styles.chipText}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Content area (overlaps header with rounded top) ── */}
        <View style={styles.contentArea}>
          {/* ── Metric Cards ── */}
          <View style={styles.metricRow}>
            <MetricCard
              icon={<FileText size={20} color={t.accent.docFg} />}
              iconBg={t.accent.docBg}
              value={dash.docTotal}
              label="Documentos"
              t={t}
            />
            <MetricCard
              icon={<Calendar size={20} color={t.accent.calFg} />}
              iconBg={t.accent.calBg}
              value={dash.apptTotal}
              label="Citas"
              t={t}
            />
            <MetricCard
              icon={<Pill size={20} color={t.accent.medFg} />}
              iconBg={t.accent.medBg}
              value={dash.medTotal}
              label="Medicamentos"
              t={t}
            />
          </View>

          {/* ── Featured Next Appointment ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Typography variant="h4">Próxima Cita</Typography>
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
                <ActivityIndicator color={t.brand.fg} style={{ padding: spacing[6] }} />
              ) : !dash.nextAppt ? (
                <View style={styles.emptyState}>
                  <Calendar size={32} color={t.text.muted} />
                  <Typography variant="bodySm" color="secondary" align="center">
                    No hay citas pendientes.
                  </Typography>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.featuredApptCard}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate("MainTabs", { screen: "Agenda" } as any)}
                >
                  {/* Left accent border */}
                  <View style={[styles.featuredAccent, { backgroundColor: t.accent.calFg }]} />
                  {/* Icon */}
                  <View style={[styles.featuredIcon, { backgroundColor: t.accent.calBg }]}>
                    <Calendar size={18} color={t.accent.calFg} />
                  </View>
                  {/* Info */}
                  <View style={styles.featuredInfo}>
                    <Text style={[styles.featuredTitle, { color: t.text.primary }]}>{dash.nextAppt.specialty}</Text>
                    <View style={styles.featuredMeta}>
                      <Text style={[styles.featuredSub, { color: t.text.secondary }]}>
                        {dash.nextAppt.doctor}
                      </Text>
                    </View>
                    {dash.nextAppt.location ? (
                      <View style={styles.featuredLocationRow}>
                        <MapPin size={11} color={t.text.muted} />
                        <Text style={[styles.featuredLocation, { color: t.text.muted }]}>
                          {dash.nextAppt.location}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {/* Date badge */}
                  <View style={[styles.dateBadge, { backgroundColor: t.accent.calBg }]}>
                    <Text style={[styles.dateBadgeDay, { color: t.accent.calFg }]}>
                      {splitDate(dash.nextAppt.date).day}
                    </Text>
                    <Text style={[styles.dateBadgeMonth, { color: t.accent.calFg }]}>
                      {splitDate(dash.nextAppt.date).month}
                    </Text>
                    {dash.nextAppt.time && (
                      <Text style={[styles.dateBadgeTime, { color: t.text.secondary }]}>
                        {dash.nextAppt.time.slice(0, 5)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Active Medications (horizontal scroll) ── */}
          <View>
            <View style={styles.sectionHeaderFlat}>
              <Typography variant="h4">Medicamentos</Typography>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation.navigate("MainTabs", { screen: "Agenda" } as any)}
              >
                <Typography variant="caption" color="secondary">Gestionar</Typography>
                <ChevronRight size={14} color={t.text.secondary} />
              </TouchableOpacity>
            </View>
            {dash.isMedsLoading ? (
              <ActivityIndicator color={t.accent.medFg} style={{ padding: spacing[6] }} />
            ) : dash.activeMeds.length === 0 ? (
              <View style={[styles.section, { padding: spacing[5] }]}>
                <View style={styles.emptyState}>
                  <Pill size={32} color={t.text.muted} />
                  <Typography variant="bodySm" color="secondary" align="center">
                    Sin medicamentos activos.
                  </Typography>
                </View>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.medsScrollRow}
              >
                {dash.activeMeds.map((m) => (
                  <View key={m.id} style={[styles.medCard, { backgroundColor: t.surface.bgCard }]}>
                    <View style={[styles.medIconWrap, { backgroundColor: t.accent.medBg }]}>
                      <Pill size={16} color={t.accent.medFg} />
                    </View>
                    <Text style={[styles.medName, { color: t.text.primary }]} numberOfLines={1}>
                      {m.name}
                    </Text>
                    <Text style={[styles.medDosage, { color: t.text.secondary }]} numberOfLines={1}>
                      {m.dosage}
                    </Text>
                    {m.nextIntakeTime ? (
                      <View style={[styles.medTimeBadge, { backgroundColor: t.accent.medBg }]}>
                        <Clock size={10} color={t.accent.medFg} />
                        <Text style={[styles.medTimeText, { color: t.accent.medFg }]}>
                          {m.nextIntakeTime.slice(0, 5)}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.medFreq, { color: t.text.muted }]}>
                        Cada {m.frequency}h
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ── Recent Documents (horizontal scroll) ── */}
          <View>
            <View style={styles.sectionHeaderFlat}>
              <Typography variant="h4">Documentos Recientes</Typography>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation.navigate("MainTabs", { screen: "Documents" } as any)}
              >
                <Typography variant="caption" color="secondary">Ver todos</Typography>
                <ChevronRight size={14} color={t.text.secondary} />
              </TouchableOpacity>
            </View>
            {dash.isDocsLoading ? (
              <ActivityIndicator color={t.accent.docFg} style={{ padding: spacing[6] }} />
            ) : dash.recentDocs.length === 0 ? (
              <View style={[styles.section, { padding: spacing[5] }]}>
                <View style={styles.emptyState}>
                  <FileText size={32} color={t.text.muted} />
                  <Typography variant="bodySm" color="secondary" align="center">
                    Aún no has subido documentos.
                  </Typography>
                </View>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.docsScrollRow}
              >
                {dash.recentDocs.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.docCard, { backgroundColor: t.surface.bgCard }]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("DocumentDetail", { id: doc.id, title: doc.title })}
                  >
                    <View style={[styles.docIconWrap, { backgroundColor: t.accent.docBg }]}>
                      <FileText size={18} color={t.accent.docFg} />
                    </View>
                    <Text style={[styles.docTitle, { color: t.text.primary }]} numberOfLines={2}>
                      {doc.title}
                    </Text>
                    <View style={styles.docFooter}>
                      <Text style={[styles.docKind, { color: t.accent.docFg, backgroundColor: t.accent.docBg }]}>
                        {formatKind(doc.format)}
                      </Text>
                      <Text style={[styles.docDate, { color: t.text.muted }]}>
                        {formatDateLocal(doc.uploadedAt)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Bottom spacer for tab bar */}
          <View style={{ height: spacing[4] }} />
        </View>
      </ScrollView>
    </View>
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
      backgroundColor: t.surface.bg,
    },
    statusBarBg: {
      backgroundColor: t.brand.solid,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },

    // ── Header ──
    header: {
      backgroundColor: t.brand.solid,
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
      color: t.brand.onSolid,
      marginTop: spacing[1],
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
    chipsScroll: {
      marginHorizontal: -spacing[6],
    },
    chipsRow: {
      flexDirection: "row",
      gap: spacing[2],
      paddingHorizontal: spacing[6],
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
      color: t.brand.tintText,
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

    // ── Sections (carded) ──
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
    sectionHeaderFlat: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing[3],
    },
    seeAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
    },
    sectionBody: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },

    // ── Featured Appointment Card ──
    featuredApptCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      paddingVertical: spacing[2],
    },
    featuredAccent: {
      width: 4,
      alignSelf: "stretch",
      borderRadius: 2,
    },
    featuredIcon: {
      width: 40,
      height: 40,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
    },
    featuredInfo: {
      flex: 1,
      gap: 2,
    },
    featuredTitle: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.bold,
    },
    featuredMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
    },
    featuredSub: {
      fontSize: fontSize.sm,
    },
    featuredLocationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginTop: 2,
    },
    featuredLocation: {
      fontSize: fontSize.xs,
    },
    dateBadge: {
      alignItems: "center",
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: radii.md,
      minWidth: 52,
    },
    dateBadgeDay: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.extrabold,
      lineHeight: 24,
    },
    dateBadgeMonth: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      textTransform: "capitalize",
    },
    dateBadgeTime: {
      fontSize: 10,
      fontWeight: fontWeight.medium,
      marginTop: 2,
    },

    // ── Medication horizontal cards ──
    medsScrollRow: {
      gap: spacing[3],
      paddingRight: spacing[2],
    },
    medCard: {
      width: 130,
      padding: spacing[4],
      borderRadius: radii.lg,
      gap: spacing[2],
      ...shadows.sm,
    },
    medIconWrap: {
      width: 32,
      height: 32,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
    },
    medName: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
    },
    medDosage: {
      fontSize: fontSize.xs,
    },
    medTimeBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 3,
      paddingHorizontal: spacing[2],
      paddingVertical: 3,
      borderRadius: radii.full,
      marginTop: spacing[1],
    },
    medTimeText: {
      fontSize: 10,
      fontWeight: fontWeight.semibold,
    },
    medFreq: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
    },

    // ── Document cards (horizontal) ──
    docsScrollRow: {
      gap: spacing[3],
      paddingRight: spacing[2],
    },
    docCard: {
      width: 160,
      padding: spacing[4],
      borderRadius: radii.lg,
      gap: spacing[2],
      ...shadows.sm,
    },
    docIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
    },
    docTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      lineHeight: 18,
    },
    docFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing[1],
    },
    docKind: {
      fontSize: 10,
      fontWeight: fontWeight.bold,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radii.sm,
      overflow: "hidden",
    },
    docDate: {
      fontSize: 10,
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
