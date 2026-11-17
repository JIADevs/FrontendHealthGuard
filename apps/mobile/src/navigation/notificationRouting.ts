import type { Notification } from "@helu/api";
import { navigateTo } from "./navigationRef";

/**
 * Normalized notification routing payload. Push `data` keys arrive as
 * snake_case strings (FCM stringifies everything); callers normalize at the
 * boundary before calling `navigateForNotification`.
 */
export interface NotificationRoutePayload {
  type: string;
  entityId?: string | null; // appointment id | medication cycle id | agenda task id
  medicationId?: string | null;
  medicationName?: string | null;
  scheduledTime?: string | null; // ISO-8601 UTC; client derives dayKey + intakeTime
  /** Follow-up push may suggest complete and/or reschedule (comma-separated). */
  actions?: string | null;
}

/**
 * Sole routing table for notification taps. Push tap, cold start, and
 * `NotificationsScreen` MUST all call this — no other switch on notification
 * `type` may exist. `*_FOLLOWUP` variants route the same as their base type.
 */
export function navigateForNotification(payload: NotificationRoutePayload): void {
  const { type, entityId, medicationId, medicationName, scheduledTime } = payload;

  switch (type) {
    case "APPOINTMENT":
    case "APPOINTMENT_FOLLOWUP":
      if (entityId) {
        navigateTo("AppointmentDetail", { id: entityId });
      } else {
        navigateTo("Notifications");
      }
      break;

    case "MEDICATION":
    case "MEDICATION_FOLLOWUP":
      navigateTo("MainTabs", {
        screen: "Agenda",
        params: {
          initialTab: "calendar",
          intent: "medication-intake",
          intentAt: Date.now(),
          cycleId: entityId ?? undefined,
          medicationId: medicationId ?? undefined,
          medicationName: medicationName ?? undefined,
          scheduledTime: scheduledTime ?? undefined,
        },
      });
      break;

    case "CHECKIN":
      navigateTo("MainTabs", {
        screen: "Agenda",
        params: {
          initialTab: "wellbeing",
          intent: "daily-checkin",
          intentAt: Date.now(),
        },
      });
      break;

    case "AGENDA_TASK":
    case "AGENDA_TASK_FOLLOWUP": {
      if (!entityId) {
        navigateTo("Notifications");
        break;
      }
      const followupIntent = resolveAgendaTaskFollowupIntent(payload);
      navigateTo("AgendaTaskDetail", {
        id: entityId,
        ...(followupIntent ? { intent: followupIntent } : {}),
      });
      break;
    }

    case "DELEGATION_INVITE":
      navigateTo("Dependientes", { backTitle: "Notificaciones" });
      break;

    case "SYSTEM":
    case "INFO":
    default:
      navigateTo("Notifications");
      break;
  }
}

/**
 * Builds a `NotificationRoutePayload` from a raw push `data` object
 * (snake_case string values from FCM/APNs).
 */
export function buildRoutePayloadFromPushData(
  data: Record<string, string> | undefined,
): NotificationRoutePayload {
  return {
    type: data?.type ?? "",
    entityId: data?.entity_id ?? data?.agenda_task_id ?? null,
    medicationId: data?.medication_id ?? null,
    medicationName: data?.medication_name ?? null,
    scheduledTime: data?.scheduled_time ?? null,
    actions: data?.actions ?? null,
  };
}

function resolveAgendaTaskFollowupIntent(
  payload: NotificationRoutePayload,
): "complete" | "reschedule" | undefined {
  if (payload.type !== "AGENDA_TASK_FOLLOWUP") return undefined;
  const actions = (payload.actions ?? "").toLowerCase();
  // Prefer complete when both are offered; user can still reschedule from detail.
  if (actions.includes("complete")) return "complete";
  if (actions.includes("reschedule")) return "reschedule";
  return "complete";
}

/**
 * Builds a `NotificationRoutePayload` from a persisted `Notification` row
 * (in-app list tap). When `data` is present (new rows), deep-link fields match
 * the live push path. Older rows without `data` leave medication fields null —
 * Agenda falls back silently to the medications list.
 */
export function buildRoutePayloadFromNotification(item: Notification): NotificationRoutePayload {
  const data = item.data ?? undefined;
  const read = (snake: string, camel: string): string | null => {
    if (!data) return null;
    const value = data[camel] ?? data[snake];
    if (value == null) return null;
    return String(value);
  };

  return {
    type: item.type,
    entityId: item.entityId ?? read("agenda_task_id", "agendaTaskId"),
    medicationId: read("medication_id", "medicationId"),
    medicationName: read("medication_name", "medicationName"),
    scheduledTime: read("scheduled_time", "scheduledTime"),
    actions: read("actions", "actions"),
  };
}
