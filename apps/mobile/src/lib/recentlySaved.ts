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
  backpackId: string | null;
  markBackpack: (id: string | undefined) => void;
  clearBackpack: () => void;
  /** Last uploaded document, so «Agregar documentos» can come back with it selected (#46). */
  uploadedDocumentId: string | null;
  markUploaded: (id: string | undefined) => void;
  takeUploaded: () => string | null;
}

export const useRecentlySaved = create<RecentlySavedState>((set, get) => ({
  appointmentId: null,
  markAppointment: (id) => set({ appointmentId: id ?? null }),
  clearAppointment: () => set({ appointmentId: null }),
  documentId: null,
  markDocument: (id) => set({ documentId: id ?? null }),
  clearDocument: () => set({ documentId: null }),
  backpackId: null,
  markBackpack: (id) => set({ backpackId: id ?? null }),
  clearBackpack: () => set({ backpackId: null }),
  uploadedDocumentId: null,
  markUploaded: (id) => set({ uploadedDocumentId: id ?? null }),
  takeUploaded: () => {
    const id = get().uploadedDocumentId;
    if (id) set({ uploadedDocumentId: null });
    return id;
  },
}));
