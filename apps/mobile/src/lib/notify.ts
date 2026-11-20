import Toast from "react-native-toast-message";

/**
 * Toast v2 (MASTER §7): arriba, 4 s; 5 s si trae acción.
 * Borrar algo recuperable se confirma con `notify({ ..., action: { label: "Deshacer", onPress } })`,
 * no con un modal. Misma firma que `apps/web/src/lib/notify.ts`.
 */
export type NotifyTone = "success" | "error" | "warning" | "info";

export interface NotifyOptions {
  message: string;
  description?: string;
  tone?: NotifyTone;
  action?: { label: string; onPress: () => void };
}

export function notify({ message, description, tone = "success", action }: NotifyOptions) {
  Toast.show({
    type: tone,
    text1: message,
    text2: description,
    visibilityTime: action ? 5000 : 4000,
    props: action ? { actionLabel: action.label, onAction: action.onPress } : undefined,
  });
}
