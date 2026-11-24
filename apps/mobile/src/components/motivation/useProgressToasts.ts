import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUserProgressQuery, type UserProfile } from "@helu/api";
import { useAuthStore } from "@helu/stores";
import { notify } from "../../lib/notify";
import { useMissionClosure } from "../../lib/missionClosure";
import { badgeCopy } from "./badgeCatalog";

interface Seen {
  level: number;
  badges: Set<string>;
}

/**
 * Motivación toasts (MASTER §8: the big celebration is only for a completed mission; the rest is a
 * toast). Mounted once at the app root, it compares each server answer with the last one it saw:
 *
 * - a higher level → «¡Subiste al nivel 5 · Al día!» with the static mascot (Motivación §4), only
 *   with «Mostrar racha y nivel» on;
 * - a new badge → «Nueva insignia: Racha de 7» (badges are never hidden, RF-93).
 *
 * The first answer of a session (or of a patient context) is the baseline, so opening the app never
 * replays old achievements. Nothing shows for the mission being celebrated: its screen already says it.
 */
export function useProgressToasts(enabled: boolean) {
  const progress = useUserProgressQuery(enabled);
  const patientId = useAuthStore((s) => s.activePatientId);
  const managing = useAuthStore((s) => s.isManaging && !!s.activePatientId);
  const qc = useQueryClient();
  const seen = useRef(new Map<string, Seen>());

  useEffect(() => {
    const data = progress.data;
    if (!data || progress.isFetching) return;
    const key = patientId ?? "self";
    const earned = new Set(data.badges.filter((b) => b.earned).map((b) => b.code));
    const before = seen.current.get(key);
    seen.current.set(key, { level: data.level.number, badges: earned });
    if (!before) return;

    const celebrating = useMissionClosure.getState().celebrating;
    const fresh = data.badges
      .filter((b) => b.earned && !before.badges.has(b.code) && badgeCopy(b.code))
      .filter((b) => !(celebrating && b.sourceId === celebrating))
      .map((b) => badgeCopy(b.code)!);
    const leveledUp = data.showProgress && data.level.number > before.level && !celebrating;

    if (leveledUp) {
      // One toast at a time (MASTER §7): a badge earned with the same action rides along.
      const profile = qc.getQueryData<UserProfile>(["me", patientId ?? "self"]);
      const name = profile?.name?.trim().split(/\s+/)[0] ?? null;
      const level = `${data.level.number} · ${data.level.name}`;
      notify({
        tone: "level",
        message: managing ? `¡${name ?? "Tu familiar"} subió al nivel ${level}!` : `¡Subiste al nivel ${level}!`,
        description: fresh.length ? `Nueva insignia: ${fresh.map((c) => c.label).join(" y ")}` : undefined,
      });
    } else if (fresh.length) {
      notify({
        tone: "badge",
        message: `Nueva insignia: ${fresh.map((c) => c.label).join(" y ")}`,
        description: fresh.length === 1 ? (managing ? fresh[0]!.earnedTextOther : fresh[0]!.earnedText) : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.data, progress.isFetching, patientId]);
}
