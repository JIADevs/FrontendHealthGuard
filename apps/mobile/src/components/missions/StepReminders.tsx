import { StyleSheet, Text, View } from "react-native";
import { AlarmClock, Plus } from "lucide-react-native";
import { Chip, IconTile, nativeFont, spacing, useAppTheme } from "@helu/ui";
import type { Mission, MissionStep } from "@helu/api";
import { capitalize, relativeDay, timeLabel } from "./missionCopy";
import { MissionLink } from "./MissionLink";

/**
 * «Recordatorios» inside a step (mockup «Paso con tarea de apoyo», RF-27, DA-10): support tasks of this
 * step. They live in Agenda with their reminders; completing one never completes the step.
 */
export function StepReminders({ mission, step, onCreate }: { mission: Mission; step: MissionStep; onCreate: () => void }) {
  const t = useAppTheme();
  const tasks = mission.tasks.filter((task) => task.stepKey === step.key);
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={[styles.label, { color: t.text.primary }]}>Recordatorios</Text>
        <MissionLink icon={<Plus size={14} strokeWidth={2.6} color={t.brand.text} />} label="Crear recordatorio" onPress={onCreate} />
      </View>
      {tasks.map((task) => (
        <View key={task.id} style={[styles.row, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}>
          <IconTile tone="brand" icon={<AlarmClock size={17} strokeWidth={2.2} color={t.brand.solid} />} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: t.text.primary }]} numberOfLines={2}>
              {task.title}
            </Text>
            <Text style={[styles.meta, { color: t.text.secondary }]}>
              {capitalize(relativeDay(task.startAt))} · {timeLabel(task.startAt)} · en tu Agenda
            </Text>
          </View>
          <Chip label={task.status === "completed" ? "Hecha" : "Pendiente"} tone={task.status === "completed" ? "success" : "neutral"} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[2] },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginRight: -10 },
  label: { fontSize: 14, fontFamily: nativeFont("body", 700) },
  row: { flexDirection: "row", alignItems: "center", gap: spacing[3], padding: 10, borderRadius: 14, borderWidth: 1 },
  title: { fontSize: 14, fontFamily: nativeFont("body", 600) },
  meta: { fontSize: 12, fontFamily: nativeFont("body", 400) },
});
