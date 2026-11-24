import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarDays, Check, ChevronRight, X } from "lucide-react-native";
import type { MissionSessions } from "@helu/api";
import { IconTile, nativeFont, spacing, useAppTheme } from "@helu/ui";
import { capitalize, relativeDay, shortDate } from "./missionCopy";

const RECENT = 3;

type Item = MissionSessions["items"][number];

/**
 * «Tus sesiones» (mockup v2.29 · A): las más recientes primero, dentro de la hoja del paso. Muestra 3 y
 * «Ver todas» despliega el resto. Las canceladas o no asistidas van en gris con «no cuenta» (RF-39).
 * Tocar una sesión abre su cita.
 */
export function SessionsList({
  items,
  nextId,
  onOpen,
}: {
  items: Item[];
  /** The upcoming session already shown above the list: skip it here. */
  nextId?: string | null;
  onOpen: (appointmentId: string) => void;
}) {
  const t = useAppTheme();
  const [all, setAll] = useState(false);
  const rows = items.filter((i) => i.appointmentId !== nextId);
  if (rows.length === 0) return null;
  const shown = all ? rows : rows.slice(0, RECENT);

  const detail = (i: Item) => {
    const day = shortDate(`${i.date}T00:00`);
    if (i.status === "ASISTI") return `${capitalize(dayName(i.date))} ${day} · asististe`;
    if (i.status === "PROGRAMADA") return `${capitalize(relativeDay(`${i.date}T${(i.time ?? "00:00").slice(0, 5)}`))}`;
    return `${capitalize(dayName(i.date))} ${day} · no cuenta`;
  };

  return (
    <View style={[styles.card, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}>
      <Text style={[styles.title, { color: t.text.primary }]}>Tus sesiones</Text>
      {shown.map((i) => {
        const counts = i.counts || i.status === "PROGRAMADA";
        return (
          <Pressable
            key={i.appointmentId}
            onPress={() => onOpen(i.appointmentId)}
            accessibilityRole="button"
            accessibilityLabel={`${i.label}, ${detail(i)}. Abrir la cita`}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
          >
            <IconTile
              tone={i.counts ? "success" : i.status === "PROGRAMADA" ? "treatment" : "neutral"}
              icon={
                i.counts ? (
                  <Check size={17} strokeWidth={2.6} color={t.status.successFg} />
                ) : i.status === "PROGRAMADA" ? (
                  <CalendarDays size={17} strokeWidth={2.2} color={t.text.secondary} />
                ) : (
                  <X size={17} strokeWidth={2.4} color={t.text.muted} />
                )
              }
            />
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={[styles.label, { color: counts ? t.text.primary : t.text.secondary }]}>{i.label}</Text>
              <Text style={[styles.meta, { color: t.text.secondary }]}>{detail(i)}</Text>
            </View>
            <ChevronRight size={16} strokeWidth={2.4} color={t.text.muted} />
          </Pressable>
        );
      })}
      {rows.length > RECENT ? (
        <Pressable onPress={() => setAll((v) => !v)} accessibilityRole="button" style={styles.more}>
          <Text style={[styles.moreText, { color: t.brand.text }]}>
            {all ? "Ver menos" : `Ver todas tus sesiones (${rows.length})`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function dayName(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return DAYS[new Date(y, m - 1, d).getDay()];
}

const styles = StyleSheet.create({
  card: { gap: spacing[2], padding: 14, borderRadius: 16, borderWidth: 1 },
  title: { fontSize: 15, fontFamily: nativeFont("heading", 800) },
  row: { flexDirection: "row", alignItems: "center", gap: spacing[3], paddingVertical: 6 },
  label: { fontSize: 15, fontFamily: nativeFont("body", 600) },
  meta: { fontSize: 13, fontFamily: nativeFont("body", 400) },
  more: { alignItems: "center", paddingTop: spacing[1] },
  moreText: { fontSize: 14, fontFamily: nativeFont("body", 700) },
});
