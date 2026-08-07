import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { type DailyCheckIn } from "@helu/api";

import { useWellbeingScreen } from "../hooks/useWellbeingScreen";
import { useMedicationIntakeIntent } from "../hooks/useMedicationIntakeIntent";
import { useDailyCheckInIntent } from "../hooks/useDailyCheckInIntent";
import type { AgendaRouteParams } from "../navigation/RootNavigator";

import {
  colors, palette,
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  Typography,
  Button,
  Spinner,
  EmptyState,
  HeluAgendaCalendar,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  Heart,
  Menu,
  ChevronLeft,
} from "lucide-react-native";

import {
  DailyCheckInListItem,
  DailyCheckInForm,
  WellbeingFAB,
  WellbeingHeader,
  AgendaMenuSheet,
  AgendaFAB,
  AgendaAddSheet,
  MedicationIntakeModal,
  AppointmentsTab,
  MedicationsTab,
  type AgendaView,
} from "../components/agenda";
import type { AgendaEvent } from "@helu/ui";

// ─── helpers ──────────────────────────────────────────────────────────────────

const LIST_VIEW_TITLES: Record<Exclude<AgendaView, "calendar">, string> = {
  appointments: "Citas",
  medications: "Medicamentos",
  wellbeing: "Bienestar",
};

