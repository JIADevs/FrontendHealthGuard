import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import {
  useAgendaTaskByIdQuery,
  useCompleteAgendaTaskMutation,
  useRescheduleAgendaTaskMutation,
  useDocumentsQuery,
  useBackpacksQuery,
  useDocumentsByIdsQuery,
  useBackpacksByIdsQuery,
  buildAgendaTaskStartAt,
} from "@helu/api/hooks";
import { isApiError } from "@helu/api";
import {
  useAppTheme,
  Spinner,
  spacing,
  fontSize,
  fontWeight,
  radii,
  DatePicker,
  TimePicker,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  Calendar,
  Clock,
  Bell,
  ListTodo,
  Pencil,
  X,
  Plus,
  FileText,
  Backpack,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { DetailHeader } from "../components/DetailHeader";
import { DetailFooter, type FooterAction } from "../components/DetailFooter";

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
  const completeMut = useCompleteAgendaTaskMutation();
  const rescheduleMut = useRescheduleAgendaTaskMutation();

  const [completeOpen, setCompleteOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [resultComment, setResultComment] = useState("");
  const [resultDocumentIds, setResultDocumentIds] = useState<string[]>([]);
  const [resultBackpackIds, setResultBackpackIds] = useState<string[]>([]);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const linkedDocs = useDocumentsByIdsQuery(task?.documentIds ?? []);
  const linkedBps = useBackpacksByIdsQuery(task?.backpackIds ?? []);
  const resultDocs = useDocumentsByIdsQuery(task?.resultDocumentIds ?? []);
  const resultBps = useBackpacksByIdsQuery(task?.resultBackpackIds ?? []);

  const allDocsQuery = useDocumentsQuery("", 1, 100);
  const allBpsQuery = useBackpacksQuery("", 100);

  useEffect(() => {
    if (!task || task.status === "completed") return;
    if (intent === "complete") setCompleteOpen(true);
    if (intent === "reschedule") {
      const split = formatStart(task.startAt);
      setRescheduleDate(split.dateKey);
      setRescheduleTime(split.timeKey);
      setRescheduleOpen(true);
    }
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

  const footerActions: FooterAction[] = pending
    ? [
        {
          label: completeMut.isPending ? "Completando…" : "Completar",
          variant: "primary",
          disabled: completeMut.isPending || rescheduleMut.isPending,
          onPress: () => {
            setResultComment("");
            setResultDocumentIds([]);
            setResultBackpackIds([]);
            setCompleteOpen(true);
          },
        },
        {
          label: "Reagendar",
          variant: "outline",
          disabled: completeMut.isPending || rescheduleMut.isPending,
          onPress: () => {
            const split = formatStart(task.startAt);
            setRescheduleDate(split.dateKey);
            setRescheduleTime(split.timeKey);
            setRescheduleOpen(true);
          },
        },
      ]
    : [];

  function handleComplete() {
    completeMut.mutate(
      {
        id,
        result: {
          resultComment: resultComment.trim() || null,
          resultDocumentIds,
          resultBackpackIds,
        },
      },
      {
        onSuccess: () => {
          setCompleteOpen(false);
          Toast.show({ type: "success", text1: "Tarea completada" });
        },
        onError: (err) => {
          Toast.show({
            type: "error",
            text1: "No se pudo completar",
            text2: isApiError(err) ? err.message : undefined,
          });
        },
      },
    );
  }

  function handleReschedule() {
    if (!rescheduleDate || !rescheduleTime) {
      Toast.show({ type: "error", text1: "Elegí fecha y hora" });
      return;
    }
    rescheduleMut.mutate(
      {
        id,
        schedule: { startAt: buildAgendaTaskStartAt(rescheduleDate, rescheduleTime) },
      },
      {
        onSuccess: () => {
          setRescheduleOpen(false);
          Toast.show({ type: "success", text1: "Tarea reagendada" });
        },
        onError: (err) => {
          Toast.show({
            type: "error",
            text1: "No se pudo reagendar",
            text2: isApiError(err) ? err.message : undefined,
          });
        },
      },
    );
  }

  const docLabel = (docId: string) =>
    (allDocsQuery.data?.items ?? []).find((d) => d.id === docId)?.title ??
    linkedDocs.data?.find((d) => d.id === docId)?.title ??
    docId.slice(0, 8);
  const bpLabel = (bpId: string) =>
    (allBpsQuery.data?.items ?? []).find((b) => b.id === bpId)?.name ??
    linkedBps.data?.find((b) => b.id === bpId)?.name ??
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            <ListTodo size={22} color={t.accent.backpackFg} strokeWidth={2.25} />
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
                  {resultDocs.data?.find((d) => d.id === docId)?.title ?? docId.slice(0, 8)}
                </Text>
              </View>
            ))}
            {task.resultBackpackIds.map((bpId) => (
              <View key={bpId} style={styles.linkRow}>
                <Backpack size={14} color={t.text.secondary} />
                <Text style={styles.linkLine}>
                  {resultBps.data?.find((b) => b.id === bpId)?.name ?? bpId.slice(0, 8)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <DetailFooter actions={footerActions} />

      {/* Complete sheet */}
      <Modal visible={completeOpen} transparent animationType="slide" onRequestClose={() => setCompleteOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCompleteOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Completar tarea</Text>
              <TouchableOpacity onPress={() => setCompleteOpen(false)}>
                <X size={22} color={t.text.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Todo es opcional.</Text>

            <Text style={styles.fieldLabel}>Documentos resultado</Text>
            <View style={styles.chipWrap}>
              {resultDocumentIds.map((docId) => (
                <TouchableOpacity
                  key={docId}
                  style={styles.chip}
                  onPress={() => setResultDocumentIds((ids) => ids.filter((x) => x !== docId))}
                >
                  <FileText size={12} color={t.accent.backpackFg} />
                  <Text style={styles.chipText}>{docLabel(docId)}</Text>
                  <X size={12} color={t.accent.backpackFg} />
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44 }}>
              {(allDocsQuery.data?.items ?? [])
                .filter((d) => !resultDocumentIds.includes(d.id))
                .slice(0, 20)
                .map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={styles.addChip}
                    onPress={() => setResultDocumentIds((ids) => [...ids, d.id])}
                  >
                    <Plus size={12} color={t.brand.fg} />
                    <Text style={styles.addChipText}>{d.title}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Mochilas resultado</Text>
            <View style={styles.chipWrap}>
              {resultBackpackIds.map((bpId) => (
                <TouchableOpacity
                  key={bpId}
                  style={styles.chip}
                  onPress={() => setResultBackpackIds((ids) => ids.filter((x) => x !== bpId))}
                >
                  <Backpack size={12} color={t.accent.backpackFg} />
                  <Text style={styles.chipText}>{bpLabel(bpId)}</Text>
                  <X size={12} color={t.accent.backpackFg} />
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44 }}>
              {(allBpsQuery.data?.items ?? [])
                .filter((b) => !resultBackpackIds.includes(b.id))
                .slice(0, 20)
                .map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={styles.addChip}
                    onPress={() => setResultBackpackIds((ids) => [...ids, b.id])}
                  >
                    <Plus size={12} color={t.brand.fg} />
                    <Text style={styles.addChipText}>{b.name}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Comentario</Text>
            <TextInput
              style={styles.commentInput}
              value={resultComment}
              onChangeText={setResultComment}
              placeholder="Opcional"
              placeholderTextColor={t.text.muted}
              multiline
            />

            <TouchableOpacity
              style={[styles.primaryBtn, completeMut.isPending && styles.btnDisabled]}
              onPress={handleComplete}
              disabled={completeMut.isPending}
            >
              {completeMut.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Reschedule sheet */}
      <Modal
        visible={rescheduleOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRescheduleOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setRescheduleOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Reagendar</Text>
              <TouchableOpacity onPress={() => setRescheduleOpen(false)}>
                <X size={22} color={t.text.secondary} />
              </TouchableOpacity>
            </View>
            <DatePicker
              label="Nueva fecha"
              value={rescheduleDate}
              onChange={setRescheduleDate}
              placeholder="Fecha"
              required
            />
            <TimePicker
              label="Nueva hora"
              value={rescheduleTime}
              onChange={setRescheduleTime}
              placeholder="Hora"
              required
            />
            <TouchableOpacity
              style={[styles.primaryBtn, rescheduleMut.isPending && styles.btnDisabled]}
              onPress={handleReschedule}
              disabled={rescheduleMut.isPending}
            >
              {rescheduleMut.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Guardar nueva fecha</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.surface.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing[5] },
    errorText: { fontSize: fontSize.sm, color: t.status.errorFg, textAlign: "center" },
    content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },
    titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing[3] },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: t.accent.backpackBg,
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
    badgePending: { backgroundColor: t.accent.backpackBg },
    badgeDone: { backgroundColor: t.status.successBg },
    badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
    badgeTextPending: { color: t.accent.backpackFg },
    badgeTextDone: { color: t.status.successFg },
    metaCard: {
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      padding: spacing[4],
      gap: spacing[3],
    },
    metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
    metaText: { flex: 1, fontSize: fontSize.sm, color: t.text.primary },
    sectionTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: t.text.primary },
    linkRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    linkLine: { flex: 1, fontSize: fontSize.sm, color: t.text.secondary },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: t.surface.bgCard,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      padding: spacing[5],
      gap: spacing[3],
      maxHeight: "88%",
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sheetTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: t.text.primary },
    hint: { fontSize: fontSize.xs, color: t.text.secondary },
    fieldLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: t.text.secondary,
      marginTop: spacing[1],
    },
    chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: t.accent.backpackBg,
      borderRadius: radii.full,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderWidth: 1,
      borderColor: t.accent.backpackFg,
    },
    chipText: { fontSize: fontSize.xs, color: t.accent.backpackFg },
    addChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginRight: spacing[2],
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: t.brand.fg,
    },
    addChipText: { fontSize: fontSize.xs, color: t.brand.fg, maxWidth: 120 },
    commentInput: {
      minHeight: 80,
      borderWidth: 1,
      borderColor: t.border.medium,
      borderRadius: radii.md,
      padding: spacing[3],
      color: t.text.primary,
      textAlignVertical: "top",
    },
    primaryBtn: {
      backgroundColor: t.brand.fg,
      borderRadius: radii.md,
      paddingVertical: spacing[3],
      alignItems: "center",
      marginTop: spacing[2],
    },
    primaryBtnText: { color: "#fff", fontWeight: fontWeight.bold, fontSize: fontSize.base },
    btnDisabled: { opacity: 0.6 },
  });
}
