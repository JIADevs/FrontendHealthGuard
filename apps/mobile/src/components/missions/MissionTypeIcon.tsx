import { Activity, CalendarDays, Heart, Pill } from "lucide-react-native";
import type { MissionType } from "@helu/api";

/** Ícono de cada tipo de misión (mockup `TYPES`: cita calendario, medicamento píldora, examen actividad, terapia corazón). */
export function MissionTypeIcon({ type, size = 18, color }: { type: MissionType; size?: number; color: string }) {
  const props = { size, color, strokeWidth: 2.2 };
  switch (type) {
    case "medical_appointment":
      return <CalendarDays {...props} />;
    case "medical_exam":
      return <Activity {...props} />;
    case "medication":
      return <Pill {...props} />;
    case "therapy":
      return <Heart {...props} />;
  }
}
