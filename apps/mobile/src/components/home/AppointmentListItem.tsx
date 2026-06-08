import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  Calendar,
  MapPin,
  Stethoscope,
  FlaskConical,
} from "lucide-react-native";
import {
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  splitDate,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { Appointment } from "@helu/api";

// ─── Status config ───────────────────────────────────────────────────────────

type StatusConfig = { label: string; bg: string; fg: string };

function getStatusConfig(
  type: string,
  status: string,
  t: ThemeContextValue,
): StatusConfig {
  if (type === "EXAM") {
    return { label: "Prep. previa", bg: t.brand.tint, fg: t.brand.fg };
  }
  switch (status) {
    case "PENDIENTE":
    case "PENDING":
      return { label: "Pendiente", bg: t.status.warningBg, fg: t.status.warningFg };
    case "PROGRAMADA":
      return { label: "Programada", bg: t.status.infoBg, fg: t.status.infoFg };
    case "ASISTI":
    case "COMPLETED":
      return { label: "Asistí", bg: t.status.successBg, fg: t.status.successFg };
    case "CANCELADA":
    case "CANCELLED":
      return { label: "Cancelada", bg: t.status.errorBg, fg: t.status.errorFg };
    case "NO_ASISTI":
      return { label: "No asistí", bg: t.surface.bgCard, fg: t.text.secondary };
    case "RESCHEDULED":
      return { label: "Reprogramada", bg: t.brand.tint, fg: t.brand.fg };
    default:
      return { label: status, bg: t.surface.bgCard, fg: t.text.secondary };
  }
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface AppointmentListItemProps {
  appointment: Appointment;
  onPress: () => void;
  isLast?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AppointmentListItem({ appointment, onPress, isLast }: AppointmentListItemProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const isExam = appointment.type === "EXAM";
  const ApptIcon = isExam ? FlaskConical : Stethoscope;
  const iconBg = isExam ? t.brand.tint : t.accent.calBg;
  const iconFg = isExam ? t.brand.fg : t.accent.calFg;
  const statusCfg = getStatusConfig(appointment.type, appointment.status, t);

  return (
    <TouchableOpacity
      style={[styles.item, !isLast && styles.itemBorder]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <ApptIcon size={18} color={iconFg} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: t.text.primary }]}>
          {appointment.specialty}
        </Text>
        <Text style={[styles.subtitle, { color: t.text.secondary }]}>
          {appointment.doctor}
        </Text>
        <View style={styles.metaRow}>
          <Calendar size={11} color={t.text.muted} />
          <Text style={[styles.metaText, { color: t.text.muted }]}>
            {splitDate(appointment.date).day} {splitDate(appointment.date).month} · {appointment.time.slice(0, 5)}
          </Text>
          {appointment.location ? (
            <>
              <MapPin size={11} color={t.text.muted} />
              <Text style={[styles.metaText, { color: t.text.muted }]} numberOfLines={1}>
                {appointment.location}
              </Text>
            </>
          ) : null}
        </View>
      </View>
      <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
        <Text style={[styles.badgeText, { color: statusCfg.fg }]}>
          {statusCfg.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[1],
    },
    itemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: t.border.light,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
    },
    info: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.bold,
    },
    subtitle: {
      fontSize: fontSize.sm,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
      marginTop: 2,
    },
    metaText: {
      fontSize: fontSize.xs,
    },
    badge: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderRadius: radii.sm,
      alignSelf: "flex-start",
      marginTop: spacing[1],
    },
    badgeText: {
      fontSize: 10,
      fontWeight: fontWeight.bold,
    },
  });
}
