"use client";
import { sileo } from "sileo";

/**
 * Toast v2 (MASTER §7): arriba al centro, 4 s; 5 s si trae acción.
 * Borrar algo recuperable se confirma con `notify({ ..., action: { label: "Deshacer", onPress } })`,
 * no con un modal. Misma firma que `apps/mobile/src/lib/notify.ts`.
 */
export type NotifyTone = "success" | "error" | "warning" | "info";

export interface NotifyOptions {
  message: string;
  description?: string;
  tone?: NotifyTone;
  action?: { label: string; onPress: () => void };
}

export function notify({ message, description, tone = "success", action }: NotifyOptions): string {
  return sileo[tone]({
    title: message,
    description,
    duration: action ? 5000 : 4000,
    button: action ? { title: action.label, onClick: action.onPress } : undefined,
  });
}
