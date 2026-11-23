import { create } from "zustand";

/**
 * Último elemento guardado, para resaltarlo en su lista (movimiento-interacciones.md §6:
 * «el elemento guardado aparece resaltado en su lista, borde de 1,2 s»). Es estado de UI
 * efímero: no se persiste.
 */
interface RecentlySavedState {
  appointmentId: string | null;
  markAppointment: (id: string | undefined) => void;
  clearAppointment: () => void;
  documentId: string | null;
  markDocument: (id: string | undefined) => void;
  clearDocument: () => void;
  treatmentId: string | null;
  markTreatment: (id: string | undefined) => void;
  clearTreatment: () => void;
}

export const useRecentlySaved = create<RecentlySavedState>((set) => ({
  appointmentId: null,
  markAppointment: (id) => set({ appointmentId: id ?? null }),
  clearAppointment: () => set({ appointmentId: null }),
  documentId: null,
  markDocument: (id) => set({ documentId: id ?? null }),
  clearDocument: () => set({ documentId: null }),
  treatmentId: null,
  markTreatment: (id) => set({ treatmentId: id ?? null }),
  clearTreatment: () => set({ treatmentId: null }),
}));
