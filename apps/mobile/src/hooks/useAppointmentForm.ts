import { useAppointmentFormCore, useProfileQuery } from "@helu/api/hooks";
import { notify } from "../lib/notify";
import { haptics } from "../lib/haptics";
import { useRecentlySaved } from "../lib/recentlySaved";
import { navigateTo } from "../navigation/navigationRef";
import { useManagingSomeone } from "../components/home/useManagingSomeone";
import type { Appointment } from "@helu/api";
import type { AppointmentMissionLink } from "@helu/api/hooks";

function firstWord(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] || null;
}

/** «Cita guardada · Creamos tu misión para acompañarte» or, for a past one, «¿Pudiste asistir?» (RF-28). */
function missionCreatedToast(saved: Appointment, managedName: string | null) {
  const missionId = saved.missionId!;
  const start = saved.date ? new Date(`${saved.date.slice(0, 10)}T${(saved.time ?? "00:00").slice(0, 5)}`).getTime() : NaN;
  if (Number.isFinite(start) && start < Date.now()) {
    const openStep = saved.type === "EXAM" ? "perform" : "attend";
    return {
      message: "Cita guardada",
      description: managedName ? `¿Pudo asistir? Cuéntanos en la misión de ${managedName}` : "¿Pudiste asistir? Cuéntanos en su misión",
      action: { label: "Responder", onPress: () => navigateTo("MissionDetail", { id: missionId, openStep }) },
    };
  }
  return {
    message: managedName ? `Creamos la misión de ${managedName} para esta cita` : "Cita guardada",
    description: managedName ? undefined : "Creamos tu misión para acompañarte",
    action: { label: "Ver misión", onPress: () => navigateTo("MissionDetail", { id: missionId }) },
  };
}

export function useAppointmentForm({
  initial,
  onClose,
  mission,
}: {
  initial?: Appointment | null;
  onClose: () => void;
  /** New appointment for a mission step («Programar la cita / el examen»). */
  mission?: AppointmentMissionLink;
}) {
  const managing = useManagingSomeone();
  // In management mode the profile is the dependent's (X-Patient-Context): «Creamos la misión de Juan».
  const profileName = firstWord(useProfileQuery().data?.name);
  const managedName = managing ? profileName ?? "tu familiar" : null;
  return useAppointmentFormCore({
    initial,
    mission,
    adapters: {
      onSaveSuccess: (savedId, saved) => {
        // §6 «Acción guardada»: resaltado en la lista + toast + háptica ligera.
        useRecentlySaved.getState().markAppointment(savedId);
        haptics.light();
        // A new appointment comes with its mission (RF-23, DU-50): say so, never ask (mockups 4c «C1», «C3», «C6»).
        if (!initial && !mission && saved?.missionId) {
          notify(missionCreatedToast(saved, managedName));
          return;
        }
        notify({ message: initial ? "Cita actualizada" : "Cita guardada" });
      },
      afterSave: onClose,
    },
  });
}
