import { createContext, useContext, type ReactNode } from "react";

/**
 * Everywhere the Agenda module can go. The Agenda screen provides it with React Navigation, so
 * the tabs, the calendar and their cards never import the navigator (task 4.7: screens only wire
 * props and callbacks).
 */
export interface AgendaNavigation {
  openAppointment: (id: string) => void;
  newAppointment: () => void;
  editAppointment: (id: string) => void;
  openMedication: (id: string) => void;
  newMedication: () => void;
  /** Edit a cycle of a medication (the form opens on that cycle) */
  editMedicationCycle: (medicationId: string, medicationName: string, cycleId: string) => void;
  /** «Nuevo ciclo» of a medication */
  newMedicationCycle: (medicationId: string, medicationName: string) => void;
  /** A cycle's detail, with its «Historial de tomas» */
  openMedicationCycle: (medicationId: string, medicationName: string, cycleId: string) => void;
  newTask: () => void;
  openTask: (id: string, intent?: "complete" | "reschedule") => void;
  editTask: (id: string) => void;
}

const AgendaNavigationContext = createContext<AgendaNavigation | null>(null);

export function AgendaNavigationProvider({ value, children }: { value: AgendaNavigation; children: ReactNode }) {
  return <AgendaNavigationContext.Provider value={value}>{children}</AgendaNavigationContext.Provider>;
}

export function useAgendaNavigation(): AgendaNavigation {
  const nav = useContext(AgendaNavigationContext);
  if (!nav) throw new Error("useAgendaNavigation must be used inside <AgendaNavigationProvider>");
  return nav;
}
