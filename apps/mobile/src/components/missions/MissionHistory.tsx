import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, FileText, Route } from "lucide-react-native";
import { useMissionEventsQuery, useMissionQuery, type Mission, type MissionEvent } from "@helu/api";
import {
  IconTile,
  SkeletonCard,
  SkeletonGroup,
  contentEntering,
  nativeFont,
  spacing,
  toneColors,
  useAppTheme,
  useSkeletonVisible,
  type Tone,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { LoadError } from "../states/LoadError";
import { shortDate, stepTitle, timeLabel } from "./missionCopy";

/** What happened, without clinical data (RNF-33: events carry no document titles or diagnoses). */
function describe(e: MissionEvent, mission: Mission): string {
  const step = e.stepKey ? `«${stepTitle(mission, e.stepKey)}»` : "un paso";
  switch (e.type) {
    case "created": return "Creó la misión";
    case "step_completed": return `Completó ${step}`;
    case "step_skipped": return `Marcó ${step} como «No aplica»`;
    case "step_edited": return "Editó la misión";
    case "document_linked": return "Adjuntó un documento";
    case "document_unlinked": return "Quitó un documento";
    case "shared": return "Compartió los documentos";
    case "paused": return "Pausó la misión";
    case "resumed": return "Reanudó la misión";
    case "canceled": return "Canceló la misión";
    case "completed": return "Completó la misión";
    case "appointment_changed": return "Cambió la cita";
    case "session_attended": return "Registró una sesión";
    case "task_created": return "Creó un recordatorio";
    case "suggestion_accepted": return "Creó la misión desde una sugerencia";
    default: return "Actualizó la misión";
  }
}

function toneOf(e: MissionEvent): { tone: Tone; icon: typeof Check } {
  if (e.type === "step_completed" || e.type === "completed" || e.type === "session_attended") return { tone: "success", icon: Check };
  if (e.type === "document_linked" || e.type === "document_unlinked" || e.type === "shared") return { tone: "document", icon: FileText };
  return { tone: "brand", icon: Route };
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dayHeading(iso: string) {
  const today = dayKey(new Date().toISOString());
  const k = dayKey(iso);
  if (k === today) return "HOY";
  if (k === today - 86_400_000) return "AYER";
  return shortDate(iso).toUpperCase();
}

/**
 * Mockup «Historial de la misión» (RF-17, RF-71): each event with its real author (the patient or a
 * manager) and time, grouped by day. The history keeps no clinical data, only what changed and who.
 */
export function MissionHistory({ missionId, onBack }: { missionId: string; onBack: () => void }) {
  const t = useAppTheme();
  const mission = useMissionQuery(missionId);
  const events = useMissionEventsQuery(missionId);
  const showSkeleton = useSkeletonVisible(events.isLoading || mission.isLoading);
  const items = events.data?.items ?? [];

  const groups: { heading: string; items: MissionEvent[] }[] = [];
  for (const e of items) {
    const heading = dayHeading(e.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) last.items.push(e);
    else groups.push({ heading, items: [e] });
  }

  const who = (e: MissionEvent) =>
    !e.actor || e.actor.id === mission.data?.userId ? "Tú" : `${e.actor.name ?? "Tu gestor"} (gestor)`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.surface.bg }]} edges={["top"]}>
      <ScreenHeader title="Historial" subtitle={mission.data?.title} onBack={onBack} />
      {showSkeleton ? (
        <SkeletonGroup label="Cargando el historial" style={styles.content}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </SkeletonGroup>
      ) : events.isError || !mission.data ? (
        <View style={styles.content}>
          <LoadError title="No se pudo cargar el historial" onRetry={() => void events.refetch()} retrying={events.isFetching} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={contentEntering} style={[styles.card, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}>
            {groups.map((g, gi) => (
              <View key={g.heading} style={{ gap: spacing[1], paddingTop: gi === 0 ? 0 : spacing[2] }}>
                <Text style={[styles.eyebrow, { color: t.text.secondary }]}>{g.heading}</Text>
                {g.items.map((e) => {
                  const { tone, icon: Icon } = toneOf(e);
                  return (
                    <View key={e.id} style={styles.row} accessible accessibilityLabel={`${describe(e, mission.data!)}. ${who(e)}, ${timeLabel(e.createdAt)}`}>
                      <IconTile tone={tone} icon={<Icon size={18} strokeWidth={2.4} color={toneColors(tone, t.mode).fg} />} />
                      <View style={styles.copy}>
                        <Text style={[styles.title, { color: t.text.primary }]}>{describe(e, mission.data!)}</Text>
                        <Text style={[styles.meta, { color: t.text.secondary }]}>
                          {who(e)} · {timeLabel(e.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </Animated.View>
          <Text style={[styles.note, { color: t.text.secondary }]}>El historial no guarda datos clínicos, solo qué cambió y quién.</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[12] },
  card: { paddingHorizontal: 14, paddingVertical: 14, borderRadius: 18, borderWidth: 1, borderBottomWidth: 4 },
  eyebrow: { fontSize: 11, letterSpacing: 1, fontFamily: nativeFont("heading", 900) },
  row: { flexDirection: "row", alignItems: "center", gap: spacing[3], paddingVertical: 6 },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600) },
  meta: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400) },
  note: { fontSize: 13, lineHeight: 18, textAlign: "center", fontFamily: nativeFont("body", 400) },
});
