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
} from "./reactQueryHooks";
import { useAuthStore } from "@helu/stores";
import type { Appointment, Medication, Document } from "./schemas";

function todayISODate(): string {
  // The user's calendar day, not the UTC one: appointments store local dates, and after 7 p. m. in
  // Colombia the UTC date is already tomorrow.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

  /** True mientras cualquiera de las 4 queries se está re-consultando (pull-to-refresh). */
  isRefetching: boolean;
  /** Vuelve a consultar perfil, documentos, citas y medicamentos. */
  refetch: () => Promise<unknown>;
}

// ─── Core hook ───────────────────────────────────────────────────────────────

/** Appointment statuses that are still to happen (both vocabularies, `agenda/prd.md`). */
const OPEN_APPOINTMENT_STATUSES = new Set(["PROGRAMADA", "PENDING", "RESCHEDULED"]);

export function useDashboardCore(): DashboardData {
  const setUser = useAuthStore((s) => s.setUser);
  const isManaging = useAuthStore((s) => s.isManaging);

  const profile = useProfileQuery();
  const docs = useDocumentsQuery("", 1, 3);
  // A few more than the 3 shown, so canceled or attended ones do not leave the card short (#119).
  const appts = useAppointmentsQuery("", 1, 10, todayISODate());
  const meds = useMedicationsQuery("", 1, 3);

  // Keep auth store user aligned with self profile only — not while impersonating.
  useEffect(() => {
    if (profile.data && !isManaging) {
      setUser({
        id: profile.data.id,
        name: profile.data.name,
        email: profile.data.email,
      });
    }
  }, [profile.data, isManaging, setUser]);

  const today = todayISODate();
  // Still to happen: the app saves PROGRAMADA, the web PENDING; canceled or attended ones are out (#119).
  const upcoming = (appts.data?.items ?? [])
    .filter((a) => OPEN_APPOINTMENT_STATUSES.has(a.status))
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  const todayApptCount = upcoming.filter((a) => a.date === today).length;

  const totalUpcoming = upcoming.length;

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
    isProfileLoading: profile.isPending || (profile.isFetching && !profile.data),

    greeting,
    apptSubtitle,

    docTotal: docs.isLoading ? "—" : (docs.data?.total ?? "—"),
    apptTotal: appts.isLoading ? "—" : (appts.data?.total ?? "—"),
    medTotal: meds.isLoading ? "—" : (meds.data?.total ?? "—"),

    upcomingAppts: upcoming.slice(0, 3),
    nextAppt: upcoming[0] ?? null,
    activeMeds: meds.data?.items ?? [],
    recentDocs: docs.data?.items ?? [],

    todayApptCount,

    isApptsLoading: appts.isLoading,
    isMedsLoading: meds.isLoading,
    isDocsLoading: docs.isLoading,

    isRefetching: profile.isRefetching || docs.isRefetching || appts.isRefetching || meds.isRefetching,
    refetch: () =>
      Promise.all([profile.refetch(), docs.refetch(), appts.refetch(), meds.refetch()]),
  };
}
