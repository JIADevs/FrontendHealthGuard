import { Platform } from "react-native";
import Constants from "expo-constants";
import type { PermissionResponse } from "expo-camera";

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
  return "No diste el permiso. Toca «Permitir la cámara» otra vez o actívala en Ajustes.";
}

export function messageDialogNoResponse(): string {
  return "El teléfono no respondió. Intenta de nuevo.";
}

export function messageRetryPermission(): string {
  return "Toca «Permitir la cámara».";
}

export function messageBlockedInSettings(): string {
  return `Actívala en ${getScannerSettingsPath()}.`;
}

export function messageWebUnsupported(): string {
  return "Para escanear, usa la app en el teléfono.";
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
