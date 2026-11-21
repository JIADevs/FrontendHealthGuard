import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import {
  useAgendaTaskByIdQuery,
  useDocumentsQuery,
  useBackpacksQuery,
  useDocumentsByIdsQuery,
  useBackpacksByIdsQuery,
} from "@helu/api/hooks";
import {
  useAppTheme,
  Spinner,
  spacing,
  fontSize,
  fontWeight,
  radii,
  BottomActionBar,
  BOTTOM_ACTION_BAR_HEIGHT,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  Calendar,
  Clock,
  Bell,
  CheckSquare,
  Pencil,
  FileText,
  Backpack,
} from "lucide-react-native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { DetailHeader } from "../components/DetailHeader";
import { CompleteTaskSheet } from "../components/agenda/CompleteTaskSheet";
import { RescheduleTaskSheet } from "../components/agenda/RescheduleTaskSheet";

type AgendaTaskDetailRoute = RouteProp<RootStackParamList, "AgendaTaskDetail">;

function formatStart(iso: string): { date: string; time: string; dateKey: string; timeKey: string } {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: d.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
    dateKey: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    timeKey: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function statusLabel(status: string): string {
  return status === "completed" ? "Completada" : "Pendiente";
}

export function AgendaTaskDetailScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation();
  const route = useRoute<AgendaTaskDetailRoute>();
  const { id, intent } = route.params;

  const { data: task, isLoading, isError } = useAgendaTaskByIdQuery(id);
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState<"complete" | "reschedule" | null>(null);

  const linkedDocs = useDocumentsByIdsQuery(task?.documentIds ?? []);
  const linkedBps = useBackpacksByIdsQuery(task?.backpackIds ?? []);
  const resultDocs = useDocumentsByIdsQuery(task?.resultDocumentIds ?? []);
  const resultBps = useBackpacksByIdsQuery(task?.resultBackpackIds ?? []);
  // `use…ByIdsQuery` returns one result per id (useQueries), so names come from each `.data`.
  const docTitles = new Map<string, string>();
  for (const q of [...linkedDocs, ...resultDocs]) if (q.data) docTitles.set(q.data.id, q.data.title);
  const backpackNames = new Map<string, string>();
  for (const q of [...linkedBps, ...resultBps]) if (q.data) backpackNames.set(q.data.id, q.data.name);

  const allDocsQuery = useDocumentsQuery("", 1, 100);
  const allBpsQuery = useBackpacksQuery("", 100);

  useEffect(() => {
    if (!task || task.status === "completed") return;
    if (intent === "complete" || intent === "reschedule") setSheet(intent);
  }, [intent, task]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DetailHeader />
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !task) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DetailHeader />
        <View style={styles.center}>
          <Text style={styles.errorText}>No se pudo cargar la tarea.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { date, time } = formatStart(task.startAt);
  const pending = task.status === "pending";
  const offsetsLabel =
    task.reminderOffsets.length > 0
      ? task.reminderOffsets.map((m) => `${m} min antes`).join(", ")
      : "Sin avisos";

  const docLabel = (docId: string) =>
    (allDocsQuery.data?.items ?? []).find((d) => d.id === docId)?.title ??
    docTitles.get(docId) ??
    docId.slice(0, 8);
  const bpLabel = (bpId: string) =>
    (allBpsQuery.data?.items ?? []).find((b) => b.id === bpId)?.name ??
    backpackNames.get(bpId) ??
    bpId.slice(0, 8);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        actions={
          pending
            ? [
                {
                  icon: Pencil,
                  label: "Editar",
                  onPress: () =>
                    (navigation as { navigate: (n: string, p: { id: string }) => void }).navigate(
                      "AgendaTaskForm",
                      { id },
                    ),
                },
              ]
            : []
        }
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          pending && { paddingBottom: BOTTOM_ACTION_BAR_HEIGHT * 2 + insets.bottom + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            <CheckSquare size={22} color={t.brand.text} strokeWidth={2.25} />
          </View>
          <View style={styles.titleText}>
            <Text style={styles.eyebrow}>Tarea</Text>
            <Text style={styles.title}>{task.title}</Text>
          </View>
        </View>

        <View
          style={[styles.badge, task.status === "completed" ? styles.badgeDone : styles.badgePending]}
        >
          <Text
            style={[
              styles.badgeText,
              task.status === "completed" ? styles.badgeTextDone : styles.badgeTextPending,
            ]}
          >
            {statusLabel(task.status)}
          </Text>
        </View>

        {task.description ? <Text style={styles.description}>{task.description}</Text> : null}

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Calendar size={18} color={t.text.secondary} />
            <Text style={styles.metaText}>{date}</Text>
          </View>
          <View style={styles.metaRow}>
            <Clock size={18} color={t.text.secondary} />
            <Text style={styles.metaText}>{time}</Text>
          </View>
          <View style={styles.metaRow}>
            <Bell size={18} color={t.text.secondary} />
            <Text style={styles.metaText}>{offsetsLabel}</Text>
          </View>
        </View>

        {(task.documentIds.length > 0 || task.backpackIds.length > 0) && (
          <View style={styles.metaCard}>
            <Text style={styles.sectionTitle}>Vinculado</Text>
            {task.documentIds.map((docId) => (
              <View key={docId} style={styles.linkRow}>
                <FileText size={14} color={t.text.secondary} />
                <Text style={styles.linkLine}>{docLabel(docId)}</Text>
              </View>
            ))}
            {task.backpackIds.map((bpId) => (
              <View key={bpId} style={styles.linkRow}>
                <Backpack size={14} color={t.text.secondary} />
                <Text style={styles.linkLine}>{bpLabel(bpId)}</Text>
              </View>
            ))}
          </View>
        )}

        {task.status === "completed" &&
        (task.resultComment ||
          task.resultDocumentIds.length > 0 ||
          task.resultBackpackIds.length > 0) ? (
          <View style={styles.metaCard}>
            <Text style={styles.sectionTitle}>Resultado</Text>
            {task.resultComment ? (
              <Text style={styles.description}>{task.resultComment}</Text>
            ) : null}
            {task.resultDocumentIds.map((docId) => (
              <View key={docId} style={styles.linkRow}>
                <FileText size={14} color={t.text.secondary} />
                <Text style={styles.linkLine}>
                  {docLabel(docId)}
                </Text>
              </View>
            ))}
            {task.resultBackpackIds.map((bpId) => (
              <View key={bpId} style={styles.linkRow}>
                <Backpack size={14} color={t.text.secondary} />
                <Text style={styles.linkLine}>
                  {bpLabel(bpId)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* inicio-agenda.md · Tareas: «Completar» (éxito) y «Reprogramar» (secundaria) */}
      {pending ? (
        <BottomActionBar
          primary={{ label: "Completar tarea", variant: "success", onPress: () => setSheet("complete") }}
          secondary={{ label: "Reprogramar", onPress: () => setSheet("reschedule") }}
        />
      ) : null}

      {sheet === "complete" ? (
        <CompleteTaskSheet taskId={id} taskTitle={task.title} onClose={() => setSheet(null)} />
      ) : null}
      {sheet === "reschedule" ? (
        <RescheduleTaskSheet
          taskId={id}
          taskTitle={task.title}
          startAt={task.startAt}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.surface.bgCard },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing[5] },
    errorText: { fontSize: fontSize.sm, color: t.status.errorFg, textAlign: "center" },
    content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },
    titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing[3] },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: t.brand.tint,
      alignItems: "center",
      justifyContent: "center",
    },
    titleText: { flex: 1, gap: spacing[1] },
    eyebrow: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      color: t.text.secondary,
      textTransform: "uppercase",
    },
    title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: t.text.primary },
    description: { fontSize: fontSize.base, color: t.text.secondary, lineHeight: 22 },
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: radii.full,
    },
    badgePending: { backgroundColor: t.status.warningBg },
    badgeDone: { backgroundColor: t.status.successBg },
    badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
    badgeTextPending: { color: t.status.warningFg },
    badgeTextDone: { color: t.status.successFg },
    metaCard: {
      gap: spacing[3],
      paddingTop: spacing[3],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border.light,
    },
    metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
    metaText: { flex: 1, fontSize: fontSize.sm, color: t.text.primary },
    sectionTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: t.text.primary },
    linkRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    linkLine: { flex: 1, fontSize: fontSize.sm, color: t.text.secondary },
  });
}
