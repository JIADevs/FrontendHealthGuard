import { useConfirmIntakeMutation } from "@helu/api/hooks";
import { isApiError } from "@helu/api";
import { formatClock } from "@helu/ui";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";

/**
 * «Tomar» en un toque (movimiento-interacciones.md §6 «Toma registrada» y §8):
 * la fila cambia al tocar (mutación optimista de `@helu/api`) y la háptica de éxito acompaña ese
 * cambio; si el servidor falla, la fila vuelve atrás, vibra el error y el toast ofrece «Reintentar».
 */
export function useTakeDose() {
  const mutation = useConfirmIntakeMutation();

  const take = (cycleId: string) => {
    haptics.success();
    mutation.mutate(cycleId, {
      onSuccess: () => notify({ message: `Toma registrada a las ${formatClock(new Date())}` }),
      onError: (err) => {
        haptics.error();
        notify({
          tone: "error",
          message: "No pudimos registrar la toma",
          description: isApiError(err) && err.status && err.status < 500 ? err.message : "Revisa tu conexión.",
          action: { label: "Reintentar", onPress: () => take(cycleId) },
        });
      },
    });
  };

  return {
    take,
    takingCycleId: mutation.isPending ? (mutation.variables as string | undefined) : undefined,
  };
}
