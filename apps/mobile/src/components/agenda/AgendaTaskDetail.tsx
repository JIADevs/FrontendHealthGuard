import { useEffect, useMemo, useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Backpack, Bell, CalendarDays, Check, CheckSquare, Edit, FileText } from "lucide-react-native";
import {
  Button,
  Chip,
  IconButton,
  IconTile,
  Skeleton,
  SkeletonGroup,
  contentEntering,
  formatClock,
  formatShortDay,
  fontSize,
  nativeFont,
  spacing,
  useAppTheme,
  useSkeletonVisible,
  type ThemeContextValue,
  type Tone,
} from "@helu/ui";
import { useAgendaTaskByIdQuery, useBackpacksByIdsQuery, useDocumentsByIdsQuery } from "@helu/api/hooks";
import { ScreenHeader } from "../ScreenHeader";
import { SkeletonHeaderAction } from "../SkeletonPieces";
import { CompleteTaskSheet } from "./CompleteTaskSheet";
import { RescheduleTaskSheet } from "./RescheduleTaskSheet";

export interface AgendaTaskDetailProps {
  id: string;
  /** Opens a sheet right away (from a notification or a calendar row) */
  intent?: "complete" | "reschedule";
  onEdit: () => void;
  onBack: () => void;
}

/** «Hoy · 5:00 p. m.», «Mañana · …», «Jue 5 nov · …». */
function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  const label = diff === 0 ? "Hoy" : diff === 1 ? "Mañana" : diff === -1 ? "Ayer" : formatShortDay(d);
  return `${label} · ${formatClock(d)}`;
}

/** «1 hora antes», «15 min antes y 1 día antes». */
function remindersText(offsets: number[]): string {
  const one = (m: number) => (m % 1440 === 0 ? `${m / 1440} día${m === 1440 ? "" : "s"}` : m % 60 === 0 ? `${m / 60} hora${m === 60 ? "" : "s"}` : `${m} min`);
  return [...offsets].sort((a, b) => a - b).map((m) => `${one(m)} antes`).join(" y ");
}

/**
 * Mockup «Detalle de tarea»: one card with the brand tile, the title, when and the status chip, then
 * the notes, «Aviso» and «Para llevar». «Completar tarea» (success) and «Reprogramar» (secondary) while
 * it is pending; once completed, the result. Brand accent, like every agenda task.
 */
