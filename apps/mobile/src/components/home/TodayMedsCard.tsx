import { View, Text } from "react-native";
import { Chip, nativeFont, useAppTheme, resolveCycleForDay } from "@helu/ui";
import type { AgendaEvent } from "@helu/ui";
import { HomeCard } from "./HomeCard";
import { MedicationDoseListItem } from "./MedicationDoseListItem";
import { eventSlotIso } from "../agenda/doseRowState";

type MedicationEvent = Extract<AgendaEvent, { type: "medication" }>;

interface TodayMedsCardProps {
  events: MedicationEvent[];
  takenCount: number;
  takingCycleId: string | null;
  /** The dose being saved; with two doses a day only that row shows «Guardando…». */
  takingScheduledTime?: string | null;
  onOpenDose: (event: MedicationEvent) => void;
  onTake: (event: MedicationEvent) => void;
}

/**
 * «Medicamentos de hoy» (bloque 2): una tarjeta con «X de N» y las filas de toma. «Tomar» es la
 * única acción primaria de Inicio (botón de 48 px, éxito sólido).
 */
export function TodayMedsCard({ events, takenCount, takingCycleId, takingScheduledTime, onOpenDose, onTake }: TodayMedsCardProps) {
  const t = useAppTheme();
  return (
    <HomeCard
      title="Medicamentos de hoy"
      right={events.length > 0 ? <Chip label={`${takenCount} de ${events.length}`} tone="neutral" /> : null}
    >
      {events.length === 0 ? (
        <Text style={{ fontSize: 14, lineHeight: 20, fontFamily: nativeFont("body", 400), color: t.text.secondary }}>
          No tienes tomas programadas para hoy.
        </Text>
      ) : (
        <View>
          {events.map((event, i) => (
            <MedicationDoseListItem
              key={`${event.data.id}-${event.intakeTime}`}
              event={event}
              isLast={i === events.length - 1}
              onPress={() => onOpenDose(event)}
              onTake={() => onTake(event)}
              taking={
                takingCycleId != null &&
                takingCycleId === resolveCycleForDay(event.data, event.dayKey)?.id &&
                (takingScheduledTime == null || takingScheduledTime === eventSlotIso(event))
              }
            />
          ))}
        </View>
      )}
    </HomeCard>
  );
}
