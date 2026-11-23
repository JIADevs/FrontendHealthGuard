import { Text } from "react-native";
import { CalendarDays, Video } from "lucide-react-native";
import type { Appointment } from "@helu/api";
import { formatClock, formatShortDay, nativeFont, useAppTheme } from "@helu/ui";
import { HomeCard } from "./HomeCard";
import { HomeRow } from "./HomeRow";
import { SeeAllLink } from "./SeeAllLink";
import { useManagingSomeone } from "./useManagingSomeone";

function appointmentMeta(a: Appointment): string {
  const time = a.time ? formatClock(a.time.slice(0, 5)) : "";
  const when = [formatShortDay(a.date), time].filter(Boolean).join(" · ");
  const who = a.modality === "VIRTUAL" ? "Virtual" : a.doctor ?? a.clinic ?? "";
  return [when, who].filter(Boolean).join(" · ");
}

/** «Próximas citas» (bloque 6). */
export function UpcomingAppointmentsCard({
  appointments,
  onOpen,
  onSeeAll,
}: {
  appointments: Appointment[];
  onOpen: (id: string) => void;
  onSeeAll: () => void;
}) {
  const other = useManagingSomeone();
  const t = useAppTheme();
  return (
    <HomeCard title="Próximas citas" right={<SeeAllLink label="Ver todas" onPress={onSeeAll} />}>
      {appointments.length === 0 ? (
        <Text style={{ fontSize: 14, lineHeight: 20, fontFamily: nativeFont("body", 400), color: t.text.secondary }}>
          {other ? "No tiene citas próximas." : "No tienes citas próximas."}
        </Text>
      ) : (
        appointments.map((a) => (
          <HomeRow
            key={a.id}
            tone="appointment"
            icon={
              a.modality === "VIRTUAL" ? (
                <Video size={19} strokeWidth={2.2} color={t.accent.calFg} />
              ) : (
                <CalendarDays size={19} strokeWidth={2.2} color={t.accent.calFg} />
              )
            }
            title={a.name || a.specialty || "Cita médica"}
            meta={appointmentMeta(a)}
            onPress={() => onOpen(a.id)}
          />
        ))
      )}
    </HomeCard>
  );
}
