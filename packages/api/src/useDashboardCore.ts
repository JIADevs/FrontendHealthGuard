/**
 * useDashboardCore — datos del dashboard, agnósticos de plataforma.
 *
 * Centraliza las 4 queries (perfil, documentos, citas, medicamentos),
 * sincroniza el usuario al auth store, y expone los valores derivados
 * que necesitan web y mobile.
 */

import { useEffect, useMemo } from "react";
import {
  useProfileQuery,
  useDocumentsQuery,
  useAppointmentsQuery,
  useMedicationsQuery,
} from "./hooks";
import { useAuthStore } from "@helu/stores";
import { todayISODate } from "@helu/ui";
import type { Appointment, Medication, Document } from "./schemas";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DashboardData {
  /** Nombre o email del usuario autenticado. */
  userName: string | null;
  /** Solo el primer nombre (para saludo corto). */
  userFirstName: string | null;
  isProfileLoading: boolean;

  /** "Buenos días" / "Buenas tardes" / "Buenas noches" */
  greeting: string;
  /** "Tienes N citas pendientes hoy." o "No tienes citas pendientes hoy." */
  apptSubtitle: string;

  /** Totales para las métricas. "—" mientras cargan. */
  docTotal: number | string;
  apptTotal: number | string;
  medTotal: number | string;

  /** Cita más próxima (featured). */
  nextAppt: Appointment | null;

  /** Listas para las secciones de detalle (máx. 3 ítems). */
  upcomingAppts: Appointment[];
  activeMeds: Medication[];

  /** Últimos 3 documentos subidos. */
  recentDocs: Document[];

  /** Citas de hoy (filtro separado para badges "HOY"). */
  todayApptCount: number;

  isApptsLoading: boolean;
  isMedsLoading: boolean;
  isDocsLoading: boolean;
}

// ─── Core hook ───────────────────────────────────────────────────────────────

export function useDashboardCore(): DashboardData {
  const setUser = useAuthStore((s) => s.setUser);

  const profile = useProfileQuery();
  const docs = useDocumentsQuery("", 1, 3);
  const appts = useAppointmentsQuery("", 1, 3, todayISODate());
  const meds = useMedicationsQuery(1, 3);

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

  const today = todayISODate();
  const todayApptCount =
    appts.data?.items.filter((a) => a.date === today && a.status === "PENDING").length ?? 0;

  const totalUpcoming = appts.data?.items.filter((a) => a.status === "PENDING").length ?? 0;

  const apptSubtitle =
    todayApptCount > 0
      ? `Tienes ${todayApptCount} cita${todayApptCount > 1 ? "s" : ""} pendiente${todayApptCount > 1 ? "s" : ""} hoy.`
      : totalUpcoming > 0
        ? `Tienes ${totalUpcoming} cita${totalUpcoming > 1 ? "s" : ""} próxima${totalUpcoming > 1 ? "s" : ""}.`
        : "No tienes citas pendientes.";

  const greeting = useMemo(() => getGreeting(), []);

  const userFirstName = useMemo(() => {
    const name = profile.data?.name;
    if (!name) return null;
    return name.split(" ")[0];
  }, [profile.data?.name]);

  return {
    userName: profile.data?.name ?? profile.data?.email ?? null,
    userFirstName: userFirstName ?? null,
    isProfileLoading: profile.isLoading,

    greeting,
    apptSubtitle,

    docTotal: docs.isLoading ? "—" : (docs.data?.total ?? "—"),
    apptTotal: appts.isLoading ? "—" : (appts.data?.total ?? "—"),
    medTotal: meds.isLoading ? "—" : (meds.data?.total ?? "—"),

    upcomingAppts: [...(appts.data?.items ?? [])].sort(
      (a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
    ),
    nextAppt: [...(appts.data?.items ?? [])].sort(
      (a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
    )[0] ?? null,
    activeMeds: meds.data?.items ?? [],
    recentDocs: docs.data?.items ?? [],

    todayApptCount,

    isApptsLoading: appts.isLoading,
    isMedsLoading: meds.isLoading,
    isDocsLoading: docs.isLoading,
  };
}
