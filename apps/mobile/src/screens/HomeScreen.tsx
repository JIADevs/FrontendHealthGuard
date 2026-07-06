import { useMemo, useState } from "react";
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
import { useDashboardCore, useCalendarEventsQuery } from "@helu/api/hooks";
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
  Typography,
  mapCalendarApiToEvents,
  filterEventsForDates,
  todayLocalDateKey,
} from "@helu/ui";
import type { ThemeContextValue, AgendaEvent } from "@helu/ui";
import {
  Calendar,
  Pill,
  FileText,
  Upload,
  Bell,
  Camera,
  Share2,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { AppointmentListItem, MedicationDoseListItem, DocumentListItem } from "../components/home";
import { MedicationIntakeModal } from "../components/agenda";

type MedicationEvent = Extract<AgendaEvent, { type: "medication" }>;

// ─── Quick action data ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { key: "upload", label: "Subir Documento", icon: Upload, route: "DocumentUpload" as const },
  { key: "scan", label: "Escanear", icon: Camera, route: "Scanner" as const },
  { key: "share", label: "Compartir", icon: Share2, route: "SharedHistory" as const },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function HomeScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const logout = useAuthStore((s) => s.logout);
  const dash = useDashboardCore();
  const insets = useSafeAreaInsets();

  const todayKey = todayLocalDateKey();
  const calendarQuery = useCalendarEventsQuery(todayKey, todayKey);
  const todayMedicationEvents = useMemo<MedicationEvent[]>(() => {
    if (!calendarQuery.data) return [];
    const events = mapCalendarApiToEvents(calendarQuery.data);
    return filterEventsForDates(events, [todayKey]).filter(
      (e): e is MedicationEvent => e.type === "medication",
    );
  }, [calendarQuery.data, todayKey]);

  // Modal state
  const [selectedDoseEvent, setSelectedDoseEvent] = useState<MedicationEvent | null>(null);

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
                    <Text style={styles.brandName}>Helu</Text>
                    <Text style={styles.greetingName}>, {dash.userFirstName ?? ""}</Text>
                  </Text>
                  <Text style={styles.subtitleText}>{dash.apptSubtitle}</Text>
                </>
              )}
            </View>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate("Notifications", { backTitle: "Inicio" })}
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
                  onPress={() => navigation.navigate(action.route as any, { backTitle: "Inicio" } as any)}
                  activeOpacity={0.7}
                >
                  <Icon size={14} color={t.brand.solid} />
                  <Text style={styles.chipText}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Content area (overlaps header with rounded top) ── */}
        <View style={styles.contentArea}>
          {/* ── Tu día — summary card ── */}
          <View style={styles.dayCard}>
            <TouchableOpacity
              style={styles.dayItem}
              onPress={() => navigation.navigate("MainTabs", { screen: "Agenda", params: { initialTab: "calendar" } } as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.dayIconWrap, { backgroundColor: t.accent.calBg }]}>
                <Calendar size={16} color={t.accent.calFg} />
              </View>
              <Text style={[styles.dayValue, { color: t.text.primary }]}>{dash.todayApptCount}</Text>
              <Text style={[styles.dayLabel, { color: t.text.secondary }]}>
                {dash.todayApptCount === 1 ? 'Cita hoy' : 'Citas hoy'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.daySeparator, { backgroundColor: t.border.light }]} />

            <TouchableOpacity
              style={styles.dayItem}
              onPress={() => navigation.navigate("MainTabs", { screen: "Agenda", params: { initialTab: "medications" } } as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.dayIconWrap, { backgroundColor: t.accent.medBg }]}>
                <Pill size={16} color={t.accent.medFg} />
              </View>
              <Text style={[styles.dayValue, { color: t.text.primary }]}>{dash.activeMeds.length}</Text>
              <Text style={[styles.dayLabel, { color: t.text.secondary }]}>Medicamentos</Text>
            </TouchableOpacity>

            <View style={[styles.daySeparator, { backgroundColor: t.border.light }]} />

            <TouchableOpacity
              style={styles.dayItem}
              onPress={() => navigation.navigate("MainTabs", { screen: "Documents" } as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.dayIconWrap, { backgroundColor: t.accent.docBg }]}>
                <FileText size={16} color={t.accent.docFg} />
              </View>
              <Text style={[styles.dayValue, { color: t.text.primary }]}>{dash.docTotal}</Text>
              <Text style={[styles.dayLabel, { color: t.text.secondary }]}>Documentos</Text>
            </TouchableOpacity>
          </View>

          {/* ── Próximas Citas ── */}
          <View style={styles.sectionHeader}>
            <Typography variant="h4">Próximas citas</Typography>
            <TouchableOpacity
              onPress={() => navigation.navigate("MainTabs", { screen: "Agenda", params: { initialTab: "appointments" } } as any)}
            >
              <Text style={[styles.seeAllText, { color: t.brand.fg }]}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionList}>
            {dash.isApptsLoading ? (
              <View style={styles.itemCard}>
                <ActivityIndicator color={t.brand.fg} style={{ padding: spacing[6] }} />
              </View>
            ) : dash.upcomingAppts.length === 0 ? (
              <View style={styles.itemCard}>
                <View style={styles.emptyState}>
                  <Calendar size={32} color={t.text.muted} />
                  <Typography variant="bodySm" color="secondary" align="center">
                    No hay citas pendientes.
                  </Typography>
                </View>
              </View>
            ) : (
              dash.upcomingAppts.map((appt) => (
                <View key={appt.id} style={styles.itemCard}>
                  <AppointmentListItem
                    appointment={appt}
                    isLast
                    onPress={() => navigation.navigate("AppointmentDetail", { id: appt.id })}
                  />
                </View>
              ))
            )}
          </View>

          {/* ── Medicamentos de hoy ── */}
          <View style={styles.sectionHeader}>
            <Typography variant="h4">Medicamentos de hoy</Typography>
            <TouchableOpacity
              onPress={() => navigation.navigate("MainTabs", { screen: "Agenda", params: { initialTab: "medications" } } as any)}
            >
              <Text style={[styles.seeAllText, { color: t.brand.fg }]}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionList}>
            {calendarQuery.isLoading ? (
              <View style={styles.itemCard}>
                <ActivityIndicator color={t.accent.medFg} style={{ padding: spacing[6] }} />
              </View>
            ) : todayMedicationEvents.length === 0 ? (
              <View style={styles.itemCard}>
                <View style={styles.emptyState}>
                  <Pill size={32} color={t.text.muted} />
                  <Typography variant="bodySm" color="secondary" align="center">
                    Sin medicamentos programados para hoy.
                  </Typography>
                </View>
              </View>
            ) : (
              todayMedicationEvents.map((event) => (
                <View key={`${event.data.id}-${event.intakeTime}`} style={styles.itemCard}>
                  <MedicationDoseListItem
                    event={event}
                    isLast
                    onPress={() => setSelectedDoseEvent(event)}
                  />
                </View>
              ))
            )}
          </View>

          {/* ── Documentos Recientes ── */}
          <View style={styles.sectionHeader}>
            <Typography variant="h4">Documentos recientes</Typography>
            <TouchableOpacity
              onPress={() => navigation.navigate("MainTabs", { screen: "Documents" } as any)}
            >
              <Text style={[styles.seeAllText, { color: t.brand.fg }]}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionList}>
            {dash.isDocsLoading ? (
              <View style={styles.itemCard}>
                <ActivityIndicator color={t.accent.docFg} style={{ padding: spacing[6] }} />
              </View>
            ) : dash.recentDocs.length === 0 ? (
              <View style={styles.itemCard}>
                <View style={styles.emptyState}>
                  <FileText size={32} color={t.text.muted} />
                  <Typography variant="bodySm" color="secondary" align="center">
                    Aún no has subido documentos.
                  </Typography>
                </View>
              </View>
            ) : (
              dash.recentDocs.map((doc) => (
                <View key={doc.id} style={styles.itemCard}>
                  <DocumentListItem
                    document={doc}
                    isLast
                    onPress={() => navigation.navigate("DocumentDetail", { id: doc.id, title: doc.title, backTitle: "Inicio" })}
                  />
                </View>
              ))
            )}
          </View>

          {/* Bottom spacer for tab bar */}
          <View style={{ height: spacing[4] }} />
        </View>
      </ScrollView>

      {/* ── Modals ── */}
      {selectedDoseEvent && (
        <MedicationIntakeModal
          event={selectedDoseEvent}
          onClose={() => setSelectedDoseEvent(null)}
        />
      )}
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
    brandName: {
      fontSize: fontSize["2xl"],
      fontWeight: fontWeight.extrabold,
      color: colors.white,
      letterSpacing: 0.5,
    },
    greetingName: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.normal,
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
      color: t.brand.solid,
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

    // ── Tu día card ──
    dayCard: {
      flexDirection: "row",
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      padding: spacing[4],
      alignItems: "center",
      ...shadows.sm,
    },
    dayItem: {
      flex: 1,
      alignItems: "center",
      gap: spacing[1],
    },
    dayIconWrap: {
      width: 32,
      height: 32,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    dayValue: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.extrabold,
    },
    dayLabel: {
      fontSize: 11,
      fontWeight: fontWeight.medium,
    },
    daySeparator: {
      width: 1,
      height: 40,
      marginHorizontal: spacing[2],
    },

    // ── Sections ──
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing[1],
      marginBottom: spacing[2],
    },
    seeAllText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    sectionList: {
      gap: spacing[3],
    },
    itemCard: {
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      ...shadows.sm,
    },

    // ── Empty State ──
    emptyState: {
      alignItems: "center",
      gap: spacing[3],
      paddingVertical: spacing[6],
    },
  });
}
