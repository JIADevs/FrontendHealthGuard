import { useEffect, useRef } from "react";
import { useMarkNoticeSeenMutation, type MissionNotice } from "@helu/api";
import { notify } from "../../lib/notify";
import { useManagingSomeone } from "../home/useManagingSomeone";

/** «Carlos completó tu misión «Vamos a tu cita» · Nueva insignia: Primera misión» (RF-74, mockup v2.25). */
export function noticeMessage(n: MissionNotice): string {
  const who = n.completedBy.name?.trim().split(/\s+/)[0] || "Quien te acompaña";
  const badge = n.achievement ? ` · Nueva insignia: ${n.achievement.name}` : "";
  return `${who} completó tu misión «${n.missionTitle}»${badge}`;
}

/**
 * RF-74 / DU-36: a manager completed the patient's mission. The patient sees one toast, once, the
 * next time Inicio opens; then it is marked seen. A manager browsing in management mode never sees
 * or consumes it (the server also sends none then, DU-43).
 */
export function useMissionNotices(notices: MissionNotice[] | undefined) {
  const managing = useManagingSomeone();
  const markSeen = useMarkNoticeSeenMutation();
  const shown = useRef(new Set<string>());

  useEffect(() => {
    if (managing || !notices?.length) return;
    const fresh = notices.filter((n) => !shown.current.has(n.missionId));
    if (!fresh.length) return;
    fresh.forEach((n) => shown.current.add(n.missionId));
    // One toast: the newest notice, and how many more if there were several.
    const first = fresh[0]!;
    notify({
      message: noticeMessage(first),
      description: fresh.length > 1 ? `Y ${fresh.length - 1} más en Misiones.` : undefined,
    });
    fresh.forEach((n) => markSeen.mutate(n.missionId));
  }, [managing, notices]); // eslint-disable-line react-hooks/exhaustive-deps
}
