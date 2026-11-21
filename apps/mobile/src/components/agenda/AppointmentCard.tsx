import { useEffect, useMemo, useRef, useState, useCallback, type ComponentRef } from "react";
import Animated from "react-native-reanimated";
import { useRecentlySaved } from "../../lib/recentlySaved";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { CalendarDays, Check, Clock, MoreVertical, Pencil, Trash2 } from "lucide-react-native";
import type { Appointment } from "@helu/api";
import {
  Chip,
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
import { AgendaRowActionsMenu, measureAgendaRowActionsMenuLeft } from "./AgendaRowActionsMenu";
import { MODALITIES } from "../../constants/appointments";

export interface AppointmentCardProps {
  appointment: Appointment;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AppointmentCard({
  appointment: a,
  onPress,
  onEdit,
  onDelete,
}: AppointmentCardProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const menuTriggerRef = useRef<ComponentRef<typeof View>>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const [menuLeft, setMenuLeft] = useState(0);

  const openMenu = useCallback(() => {
    menuTriggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuTop(y + height + spacing[1]);
      setMenuLeft(measureAgendaRowActionsMenuLeft(x, width));
      setMenuVisible(true);
    });
  }, []);

  const closeMenu = useCallback(() => setMenuVisible(false), []);

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

  return (
    <>
      {/* Mockup «Citas» (helper `apptCard`): cuadro rosa, título y «profesional · especialidad»,
          «⋯» de 44 px y debajo los chips grises de fecha y modalidad, más el estado si ya pasó. */}
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${a.name || a.specialty || "Cita médica"}, ${dateLabel}`}
        style={styles.card}
      >
        <View style={styles.row}>
          <IconTile tone="appointment" icon={<CalendarDays size={19} strokeWidth={2.2} color={t.accent.calFg} />} />
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={2}>{a.name || a.specialty || "Cita médica"}</Text>
            {who ? <Text style={styles.sub} numberOfLines={2}>{who}</Text> : null}
          </View>
          <View ref={menuTriggerRef} collapsable={false}>
            <Pressable
              onPress={openMenu}
              style={styles.menuButton}
              accessibilityRole="button"
              accessibilityLabel="Opciones de la cita"
            >
              <MoreVertical size={18} color={t.text.muted} />
            </Pressable>
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

      <AgendaRowActionsMenu
        visible={menuVisible}
        top={menuTop}
        left={menuLeft}
        onClose={closeMenu}
        actions={[
          { icon: Pencil, label: "Editar", onPress: onEdit },
          { icon: Trash2, label: "Eliminar", onPress: onDelete, destructive: true },
        ]}
      />
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
    menuButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  });
}
