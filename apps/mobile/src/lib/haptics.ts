import * as Haptics from "expo-haptics";

/**
 * Háptica v2 (movimiento-interacciones.md §6): solo en confirmaciones y errores, nunca en cada
 * toque. `expo-haptics` respeta la configuración de vibración del sistema; si el dispositivo no
 * la soporta, la llamada se ignora.
 */
const safe = (run: () => Promise<void>) => {
  run().catch(() => undefined);
};

export const haptics = {
  /** Toma registrada, check-in guardado, paso completado */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Error de validación al enviar un formulario */
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  /** Error de red o una acción optimista que vuelve atrás */
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  /** Acción guardada, cambio de contexto */
  light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
};
