import { useEffect, useMemo, useState } from "react";
import Animated from "react-native-reanimated";
import { useRecentlySaved } from "../../lib/recentlySaved";
import { View, Text, StyleSheet } from "react-native";
import { CalendarDays, Check, CircleX, Clock, Ellipsis, Eye, Pencil, Trash2 } from "lucide-react-native";
import type { Appointment } from "@helu/api";
import {
  ActionSheet,
  Chip,
  SwipeRow,
  IconTile,
  PressableScale,
  useHighlight,
  spacing,
  fontSize,
  nativeFont,
  useAppTheme,
  formatClock,
  formatShortDay,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { MODALITIES } from "../../constants/appointments";
import { swipeHaptic } from "../../lib/haptics";

export interface AppointmentCardProps {
  appointment: Appointment;
  onPress: () => void;
  onEdit: () => void;
  /** «Asistí»: only offered once the appointment started and is still unanswered */
  onAttended: () => void;
  onCancel: () => void;
  onDelete: () => void;
  /** First-time discovery of the swipe (§4b «Descubrir») */
  peek?: boolean;
}

export function AppointmentCard({
  appointment: a,
  onPress,
  onEdit,
  onAttended,
  onCancel,
  onDelete,
  peek,
}: AppointmentCardProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [sheet, setSheet] = useState(false);
  const WHITE = { size: 22, strokeWidth: 2.2, color: t.text.onSolid };

  // Recién guardada: borde azul que se desvanece en 1,2 s (movimiento-interacciones.md §6).
  const justSaved = useRecentlySaved((state) => state.appointmentId === a.id);
  const highlight = useHighlight(justSaved);
  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => useRecentlySaved.getState().clearAppointment(), 1300);
    return () => clearTimeout(timer);
  }, [justSaved]);

  const time = a.time ? formatClock(a.time.slice(0, 5)) : "";
  const dateLabel = [formatShortDay(a.date), time].filter(Boolean).join(" · ");
  const who = [a.doctor, a.specialty].filter(Boolean).join(" · ");
  const title = a.name || a.specialty || "Cita médica";

  // Same rules as the detail: «Asistí» from the appointment's time on, «Reprogramar» before it.
  const startMs = new Date(`${a.date?.slice(0, 10)}T${a.time?.slice(0, 5) || "00:00"}`).getTime();
  const hasStarted = Number.isFinite(startMs) && startMs <= Date.now();
  const cancelled = a.status === "CANCELADA";
  const answered = a.status === "ASISTI" || a.status === "NO_ASISTI";
  const canReschedule = !hasStarted && !cancelled;
  const canAttend = hasStarted && !cancelled && !answered;

  return (
    <>
      {/* Mockup «Citas» (helper `apptCard`): cuadro rosa, título y «profesional · especialidad» y
          debajo los chips grises de fecha y modalidad, más el estado si ya pasó. Sus acciones van al
          deslizar (MASTER §7, #127): «Más» + «Reprogramar» a la izquierda, «Asistí» a la derecha. */}
      <SwipeRow
        id={a.id}
        accessibilityLabel={`${title}, ${dateLabel}`}
        onPress={onPress}
        endActions={[
          { key: "more", tone: "more", label: "Más", icon: <Ellipsis {...WHITE} />, onPress: () => setSheet(true) },
          canReschedule
            ? { key: "reschedule", tone: "primary", label: "Reprogramar", icon: <CalendarDays {...WHITE} />, onPress: onEdit }
            : { key: "edit", tone: "primary", label: "Editar", icon: <Pencil {...WHITE} />, onPress: onEdit },
        ]}
        startAction={canAttend ? { key: "attended", tone: "positive", label: "Asistí", icon: <Check {...WHITE} strokeWidth={3} />, onPress: onAttended } : undefined}
        onLongPress={() => setSheet(true)}
        onHaptic={swipeHaptic}
        peek={peek}
      >
        <PressableScale
          onPress={onPress}
          accessible={false}
          style={styles.card}
        >
          <View style={styles.row}>
            <IconTile tone="appointment" icon={<CalendarDays size={19} strokeWidth={2.2} color={t.accent.calFg} />} />
            <View style={styles.copy}>
              <Text style={styles.title} numberOfLines={2}>{title}</Text>
              {who ? <Text style={styles.sub} numberOfLines={2}>{who}</Text> : null}
            </View>
          </View>
          <View style={styles.chips}>
            <Chip label={dateLabel} tone="neutral" icon={<Clock size={12} color={t.text.onMuted} />} />
            <Chip label={MODALITIES.find((mod) => mod.value === a.modality)?.label ?? "Presencial"} tone="neutral" />
            {a.status === "ASISTI" ? (
              <Chip label="Completada" tone="success" icon={<Check size={12} strokeWidth={3} color={t.status.successFg} />} />
            ) : a.status === "NO_ASISTI" ? (
              <Chip label="No asistí" tone="neutral" />
            ) : a.status === "CANCELADA" ? (
              <Chip label="Cancelada" tone="neutral" />
            ) : null}
          </View>
          <Animated.View pointerEvents="none" style={highlight} />
        </PressableScale>
      </SwipeRow>

      {sheet ? (
        <ActionSheet
          title={title}
          eyebrow={`Cita · ${dateLabel}`.toUpperCase()}
          tone="appointment"
          icon={<CalendarDays />}
          onClose={() => setSheet(false)}
          actions={[
            { key: "open", label: "Ver detalle", icon: <Eye />, onPress: onPress },
            ...(canReschedule ? [{ key: "reschedule", label: "Reprogramar", icon: <CalendarDays />, onPress: onEdit }] : []),
            ...(canAttend ? [{ key: "attended", label: "Asistí", meta: "Marca la cita como completada", icon: <Check />, onPress: onAttended }] : []),
            { key: "edit", label: "Editar", icon: <Pencil />, onPress: onEdit },
          ]}
          destructive={[
            // A cancelled or answered appointment stays in the history: only deleting is left.
            ...(!cancelled && !answered
              ? [{ key: "cancel", label: "Cancelar cita", meta: "Queda en tu historial como cancelada", icon: <CircleX />, onPress: onCancel }]
              : []),
            { key: "delete", label: "Eliminar cita", meta: "Se borra de tu agenda", icon: <Trash2 />, onPress: onDelete },
          ]}
        />
      ) : null}
    </>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    // Kit `.card.tight`
    card: {
      gap: 10,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    row: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
    sub: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  });
}
