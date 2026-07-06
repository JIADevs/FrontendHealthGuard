import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import type * as ExpoNotifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";
import { registerDeviceToken } from "@helu/api";
import { palette } from "@helu/ui";
import { navigationRef, navigateTo } from "../navigation/navigationRef";

declare const __DEV__: boolean;

/** Remote push is not available in Expo Go (Android SDK 53+). */
const isExpoGo = Constants.appOwnership === "expo";

let notificationsModule: typeof ExpoNotifications | null = null;
let handlerConfigured = false;

function getNotificationsModule(): typeof ExpoNotifications | null {
  if (isExpoGo) return null;
  if (!notificationsModule) {
    notificationsModule = require("expo-notifications") as typeof ExpoNotifications;
  }
  if (!handlerConfigured) {
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }
  return notificationsModule;
}

export interface PushNotificationState {
  notification?: ExpoNotifications.Notification;
}

export const usePushNotifications = (authToken?: string | null): PushNotificationState => {
  const queryClient = useQueryClient();
  const notificationRef = useRef<ExpoNotifications.Notification>(undefined);
  const notificationListener = useRef<ExpoNotifications.Subscription>(undefined);
  const responseListener = useRef<ExpoNotifications.Subscription>(undefined);
  const hasRegistered = useRef(false);

  const registerForPushNotificationsAsync = useCallback(async () => {
    const Notifications = getNotificationsModule();
    if (!Notifications) return;

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
        name: "Helu",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: palette.brand[500],
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

  useEffect(() => {
    if (!authToken || hasRegistered.current) return;
    registerForPushNotificationsAsync();
  }, [authToken, registerForPushNotificationsAsync]);

  useEffect(() => {
    if (!authToken) {
      hasRegistered.current = false;
    }
  }, [authToken]);

  useEffect(() => {
    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification: ExpoNotifications.Notification) => {
        notificationRef.current = notification;
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      },
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response: ExpoNotifications.NotificationResponse) => {
        const data = response.notification.request.content.data as Record<string, string>;
        handleNotificationTap(data);
      },
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [queryClient]);

  return { notification: notificationRef.current };
};

function handleNotificationTap(data: Record<string, string>) {
  switch (data?.type) {
    case "CHECKIN":
      if (navigationRef.isReady()) {
        navigationRef.navigate("MainTabs" as any, {
          screen: "Agenda",
          params: { initialTab: "wellbeing" },
        } as any);
      }
      break;
    case "APPOINTMENT":
    case "MEDICATION":
    case "SYSTEM":
    case "INFO":
    default:
      navigateTo("Notifications");
      break;
  }
}
