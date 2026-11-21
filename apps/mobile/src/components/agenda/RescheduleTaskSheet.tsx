import { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { CalendarDays } from "lucide-react-native";
import { buildAgendaTaskStartAt, useRescheduleAgendaTaskMutation } from "@helu/api/hooks";
import {
  BottomSheet,
  Button,
  DatePicker,
  IconTile,
  TimePicker,
  formatClock,
  formatShortDay,
  nativeFont,
  spacing,
  useAppTheme,
  type BottomSheetHandle,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { notify } from "../../lib/notify";

export interface RescheduleTaskSheetProps {
  taskId: string;
  taskTitle: string;
  /** Current start, ISO; prefills the date and time */
  startAt: string;
  onClose: () => void;
}

function splitLocal(iso: string): { dateKey: string; timeKey: string } {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    dateKey: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    timeKey: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** «Reprogramar» a task: new date and time, both required, errors under the field (formularios.md §6). */
export function RescheduleTaskSheet({ taskId, taskTitle, startAt, onClose }: RescheduleTaskSheetProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const sheetRef = useRef<BottomSheetHandle>(null);

  const initial = useMemo(() => splitLocal(startAt), [startAt]);
  const [dateKey, setDateKey] = useState(initial.dateKey);
  const [timeKey, setTimeKey] = useState(initial.timeKey);
  const [submitted, setSubmitted] = useState(false);

  const rescheduleMut = useRescheduleAgendaTaskMutation();
  const dirty = dateKey !== initial.dateKey || timeKey !== initial.timeKey;

  const handleReschedule = () => {
    setSubmitted(true);
    if (!dateKey || !timeKey) return;
    const nextStart = buildAgendaTaskStartAt(dateKey, timeKey);
    rescheduleMut.mutate(
      { id: taskId, schedule: { startAt: nextStart } },
      {
        onSuccess: () => {
          sheetRef.current?.close(() => {
            onClose();
            notify({
              message: "Tarea reprogramada",
              description: `${formatShortDay(dateKey)} · ${formatClock(timeKey)}`,
            });
          });
        },
        onError: () => {
          notify({
            tone: "error",
            message: "No se pudo reprogramar la tarea",
            description: "Revisa tu conexión e intenta de nuevo.",
            action: { label: "Reintentar", onPress: handleReschedule },
          });
        },
      },
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      eyebrow="TAREA"
      title="Reprogramar"
      icon={<IconTile tone="brand" size="lg" round icon={<CalendarDays size={24} strokeWidth={2.4} color={t.brand.text} />} />}
      dirty={dirty}
      onClose={onClose}
    >
      <View style={styles.fields}>
        <Text style={styles.intro}>{taskTitle}</Text>
        <DatePicker
          label="Nueva fecha"
          value={dateKey}
          onChange={setDateKey}
          placeholder="Elige la fecha"
          required
          error={submitted && !dateKey ? "Elige la nueva fecha." : undefined}
        />
        <TimePicker
          label="Nueva hora"
          value={timeKey}
          onChange={setTimeKey}
          placeholder="Elige la hora"
          required
          error={submitted && !timeKey ? "Elige la nueva hora." : undefined}
        />
      </View>

      <View style={styles.actions}>
        <Button
          size="lg"
          fullWidth
          onPress={handleReschedule}
          loading={rescheduleMut.isPending}
          loadingLabel="Guardando…"
          disabled={rescheduleMut.isPending}
        >
          Reprogramar
        </Button>
      </View>
    </BottomSheet>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    fields: { gap: spacing[4] },
    intro: { fontSize: 15, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    actions: { marginTop: spacing[5] },
  });
}
