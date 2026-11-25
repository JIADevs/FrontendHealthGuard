import { create } from "zustand";
import type { DocumentMissionSuggestion } from "@helu/api";

/**
 * Hand-off from «Subir archivo» / «Escanear» to the mission sheet (Misiones RF-68, mockups 4c «D2»–«D5b»).
 * The upload screen leaves the suggestion here and closes; `DocumentSuggestionHost` at the app root
 * opens the sheet over whatever is underneath. Ephemeral UI state, like `missionClosure`.
 */
export interface PendingDocumentSuggestion {
  document: { id: string; title: string; typeCode: string | null };
  suggestion: DocumentMissionSuggestion;
}

interface DocumentSuggestionState {
  pending: PendingDocumentSuggestion | null;
  offer: (pending: PendingDocumentSuggestion) => void;
  clear: () => void;
}

export const useDocumentSuggestion = create<DocumentSuggestionState>((set) => ({
  pending: null,
  offer: (pending) => set({ pending }),
  clear: () => set({ pending: null }),
}));
