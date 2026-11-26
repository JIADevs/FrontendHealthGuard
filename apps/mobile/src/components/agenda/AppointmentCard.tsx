import { useEffect, useMemo, useState } from "react";
import Animated from "react-native-reanimated";
import { useRecentlySaved } from "../../lib/recentlySaved";
import { View, Text, StyleSheet } from "react-native";
import { CalendarDays, Check, Clock } from "lucide-react-native";
import type { Appointment } from "@helu/api";
import {
  Chip,
  SwipeRow,
  IconTile,
  PressableScale,
  useHighlight,
  spacing,
  fontSize,
  nativeFont,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { MODALITIES } from "../../constants/appointments";
import { swipeHaptic } from "../../lib/haptics";
import { AppointmentActionSheet, appointmentDateLabel, appointmentTitle, useAppointmentSwipe } from "./appointmentSwipe";

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
  const swipe = useAppointmentSwipe(a, { onEdit, onAttended }, () => setSheet(true));

  // Recién guardada: borde azul que se desvanece en 1,2 s (movimiento-interacciones.md §6).
  const justSaved = useRecentlySaved((state) => state.appointmentId === a.id);
  const highlight = useHighlight(justSaved);
  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => useRecentlySaved.getState().clearAppointment(), 1300);
    return () => clearTimeout(timer);
  }, [justSaved]);

  const dateLabel = appointmentDateLabel(a);
  const who = [a.doctor, a.specialty].filter(Boolean).join(" · ");
  const title = appointmentTitle(a);

  return (
    <>
      {/* Mockup «Citas» (helper `apptCard`): cuadro rosa, título y «profesional · especialidad» y
          debajo los chips grises de fecha y modalidad, más el estado si ya pasó. Sus acciones van al
          deslizar (MASTER §7, #127): «Más» + «Reprogramar» a la izquierda, «Asistí» a la derecha. */}
      <SwipeRow
        id={a.id}
        accessibilityLabel={`${title}, ${dateLabel}`}
        onPress={onPress}
        endActions={swipe.endActions}
        startAction={swipe.startAction}
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
        <AppointmentActionSheet
          appointment={a}
          onClose={() => setSheet(false)}
          onOpen={onPress}
          onEdit={onEdit}
          onAttended={onAttended}
          onCancel={onCancel}
          onDelete={onDelete}
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
