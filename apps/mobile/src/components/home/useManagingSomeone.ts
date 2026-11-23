import { useAuthStore } from "@helu/stores";

/**
 * True while you manage someone else's account. Inicio then talks about them («No tiene citas
 * próximas», «su check-in») instead of you, the same way the greeting says «Agenda de Juan».
 */
export function useManagingSomeone(): boolean {
  return useAuthStore((s) => s.isManaging && !!s.activePatientId);
}
