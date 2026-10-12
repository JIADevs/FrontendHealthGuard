import { useMemo, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CalendarDays, Clock, MapPin, User, MoreVertical, Pencil, Trash2 } from "lucide-react-native";
import type { Appointment } from "@helu/api";
import {
  Card,
  spacing,
  fontSize,
  fontWeight,
  radii,
  colors,
  useAppTheme,
  appointmentStatusLabel,
  formatApptDate,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { AgendaRowActionsMenu, measureAgendaRowActionsMenuLeft } from "./AgendaRowActionsMenu";

const STATUSES = ["PROGRAMADA", "ASISTI", "CANCELADA", "NO_ASISTI"] as const;

export interface AppointmentCardProps {
  appointment: Appointment;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
}

export function AppointmentCard({
  appointment: a,
  onPress,
  onEdit,
  onDelete,
  onStatusChange,
}: AppointmentCardProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const menuTriggerRef = useRef<View>(null);
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

  return (
    <>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Card
          title={a.name || a.specialty || "Cita médica"}
          subtitle={
            <View style={{ gap: spacing[1] }}>
              {a.doctor && (
                <View style={styles.cardMeta}>
                  <User size={12} color={t.text.secondary} />
                  <Text style={styles.cardMetaText}>{a.doctor}</Text>
                </View>
              )}
              {(a.location || a.videoCallLink) && (
                <View style={styles.cardMeta}>
                  <MapPin size={12} color={t.text.secondary} />
                  <Text style={styles.cardMetaText} numberOfLines={1}>
                    {a.modality === "VIRTUAL" ? "Virtual" : a.modality === "DOMICILIARIA" ? "Domiciliaria" : a.location}
                  </Text>
                </View>
              )}
              <View style={styles.cardMeta}>
                <Clock size={12} color={t.text.secondary} />
                <Text style={styles.cardMetaText}>
                  {formatApptDate(a.date)} {a.time?.slice(0, 5)}
                </Text>
              </View>
              {a.specialty && <Text style={styles.cardMetaText}>• {a.specialty}</Text>}
              {a.cost && <Text style={styles.cardMetaText}>💰 ${a.cost}</Text>}
            </View>
          }
          icon={<CalendarDays size={20} color={t.brand.fg} />}
          iconBackground={t.brand.tintMed}
          actions={
            <View ref={menuTriggerRef} collapsable={false}>
              <TouchableOpacity
                onPress={openMenu}
                style={styles.menuButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Opciones de la cita"
              >
                <MoreVertical size={20} color={t.text.muted} />
              </TouchableOpacity>
            </View>
          }
        >
          <View style={styles.statusRow}>
            {STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusPill, a.status === s && styles.statusPillActive]}
                onPress={() => onStatusChange(s)}
              >
                <Text style={[styles.statusPillText, a.status === s && styles.statusPillTextActive]}>
                  {appointmentStatusLabel(s)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </TouchableOpacity>

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
    cardMeta: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
    cardMetaText: { fontSize: fontSize.sm, color: t.text.secondary },
    menuButton: { padding: spacing[1] },
    statusRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[1], marginTop: spacing[1] },
    statusPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radii.full,
      backgroundColor: t.border.light,
      borderWidth: 1,
      borderColor: t.border.medium,
    },
    statusPillActive: { backgroundColor: t.brand.fg, borderColor: t.brand.fg },
    statusPillText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: t.text.secondary },
    statusPillTextActive: { color: colors.white },
  });
}