export function AgendaTaskDetail({ id, intent, onEdit, onBack }: AgendaTaskDetailProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { data: task, isLoading } = useAgendaTaskByIdQuery(id);
  const showSkeleton = useSkeletonVisible(isLoading);
  const [sheet, setSheet] = useState<"complete" | "reschedule" | null>(null);

  const docs = useDocumentsByIdsQuery(task?.documentIds ?? []);
  const packs = useBackpacksByIdsQuery(task?.backpackIds ?? []);
  const resultDocs = useDocumentsByIdsQuery(task?.resultDocumentIds ?? []);
  const resultPacks = useBackpacksByIdsQuery(task?.resultBackpackIds ?? []);

  useEffect(() => {
    if (!task || task.status === "completed") return;
    if (intent === "complete" || intent === "reschedule") setSheet(intent);
  }, [intent, task]);

  if (showSkeleton) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader title="Tarea" right={<SkeletonHeaderAction />} />
        {/* §6c: summary with its status chip, the description, the «Aviso» row and the two actions. */}
        <SkeletonGroup label="Cargando la tarea" style={styles.content}>
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Skeleton width={52} height={52} radius={16} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="70%" height={18} />
                <Skeleton width="45%" height={13} />
              </View>
              <Skeleton width={84} height={26} radius={13} />
            </View>
            <Skeleton width="80%" height={13} />
            <View style={styles.row}>
              <Skeleton width={40} height={40} radius={13} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="30%" height={14} />
                <Skeleton width="50%" height={12} />
              </View>
            </View>
          </View>
          <View style={styles.actions}>
            <Skeleton height={52} radius={14} />
            <Skeleton height={52} radius={14} />
          </View>
        </SkeletonGroup>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader title="Tarea" />
        <View style={styles.centered}>
          <Text style={styles.h3}>No encontramos esta tarea</Text>
          <Text style={[styles.sub, styles.center]}>Puede que la hayan eliminado.</Text>
          <Button variant="secondary" onPress={onBack}>
            Volver a la agenda
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const pending = task.status === "pending";
  const pick = <T,>(results: { data?: T }[]) => results.map((r) => r.data).filter((x): x is T => Boolean(x));
  const takeDocs = pick(docs);
  const takePacks = pick(packs);
  const gotDocs = pick(resultDocs);
  const gotPacks = pick(resultPacks);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Tarea"
        right={
          pending ? <IconButton icon={<Edit size={17} color={t.text.onMuted} />} accessibilityLabel="Editar tarea" onPress={onEdit} /> : undefined
        }
      />

      <Animated.ScrollView entering={contentEntering} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <IconTile tone="brand" size="lg" icon={<CheckSquare size={24} strokeWidth={2.2} color={t.brand.text} />} />
            <View style={styles.copy}>
              <Text style={styles.h2}>{task.title}</Text>
              <Text style={styles.sub}>{formatWhen(task.startAt)}</Text>
            </View>
            {pending ? (
              <Chip label="Pendiente" tone="warning" />
            ) : (
              <Chip label="Completada" tone="success" icon={<Check size={12} strokeWidth={3} color={t.status.successFg} />} />
            )}
          </View>
          {task.description ? <Text style={styles.sub}>{task.description}</Text> : null}
          <InfoRow tone="neutral" icon={<Bell size={19} strokeWidth={2.2} color={t.text.muted} />} title="Aviso" meta={remindersText(task.reminderOffsets)} />
          {takeDocs.length + takePacks.length > 0 ? (
            <>
              <Text style={styles.lbl}>Para llevar</Text>
              {takeDocs.map((d) => (
                <InfoRow key={d.id} tone="document" icon={<FileText size={19} strokeWidth={2.2} color={t.accent.docFg} />} title={d.title} />
              ))}
              {takePacks.map((b) => (
                <InfoRow key={b.id} tone="backpack" icon={<Backpack size={19} strokeWidth={2.2} color={t.accent.backpackFg} />} title={b.name} />
              ))}
            </>
          ) : null}
        </View>

        {!pending && (task.resultComment || gotDocs.length + gotPacks.length > 0) ? (
          <View style={styles.card}>
            <Text style={styles.h3}>Resultado</Text>
            {task.resultComment ? <Text style={styles.sub}>{task.resultComment}</Text> : null}
            {gotDocs.map((d) => (
              <InfoRow key={d.id} tone="document" icon={<FileText size={19} strokeWidth={2.2} color={t.accent.docFg} />} title={d.title} />
            ))}
            {gotPacks.map((b) => (
              <InfoRow key={b.id} tone="backpack" icon={<Backpack size={19} strokeWidth={2.2} color={t.accent.backpackFg} />} title={b.name} />
            ))}
          </View>
        ) : null}

        {pending ? (
          <View style={styles.actions}>
            <Button
              variant="success"
              size="lg"
              fullWidth
              icon={<Check size={17} strokeWidth={3} color={t.text.onSolid} />}
              onPress={() => setSheet("complete")}
            >
              Completar tarea
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              icon={<CalendarDays size={16} color={t.brand.text} />}
              onPress={() => setSheet("reschedule")}
            >
              Reprogramar
            </Button>
          </View>
        ) : null}
      </Animated.ScrollView>

      {sheet === "complete" ? <CompleteTaskSheet taskId={id} taskTitle={task.title} onClose={() => setSheet(null)} /> : null}
      {sheet === "reschedule" ? (
        <RescheduleTaskSheet taskId={id} taskTitle={task.title} startAt={task.startAt} onClose={() => setSheet(null)} />
      ) : null}
    </SafeAreaView>
  );
}

function InfoRow({ tone, icon, title, meta }: { tone: Tone; icon: ReactNode; title: string; meta?: string }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.row} accessible accessibilityLabel={meta ? `${title}, ${meta}` : title}>
      <IconTile tone={tone} icon={icon} />
      <View style={styles.copy}>
        <Text style={styles.rowTitle}>{title}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing[3], padding: spacing[6] },
    card: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      padding: spacing[4],
      gap: spacing[3],
    },
    summaryRow: { flexDirection: "row", alignItems: "center", gap: spacing[4] },
    row: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    h2: { fontSize: 19, lineHeight: 23, fontFamily: nativeFont("heading", 900), color: t.text.primary },
    h3: { fontSize: fontSize.md, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    sub: { fontSize: 14, lineHeight: 21, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    center: { textAlign: "center" },
    lbl: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    rowTitle: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    actions: { gap: spacing[3] },
  });
}
