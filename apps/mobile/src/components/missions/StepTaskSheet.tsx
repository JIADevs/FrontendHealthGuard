import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AlarmClock } from "lucide-react-native";
import {
  BottomSheet,
  Button,
  ChoiceChips,
  DatePicker,
  IconTile,
  TextField,
  TimePicker,
  nativeFont,
  spacing,
  useAppTheme,
  type BottomSheetHandle,
} from "@helu/ui";
import { useCreateStepTaskMutation, type Mission, type MissionStep } from "@helu/api";
import { buildAgendaTaskStartAt } from "@helu/api/hooks";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";
import { useIsOnline } from "../states/OfflineBanner";
import { stepTitle } from "./missionCopy";

/** Same options as «Nueva tarea» (Agenda): at least one reminder, minutes before (no «a la hora»). */
const REMINDERS = [
  { value: "15", label: "15 min antes" },
  { value: "60", label: "1 hora antes" },
  { value: "1440", label: "1 día antes" },
];

/**
 * «Nuevo recordatorio del paso» (RF-27, DA-10): the «Nueva tarea» fields with the mission and the step
 * already set. The task shows in Agenda and in the step; it never completes the step.
 */
export function StepTaskSheet({
  mission,
  step,
  onClose,
}: {
  mission: Mission;
  step: MissionStep;
  onClose: () => void;
}) {
  const t = useAppTheme();
  const online = useIsOnline();
  const ref = useRef<BottomSheetHandle>(null);
  const create = useCreateStepTaskMutation();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reminder, setReminder] = useState("15");
  const [touched, setTouched] = useState(false);

  const errors = touched
    ? {
        title: title.trim() ? undefined : "Escribe qué te recordamos.",
        date: date ? undefined : "Elige la fecha.",
        time: time ? undefined : "Elige la hora.",
      }
    : {};

  const submit = () => {
    setTouched(true);
    if (!title.trim() || !date || !time) return;
    if (!online) return notify({ tone: "warning", message: "Sin conexión", description: "Revisa tu conexión y vuelve a intentarlo." });
    create.mutate(
      {
        missionId: mission.id,
        stepKey: step.key,
        payload: { title: title.trim(), startAt: buildAgendaTaskStartAt(date, time), reminderOffsets: [Number(reminder)] },
      },
      {
        onSuccess: () => {
          haptics.success();
          ref.current?.close(() => notify({ message: "Recordatorio creado", description: "Lo verás en tu Agenda y en este paso." }));
        },
        onError: () => notify({ tone: "error", message: "No se pudo guardar", action: { label: "Reintentar", onPress: submit } }),
      },
    );
  };

  return (
    <BottomSheet
      ref={ref}
      eyebrow={`RECORDATORIO · ${stepTitle(mission, step.key).toUpperCase()}`}
      title="Nuevo recordatorio"
      icon={<IconTile round size="lg" tone="brand" icon={<AlarmClock size={22} strokeWidth={2.2} color={t.brand.solid} />} />}
      onClose={onClose}
    >
      <View style={styles.body}>
        <TextField
          label="¿Qué te recordamos?"
          value={title}
          onChange={setTitle}
          placeholder="Ej: Ayuno de 8 horas"
          error={errors.title}
          autoCapitalize="sentences"
          returnKeyType="done"
        />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <DatePicker label="Fecha" value={date} onChange={setDate} placeholder="Elige la fecha" error={errors.date} />
          </View>
          <View style={{ flex: 1 }}>
            <TimePicker label="Hora" value={time} onChange={setTime} placeholder="Elige la hora" error={errors.time} />
          </View>
        </View>
        <View style={{ gap: spacing[2] }}>
          <Text style={[styles.label, { color: t.text.primary }]}>Avisarme</Text>
          <ChoiceChips options={REMINDERS} value={reminder} onChange={setReminder} />
        </View>
        <Button variant="primary" fullWidth onPress={submit} loading={create.isPending} loadingLabel="Guardando…">
          Guardar recordatorio
        </Button>
        <Text style={[styles.note, { color: t.text.secondary }]}>Lo verás en tu Agenda y en este paso.</Text>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[3] },
  row: { flexDirection: "row", gap: spacing[3] },
  label: { fontSize: 14, fontFamily: nativeFont("body", 700) },
  note: { fontSize: 12, lineHeight: 17, textAlign: "center", fontFamily: nativeFont("body", 400) },
});
