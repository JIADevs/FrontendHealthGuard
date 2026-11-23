import { useRecordIntakeMutation } from "@helu/api/hooks";
import { isApiError } from "@helu/api";
import { formatClock } from "@helu/ui";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";

/**
 * «Tomar» en un toque (movimiento-interacciones.md §6 «Toma registrada» y §8, v2.14):
 * todo responde al tocar — la fila (mutación optimista de `@helu/api`), la háptica de éxito y el toast.
 * Si el servidor falla, la fila vuelve atrás, vibra el error y el toast cambia a «Reintentar».
 *
 * `scheduledTime` es la hora de la toma que se marca (la de la fila). Sin ella el servidor guardaba la
 * toma a la hora del toque, la fila de las 7:00 no la encontraba y volvía a ofrecer «Tomar».
 */
export function useTakeDose() {
  const mutation = useRecordIntakeMutation();

  const take = (cycleId: string, scheduledTime?: string | null) => {
    haptics.success();
    const takenAt = new Date().toISOString();
    // Low risk and reversible: confirm on tap, like the row and Helu; the error toast replaces it if it fails.
    notify({ message: `Toma registrada a las ${formatClock(new Date(takenAt))}` });
    mutation.mutate(
      { cycleId, payload: { status: "TAKEN", scheduledTime: scheduledTime ?? takenAt, takenAt } },
      {
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
