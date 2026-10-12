import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import type * as ExpoNotifications from "expo-notifications";
import Toast from "react-native-toast-message";
import { registerDeviceToken, unregisterDeviceToken, isApiError } from "@helu/api";
import { palette } from "@helu/ui";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let notificationsModule: typeof ExpoNotifications | null = null;
let lastRegisteredToken: string | null = null;
let registrationInFlight: Promise<boolean> | null = null;

function getNotificationsModule(): typeof ExpoNotifications | null {
  if (isExpoGo) return null;
  if (!notificationsModule) {
    notificationsModule = require("expo-notifications") as typeof ExpoNotifications;
  }
  return notificationsModule;
}

function extractErrorMessage(err: unknown): string {
  if (isApiError(err)) return err.message;
  if (err instanceof Error) return err.message;
  return String(err) || "Unknown error";
}

async function ensureAndroidChannel(Notifications: typeof ExpoNotifications) {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Helu",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: palette.brand[500],
    sound: "default",
  });
}

async function requestNotificationPermission(
  Notifications: typeof ExpoNotifications,
): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
}

async function obtainNativePushToken(
  Notifications: typeof ExpoNotifications,
): Promise<string> {
  const tokenData = await Notifications.getDevicePushTokenAsync();
  const pushToken =
    typeof tokenData.data === "string" ? tokenData.data.trim() : "";

  if (!pushToken) {
    throw new Error("Empty push token from device");
  }

  return pushToken;
}

function notifyRegistrationFailure(stage: "fcm" | "api", message: string) {
  console.warn(`[push] ${stage} failed:`, message);
  Toast.show({
    type: "error",
    text1:
      stage === "fcm"
        ? "No se pudo obtener token FCM"
        : "No se pudo guardar el token",
    text2: message,
    visibilityTime: 8000,
  });
}

/**
 * Obtains the native FCM/APNs token and registers it for the authenticated user.
 * Safe to call after login and on app foreground; dedupes concurrent calls.
 */
export async function registerDevicePushToken(options?: {
  force?: boolean;
  silent?: boolean;
}): Promise<boolean> {
  if (registrationInFlight) return registrationInFlight;

  registrationInFlight = (async () => {
    try {
      const Notifications = getNotificationsModule();
      if (!Notifications) return false;

      if (!Device.isDevice) {
        console.warn("[push] physical device required");
        return false;
      }

      await ensureAndroidChannel(Notifications);
      await requestNotificationPermission(Notifications);

      const permission = await Notifications.getPermissionsAsync();
      if (permission.status !== "granted") {
        console.warn("[push] notification permission:", permission.status);
      }

      const deviceType = Platform.OS === "ios" ? "ios" : "android";
      const maxAttempts = 3;
      let pushToken: string | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          pushToken = await obtainNativePushToken(Notifications);
          break;
        } catch (err) {
          const message = extractErrorMessage(err);
          console.warn(
            `[push] fcm attempt ${attempt}/${maxAttempts} failed:`,
            message,
            err,
          );

          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
            continue;
          }

          if (!options?.silent) {
            notifyRegistrationFailure("fcm", message);
          }
          return false;
        }
      }

      if (!pushToken) return false;

      if (!options?.force && pushToken === lastRegisteredToken) {
        return true;
      }

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          await registerDeviceToken(pushToken, deviceType);
          lastRegisteredToken = pushToken;
          console.warn("[push] device token registered");
          return true;
        } catch (err) {
          const message = extractErrorMessage(err);
          console.warn(
            `[push] api attempt ${attempt}/${maxAttempts} failed:`,
            message,
            err,
          );

          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
            continue;
          }

          if (!options?.silent) {
            notifyRegistrationFailure("api", message);
          }
          return false;
        }
      }

      return false;
    } finally {
      registrationInFlight = null;
    }
  })();

  return registrationInFlight;
}

export function resetDevicePushTokenRegistration() {
  lastRegisteredToken = null;
}

export function getLastRegisteredPushToken(): string | null {
  return lastRegisteredToken;
}

const UNREGISTER_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out")), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Best-effort unregister before logout clears auth. Prefer the in-memory token;
 * fall back to the live device token. Always resets local registration state.
 * Does NOT throw — logout must proceed even if this fails.
 * Call while the auth header is still present — before `logout()`.
 */
export async function unregisterDevicePushToken(): Promise<boolean> {
  let token = lastRegisteredToken;

  try {
    if (!token) {
      const Notifications = getNotificationsModule();
      if (!Notifications || !Device.isDevice) {
        resetDevicePushTokenRegistration();
        return false;
      }
      token = await withTimeout(obtainNativePushToken(Notifications), UNREGISTER_TIMEOUT_MS);
    }

    await withTimeout(unregisterDeviceToken(token), UNREGISTER_TIMEOUT_MS);
    console.warn("[push] device token unregistered");
    return true;
  } catch (err) {
    console.warn("[push] unregister failed:", extractErrorMessage(err));
    return false;
  } finally {
    resetDevicePushTokenRegistration();
  }
}

