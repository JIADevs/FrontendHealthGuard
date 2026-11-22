import { useRecordIntakeMutation } from "@helu/api/hooks";
import { isApiError } from "@helu/api";
import { formatClock } from "@helu/ui";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";

/**
 * «Tomar» en un toque (movimiento-interacciones.md §6 «Toma registrada» y §8):
 * la fila cambia al tocar (mutación optimista de `@helu/api`) y la háptica de éxito acompaña ese
 * cambio; si el servidor falla, la fila vuelve atrás, vibra el error y el toast ofrece «Reintentar».
 *
 * `scheduledTime` es la hora de la toma que se marca (la de la fila). Sin ella el servidor guardaba la
 * toma a la hora del toque, la fila de las 7:00 no la encontraba y volvía a ofrecer «Tomar».
 */
export function useTakeDose() {
  const mutation = useRecordIntakeMutation();

  const take = (cycleId: string, scheduledTime?: string | null) => {
    haptics.success();
    const takenAt = new Date().toISOString();
    mutation.mutate(
      { cycleId, payload: { status: "TAKEN", scheduledTime: scheduledTime ?? takenAt, takenAt } },
      {
        onSuccess: () => notify({ message: `Toma registrada a las ${formatClock(new Date(takenAt))}` }),
        onError: (err) => {
          haptics.error();
          notify({
            tone: "error",
            message: "No pudimos registrar la toma",
            description: isApiError(err) && err.status && err.status < 500 ? err.message : "Revisa tu conexión.",
            action: { label: "Reintentar", onPress: () => take(cycleId, scheduledTime) },
          });
        },
      },
    );
  };

  return {
    take,
    takingCycleId: mutation.isPending ? mutation.variables?.cycleId : undefined,
    /** The dose being saved, to show «Guardando…» only on that row when a cycle has several a day. */
    takingScheduledTime: mutation.isPending ? mutation.variables?.payload.scheduledTime : undefined,
  };
}
