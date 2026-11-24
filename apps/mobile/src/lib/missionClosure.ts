import { create } from "zustand";
import type { MissionType } from "@helu/api";

/**
 * Hand-off from the celebration to Inicio (Misiones RF-52, v2.22): «Volver al inicio» leaves the
 * completed mission here, and Inicio opens the follow-up sheet over itself. Ephemeral UI state.
 */
export interface PendingFollowUp {
  missionId: string;
  type: MissionType;
  title: string;
}

interface MissionClosureState {
  followUp: PendingFollowUp | null;
  setFollowUp: (followUp: PendingFollowUp | null) => void;
  /** Read once: the sheet shows a single time for that closure. */
  takeFollowUp: () => PendingFollowUp | null;
}

export const useMissionClosure = create<MissionClosureState>((set, get) => ({
  followUp: null,
  setFollowUp: (followUp) => set({ followUp }),
  takeFollowUp: () => {
    const followUp = get().followUp;
    if (followUp) set({ followUp: null });
    return followUp;
  },
}));
