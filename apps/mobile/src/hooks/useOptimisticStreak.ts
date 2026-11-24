import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@helu/stores";
import type { UserProfile } from "@helu/api";

function localKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface OptimisticStreak {
  /** The streak the server will report once it saves today's check-in. */
  streak: number;
  /** Puts the cached profile back (the save failed). */
  rollback: () => void;
}

/**
 * Check-in is low risk and reversible, like «Tomar» (movimiento-interacciones.md §6, v2.15): the
 * streak counts today **on tap**. Predicts the server's rule from the cached profile — today already
 * counted → same streak; last interaction yesterday → +1; otherwise a new streak of 1 — and writes it
 * to the profile cache, so Inicio's flame and number animate right away. The mutation's `onSuccess`
 * refetches the profile, which settles the real value; on error the caller rolls back.
 *
 * Returns null (nothing optimistic) for a check-in recorded on another day or before the profile
 * has loaded: those wait for the server as before.
 */
export function useOptimisticStreak() {
  const qc = useQueryClient();
  const activePatientId = useAuthStore((s) => s.activePatientId);

  return useCallback(
    (recordedDayKey: string): OptimisticStreak | null => {
      const key = ["me", activePatientId ?? "self"] as const;
      const prev = qc.getQueryData<UserProfile>(key);
      const now = new Date();
      const today = localKey(now);
      if (!prev || recordedDayKey !== today) return null;

      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(now.getDate() - 1);
      const last = prev.lastInteractionDate?.slice(0, 10);
      const current = prev.currentStreak ?? 0;
      const streak =
        last === today
          ? Math.max(current, 1)
          : last === localKey(yesterdayDate)
            ? current + 1
            : 1;

      void qc.cancelQueries({ queryKey: key });
      qc.setQueryData<UserProfile>(key, {
        ...prev,
        currentStreak: streak,
        longestStreak: Math.max(prev.longestStreak ?? 0, streak),
        lastInteractionDate: today,
      });
      return { streak, rollback: () => qc.setQueryData(key, prev) };
    },
    [qc, activePatientId],
  );
}