function isAgendaView(value: string | undefined): value is AgendaView {
  return (
    value === "calendar" ||
    value === "appointments" ||
    value === "medications" ||
    value === "wellbeing"
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────

export function AgendaScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const route = useRoute();
  const navigation = useNavigation();
  const params = (route.params ?? {}) as AgendaRouteParams;
  const [view, setView] = useState<AgendaView>("calendar");
  const [menuOpen, setMenuOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [checkInFormOpen, setCheckInFormOpen] = useState(false);
  const [intentIntakeEvent, setIntentIntakeEvent] = useState<
    Extract<AgendaEvent, { type: "medication" }> | null
  >(null);
  const lastHandledIntentAt = useRef<number | null>(null);

  const intentAt = params.intentAt;
  const intentActive =
    typeof intentAt === "number" && intentAt !== lastHandledIntentAt.current;

  const medicationIntentEnabled =
    intentActive && params.intent === "medication-intake";
  const checkInIntentEnabled =
    intentActive && params.intent === "daily-checkin";

  const medicationIntent = useMedicationIntakeIntent({
    enabled: medicationIntentEnabled,
    medicationId: params.medicationId,
    cycleId: params.cycleId,
    scheduledTime: params.scheduledTime,
    medicationName: params.medicationName,
  });
  const checkInIntent = useDailyCheckInIntent(checkInIntentEnabled);

  useEffect(() => {
    if (isAgendaView(params.initialTab)) {
      setView(params.initialTab);
    }
  }, [params.initialTab]);

  useEffect(() => {
    if (!medicationIntentEnabled || !intentAt) return;

    if (medicationIntent.status === "missing-fields" || medicationIntent.status === "error") {
      lastHandledIntentAt.current = intentAt;
      setView("medications");
      return;
    }
    if (medicationIntent.status === "ready" && medicationIntent.event) {
      lastHandledIntentAt.current = intentAt;
      setView("calendar");
      setIntentIntakeEvent(medicationIntent.event);
    }
  }, [medicationIntentEnabled, medicationIntent, intentAt]);

  useEffect(() => {
    if (!checkInIntentEnabled || !intentAt) return;

    if (checkInIntent.status === "form") {
      lastHandledIntentAt.current = intentAt;
      setView("calendar");
      setCheckInFormOpen(true);
      return;
    }
    if (checkInIntent.status === "already-done" || checkInIntent.status === "error") {
      lastHandledIntentAt.current = intentAt;
      setView("wellbeing");
    }
  }, [checkInIntentEnabled, checkInIntent, intentAt]);

  const isListView = view !== "calendar";
  const intentLoading =
    (medicationIntentEnabled && medicationIntent.status === "loading") ||
    (checkInIntentEnabled && checkInIntent.status === "loading");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        {isListView ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setView("calendar")}
            accessibilityLabel="Volver al calendario"
          >
            <ChevronLeft size={22} color={t.brand.fg} />
            <Text style={styles.backLabel}>Calendario</Text>
          </TouchableOpacity>
        ) : (
          <Typography variant="h2">Agenda Médica</Typography>
        )}

        {isListView && view !== "wellbeing" ? (
          <Typography variant="h3">{LIST_VIEW_TITLES[view]}</Typography>
        ) : !isListView ? (
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuOpen(true)}
            accessibilityLabel="Abrir menú de agenda"
          >
            <Menu size={22} color={t.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {intentLoading ? (
        <View style={[styles.tabContent, styles.center]}>
          <Spinner size="lg" />
        </View>
      ) : view === "calendar" ? (
        <CalendarTab
          intentIntakeEvent={intentIntakeEvent}
          onIntentIntakeConsumed={() => setIntentIntakeEvent(null)}
        />
      ) : view === "appointments" ? (
        <AppointmentsTab />
      ) : view === "medications" ? (
        <MedicationsTab />
      ) : (
        <WellbeingTab />
      )}

      {view === "calendar" && !intentLoading ? (
        <>
          <AgendaFAB onPress={() => setAddSheetOpen(true)} />

          <AgendaAddSheet
            visible={addSheetOpen}
            onClose={() => setAddSheetOpen(false)}
            onAddAppointment={() => navigation.navigate("AppointmentForm" as never)}
            onAddMedication={() => navigation.navigate("MedicationForm" as never)}
            onAddCheckIn={() => setCheckInFormOpen(true)}
          />

          {checkInFormOpen ? (
            <DailyCheckInForm onClose={() => setCheckInFormOpen(false)} />
          ) : null}
        </>
      ) : null}

      <AgendaMenuSheet
        visible={menuOpen}
        activeView={view}
        onClose={() => setMenuOpen(false)}
        onSelect={setView}
      />
    </SafeAreaView>
  );
}

// ─── calendar tab ─────────────────────────────────────────────────────────────

function CalendarTab({
  intentIntakeEvent,
  onIntentIntakeConsumed,
}: {
  intentIntakeEvent: Extract<AgendaEvent, { type: "medication" }> | null;
  onIntentIntakeConsumed: () => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation();
  const [intakeEvent, setIntakeEvent] = useState<Extract<AgendaEvent, { type: "medication" }> | null>(null);
  const [checkInEvent, setCheckInEvent] = useState<Extract<AgendaEvent, { type: "checkin" }> | null>(null);

  useEffect(() => {
    if (intentIntakeEvent) {
      setIntakeEvent(intentIntakeEvent);
      onIntentIntakeConsumed();
    }
  }, [intentIntakeEvent, onIntentIntakeConsumed]);

  return (
    <View style={styles.tabContent}>
      <HeluAgendaCalendar
        onMedicationPress={setIntakeEvent}
        onAppointmentPress={(event) =>
          (navigation as { navigate: (name: string, params: { id: string }) => void }).navigate(
            "AppointmentDetail",
            { id: event.data.id },
          )
        }
        onCheckInPress={setCheckInEvent}
      />

      {intakeEvent ? (
        <MedicationIntakeModal event={intakeEvent} onClose={() => setIntakeEvent(null)} />
      ) : null}

      {checkInEvent ? (
        <DailyCheckInForm
          onClose={() => setCheckInEvent(null)}
          initialValues={checkInEvent.data}
        />
      ) : null}
    </View>
  );
}

// ─── wellbeing tab ────────────────────────────────────────────────────────────

function WellbeingTab() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [formTarget, setFormTarget] = useState<DailyCheckIn | "new" | null>(null);
  const screen = useWellbeingScreen();

  const handleEndReached = useCallback(() => {
    if (screen.hasNextPage && !screen.isFetchingNextPage) {
      screen.fetchNextPage();
    }
  }, [screen.hasNextPage, screen.isFetchingNextPage, screen.fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: DailyCheckIn }) => (
      <DailyCheckInListItem
        checkIn={item}
        onEdit={(checkIn) => setFormTarget(checkIn)}
      />
    ),
    [],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <View style={styles.wellbeingSectionHeader}>
        <Text style={styles.wellbeingSectionTitle}>{section.title}</Text>
      </View>
    ),
    [styles.wellbeingSectionHeader, styles.wellbeingSectionTitle],
  );

  return (
    <View style={styles.tabContent}>
      <WellbeingHeader total={screen.total} isLoading={screen.isLoading} />

      {screen.isLoading ? (
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      ) : screen.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            Error al cargar check-ins. Verificá tu conexión.
          </Text>
          <TouchableOpacity onPress={() => screen.refetch()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : screen.items.length === 0 ? (
        <EmptyState
          icon={<Heart size={48} color={t.border.medium} />}
          message="No tenés check-ins registrados."
          action={
            <Button onPress={() => setFormTarget("new")}>
              Registrar check-in
            </Button>
          }
        />
      ) : (
        <SectionList
          sections={screen.sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          refreshControl={
            <RefreshControl
              refreshing={screen.isRefetching}
              onRefresh={screen.refetch}
              tintColor={t.brand.fg}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.wellbeingListContent}
          ItemSeparatorComponent={() => <View style={styles.wellbeingItemSeparator} />}
          SectionSeparatorComponent={() => <View style={styles.wellbeingSectionSeparator} />}
          ListFooterComponent={
            screen.isFetchingNextPage ? (
              <ActivityIndicator style={styles.wellbeingListFooter} color={t.brand.fg} />
            ) : null
          }
        />
      )}

      <WellbeingFAB onPress={() => setFormTarget("new")} />

      {formTarget !== null && (
        <DailyCheckInForm
          onClose={() => setFormTarget(null)}
          initialValues={formTarget === "new" ? undefined : formTarget}
        />
      )}
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:          { flex: 1, backgroundColor: t.surface.bg },
    header:             {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
      backgroundColor: t.surface.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: t.border.medium,
    },
    backBtn:            { flexDirection: "row", alignItems: "center", gap: spacing[1], flex: 1 },
    backLabel:          { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: t.brand.fg },
    menuBtn:            { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radii.md },
    headerSpacer:       { width: 40 },
    tabContent:         { flex: 1 },
    wellbeingListContent: { paddingBottom: spacing[12] + 56 },
    wellbeingSectionHeader: {
      paddingHorizontal: spacing[4],
      paddingTop: spacing[4],
      paddingBottom: spacing[2],
      backgroundColor: t.surface.bg,
    },
    wellbeingSectionTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
      textTransform: "capitalize",
    },
    wellbeingItemSeparator: {
      height: 1,
      backgroundColor: t.border.light,
      marginLeft: spacing[4] + 44 + spacing[3],
    },
    wellbeingSectionSeparator: {
      height: spacing[2],
    },
    wellbeingListFooter: {
      paddingVertical: spacing[4],
    },
    center:{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[3], padding: spacing[6] },
    iconBtn:            { width: 34, height: 34, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: t.surface.bg },

    fieldLabel:         { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: t.text.primary, marginBottom: spacing[2] },
    errorText:          { color: t.status.errorFg, fontSize: fontSize.sm, marginTop: spacing[3], backgroundColor: t.status.errorBg, padding: spacing[3], borderRadius: radii.sm },
    retryText:          { color: t.brand.fg, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginTop: spacing[2] },
    typeRow:            { flexDirection: "row", gap: spacing[2] },
    typePill:           { flex: 1, paddingVertical: spacing[2], borderRadius: radii.md, alignItems: "center", backgroundColor: t.surface.bg, borderWidth: 1, borderColor: t.border.medium },
    typePillActive:     { backgroundColor: t.brand.fg, borderColor: t.brand.fg },
    typePillText:       { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: t.text.secondary },
    typePillTextActive: { color: colors.white },
  });
}
