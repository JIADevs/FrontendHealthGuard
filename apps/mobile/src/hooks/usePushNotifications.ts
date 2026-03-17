import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";

declare const __DEV__: boolean;
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { registerDeviceToken } from "@healthguard/api";
import { navigateTo } from "../navigation/navigationRef";

export interface PushNotificationState {
  notification?: Notifications.Notification;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const usePushNotifications = (authToken?: string | null): PushNotificationState => {
  const notificationRef = useRef<Notifications.Notification>();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  // Evita re-registrar en cada refresh de token — solo registra una vez por sesión
  const hasRegistered = useRef(false);

  const registerForPushNotificationsAsync = useCallback(async () => {
    if (!Device.isDevice) {
      if (__DEV__) console.warn("Se requiere un dispositivo físico para notificaciones push");
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      if (__DEV__) console.warn("Permiso denegado para recibir notificaciones push");
      return;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "HealthGuard",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0ea5e9",
        sound: "default",
      });
    }

    try {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      const deviceType = Platform.OS === "ios" ? "ios" : "android";
      await registerDeviceToken(tokenData.data, deviceType);
      hasRegistered.current = true;
    } catch (err) {
      if (__DEV__) console.warn("Error obteniendo o registrando el token FCM", err);
    }
  }, []);

  // Se registra solo una vez por sesión: cuando el usuario se autentica por primera vez
  useEffect(() => {
    if (!authToken || hasRegistered.current) return;
    registerForPushNotificationsAsync();
  }, [authToken, registerForPushNotificationsAsync]);

  // Resetea el flag al cerrar sesión para que el próximo login registre de nuevo
  useEffect(() => {
    if (!authToken) {
      hasRegistered.current = false;
    }
  }, [authToken]);

  // Listeners montados una sola vez, independientemente del auth
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification: Notifications.Notification) => {
        notificationRef.current = notification;
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        const data = response.notification.request.content.data as Record<string, string>;
        handleNotificationTap(data);
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { notification: notificationRef.current };
};

function handleNotificationTap(data: Record<string, string>) {
  switch (data?.type) {
    case "APPOINTMENT":
    case "MEDICATION":
    case "CHECKIN":
    case "SYSTEM":
    case "INFO":
    default:
      navigateTo("Notifications");
      break;
  }
}
