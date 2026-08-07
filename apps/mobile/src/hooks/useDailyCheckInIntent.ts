import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { getDailyCheckIns } from "@helu/api";
import { QK } from "@helu/api/hooks";
import { todayLocalDateKey, toUtcIsoFromPickerValue } from "@helu/ui";

export type DailyCheckInIntentStatus = "idle" | "loading" | "form" | "already-done" | "error";

export interface DailyCheckInIntentResult {
  status: DailyCheckInIntentStatus;
}

/**
 * Resolves a CHECKIN notification intent: is there already a check-in
 * recorded today? Uses a fresh, non-cached fetch (Decision 7,
 * `openspec/changes/push-notification-fixes/design.md`) — the TanStack cache
 * can be cold on cold start or stale after a check-in on another device.
 */
export function useDailyCheckInIntent(enabled: boolean): DailyCheckInIntentResult {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<DailyCheckInIntentStatus>("idle");
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      resolvedRef.current = false;
      setStatus("idle");
      return;
    }
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setStatus("loading");

    const today = todayLocalDateKey();
    const startDate = toUtcIsoFromPickerValue(`${today}T00:00:00`);
    const endDate = toUtcIsoFromPickerValue(`${today}T23:59:59`);

    let cancelled = false;

    void queryClient
      .fetchQuery({
        queryKey: QK.dailyCheckIns(1, startDate, endDate),
        queryFn: () => getDailyCheckIns({ page: 1, limit: 1, startDate, endDate }),
        staleTime: 0,
      })
      .then((page) => {
        if (cancelled) return;
        if (page.total > 0) {
          Toast.show({ type: "info", text1: "Ya registraste tu check-in de hoy" });
          setStatus("already-done");
        } else {
          setStatus("form");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, queryClient]);

  return { status };
}
