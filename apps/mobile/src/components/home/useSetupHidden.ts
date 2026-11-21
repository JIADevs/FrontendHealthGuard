import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPreference, isApiError, setPreference } from "@helu/api";
import { notify } from "../../lib/notify";

const KEY = "home_setup_checklist_hidden";
const queryKey = ["preference", KEY] as const;

/**
 * «Ocultar esta lista» del primer uso (tarea 6.2). Se guarda en las preferencias del usuario,
 * así no vuelve a aparecer en otro teléfono. Si la preferencia no existe todavía, está visible.
 */
export function useSetupHidden() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const { value } = await getPreference(KEY);
        return (value as { hidden?: unknown } | null)?.hidden === true;
      } catch (err) {
        if (isApiError(err) && err.isNotFound) return false;
        throw err;
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  // Bajo riesgo y reversible: se oculta al tocar y se guarda en segundo plano (§8).
  const mutation = useMutation({
    // El backend solo guarda objetos (`PreferenceUpdate.value: dict`).
    mutationFn: () => setPreference(KEY, { hidden: true }),
    onMutate: () => {
      const previous = qc.getQueryData<boolean>(queryKey);
      qc.setQueryData(queryKey, true);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(queryKey, ctx?.previous ?? false);
      notify({ tone: "error", message: "No pudimos ocultar la lista", description: "Revisa tu conexión e intenta de nuevo." });
    },
  });

  return {
    hidden: query.data ?? false,
    isLoading: query.isLoading,
    hide: () => mutation.mutate(),
  };
}
