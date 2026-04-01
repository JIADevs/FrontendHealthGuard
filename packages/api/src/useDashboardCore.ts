/**
 * useDashboardCore — datos del dashboard, agnósticos de plataforma.
 *
 * Centraliza las 4 queries (perfil, documentos, citas, medicamentos),
 * sincroniza el usuario al auth store, y expone los valores derivados
 * que necesitan web y mobile.
 */

import { useEffect } from "react";
import {
  useProfileQuery,
  useDocumentsQuery,
  useAppointmentsQuery,
  useMedicationsQuery,
} from "./hooks";
import { useAuthStore } from "@healthguard/stores";
import { todayISODate } from "@healthguard/ui";
import type { Appointment, Medication } from "./schemas";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DashboardData {
  /** Nombre o email del usuario autenticado. */
  userName: string | null;
  isProfileLoading: boolean;

  /** "Tienes N citas pendientes hoy." o "No tienes citas pendientes hoy." */
  apptSubtitle: string;

  /** Totales para las métricas. "—" mientras cargan. */
  docTotal: number | string;
  apptTotal: number | string;
  medTotal: number | string;

  /** Listas para las secciones de detalle (máx. 3 ítems). */
  upcomingAppts: Appointment[];
  activeMeds: Medication[];

  isApptsLoading: boolean;
  isMedsLoading: boolean;
  isDocsLoading: boolean;
}

// ─── Core hook ───────────────────────────────────────────────────────────────

export function useDashboardCore(): DashboardData {
  const setUser = useAuthStore((s) => s.setUser);

  const profile = useProfileQuery();
  const docs    = useDocumentsQuery("", 1, 1);
  const appts   = useAppointmentsQuery("", 1, 3, todayISODate());
  const meds    = useMedicationsQuery(1, 3);

  // Mantiene el objeto de usuario del store sincronizado con el perfil real.
  useEffect(() => {
    if (profile.data) {
      setUser({
        id: profile.data.id,
        name: profile.data.name,
        email: profile.data.email,
      });
    }
  }, [profile.data, setUser]);

  const todayApptCount =
    appts.data?.items.filter((a) => a.status === "PENDING").length ?? 0;

  const apptSubtitle =
    todayApptCount > 0
      ? `Tienes ${todayApptCount} cita${todayApptCount > 1 ? "s" : ""} pendiente${todayApptCount > 1 ? "s" : ""} hoy.`
      : "No tienes citas pendientes hoy.";

  return {
    userName: profile.data?.name ?? profile.data?.email ?? null,
    isProfileLoading: profile.isLoading,

    apptSubtitle,

    docTotal:  docs.isLoading  ? "—" : (docs.data?.total  ?? "—"),
    apptTotal: appts.isLoading ? "—" : (appts.data?.total ?? "—"),
    medTotal:  meds.isLoading  ? "—" : (meds.data?.total  ?? "—"),

    upcomingAppts: appts.data?.items ?? [],
    activeMeds:    meds.data?.items  ?? [],

    isApptsLoading: appts.isLoading,
    isMedsLoading:  meds.isLoading,
    isDocsLoading:  docs.isLoading,
  };
}
