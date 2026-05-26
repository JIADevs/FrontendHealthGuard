import { Platform } from "react-native";
import Constants from "expo-constants";
import type { PermissionResponse } from "expo-modules-core";

/** Textos fijos de la pantalla de permiso de camara (escaner). */
export const SCANNER_PERMISSION_COPY = {
  title: "Acceso a la cámara",
  subtitle: "Necesaria para escanear documentos.",
  trust: "Solo se usa al escanear.",
  hint: "Se mostrará un aviso del sistema. Elija Permitir.",
  primaryButton: "Conceder permiso",
  secondaryButton: "Abrir ajustes",
  backA11y: "Volver",
  primaryA11y: "Conceder permiso",
  secondaryA11y: "Abrir ajustes del dispositivo",
} as const;

/** Nombre visible de la app en Ajustes del sistema. */
export function getScannerSettingsAppName(): string {
  if (Constants.appOwnership === "expo") {
    return "Expo Go";
  }
  return "Helu";
}

export function getScannerSettingsPath(): string {
  const app = getScannerSettingsAppName();
  if (Platform.OS === "android") {
    return `Ajustes > Aplicaciones > ${app} > Permisos > Cámara`;
  }
  return `Ajustes > ${app} > Cámara`;
}

export function messageOpeningDialog(): string {
  return "Solicitando permiso…";
}

export function messageDeniedRetry(): string {
  return "Permiso denegado. Toque otra vez o active la cámara en Ajustes.";
}

export function messageDialogNoResponse(): string {
  return "Sin respuesta del sistema. Intente de nuevo.";
}

export function messageRetryPermission(): string {
  return "Toque Conceder permiso.";
}

export function messageBlockedInSettings(): string {
  return `Permiso bloqueado. Active la cámara en ${getScannerSettingsPath()}.`;
}

export function messageDismissedDialogHint(): string {
  return "Si cancela el aviso, puede intentar de nuevo o usar Ajustes.";
}

export function messageWebUnsupported(): string {
  return "Use la app en el teléfono (Expo Go) para escanear.";
}

/**
 * Indica si conviene dirigir al usuario a Ajustes (bloqueo permanente / no volver a preguntar).
 */
export function shouldOpenSettingsForPermission(
  permission: PermissionResponse,
  deniedRequestCount: number,
): boolean {
  if (permission.granted) return false;

  if (Platform.OS === "android") {
    if (permission.status !== "denied") return false;
    if (permission.canAskAgain) return false;
    return deniedRequestCount >= 2;
  }

  return permission.status === "denied" && !permission.canAskAgain;
}
