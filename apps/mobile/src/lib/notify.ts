import Toast from "react-native-toast-message";

/**
 * Toast v2 (MASTER §7): arriba, 4 s; 5 s si trae acción.
 * Borrar algo recuperable se confirma con `notify({ ..., action: { label: "Deshacer", onPress } })`,
 * no con un modal. Misma firma que `apps/web/src/lib/notify.ts`.
 */
/**
 * `streak` is mobile-only for now: the web gets it with its check-in screen (task 8.3).
 * `level` (static mascot) and `badge` (trophy) celebrate Motivación with a toast (MASTER §8).
 */
export type NotifyTone = "success" | "error" | "warning" | "info" | "streak" | "level" | "badge";

export interface NotifyOptions {
  message: string;
  description?: string;
  tone?: NotifyTone;
  action?: { label: string; onPress: () => void };
}

/** When the toast on screen goes away (one toast at a time, MASTER §7). */
let visibleUntil = 0;

function show({ message, description, tone = "success", action }: NotifyOptions) {
  const visibilityTime = action ? 5000 : 4000;
  visibleUntil = Date.now() + visibilityTime;
  Toast.show({
    type: tone,
    text1: message,
    text2: description,
    visibilityTime,
    props: action ? { actionLabel: action.label, onAction: action.onPress } : undefined,
  });
}

export function notify(options: NotifyOptions) {
  // Level and badge toasts come from a server refetch that races with the action's own toast
  // («¡7 días seguidos cuidándote!»): they wait a beat and never replace the toast on screen.
  if (options.tone === "level" || options.tone === "badge") {
    const at = Math.max(Date.now() + 1200, visibleUntil + 300);
    setTimeout(() => {
      if (Date.now() < visibleUntil) setTimeout(() => show(options), visibleUntil - Date.now() + 300);
      else show(options);
    }, at - Date.now());
    return;
  }
  show(options);
}
