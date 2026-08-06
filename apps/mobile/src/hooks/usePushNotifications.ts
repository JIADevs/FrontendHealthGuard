import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import type * as ExpoNotifications from "expo-notifications";
import type { QueryClient } from "@tanstack/react-query";
import { getNotifications } from "@helu/api";
import { delegationKeys } from "@helu/api/hooks";
import { useNotifStore } from "@helu/stores";
import { navigationRef, navigateTo } from "../navigation/navigationRef";
import {
  registerDevicePushToken,
  resetDevicePushTokenRegistration,
} from "../services/pushTokenRegistration";

let notificationsModule: typeof ExpoNotifications | null = null;
let handlerConfigured = false;

function getNotificationsModule(): typeof ExpoNotifications | null {
  try {
    const Constants = require("expo-constants").default;
    const { ExecutionEnvironment } = require("expo-constants");
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      return null;
    }
  } catch {
    return null;
  }

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

function handlePushPayload(
  data: Record<string, string> | undefined,
  queryClient?: QueryClient,
) {
  if (!data?.type) return;

  if (data.type === "DELEGATION_INVITE" && queryClient) {
    void queryClient.invalidateQueries({ queryKey: delegationKeys.all() });
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    void getNotifications({ page: 1, limit: 50 })
      .then((res) => {
        const unread = res.items.filter((n) => !n.isRead).length;
        useNotifStore.getState().setUnreadCount(unread);
      })
      .catch(() => {});
  } else if (queryClient) {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }
}

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
    case "DELEGATION_INVITE":
      navigateTo("Dependientes", { backTitle: "Más" });
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

export const usePushNotifications = (
  authToken?: string | null,
  queryClient?: QueryClient,
  isHydrated = true,
): PushNotificationState => {
  const notificationRef = useRef<ExpoNotifications.Notification>(undefined);
  const notificationListener = useRef<ExpoNotifications.Subscription>(undefined);
  const responseListener = useRef<ExpoNotifications.Subscription>(undefined);
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (!authToken || !isHydrated || hasRegistered.current) return;

    void registerDevicePushToken({ silent: true }).then((ok) => {
      if (ok) hasRegistered.current = true;
    });
  }, [authToken, isHydrated]);

  useEffect(() => {
    if (!authToken) {
      hasRegistered.current = false;
      resetDevicePushTokenRegistration();
    }
  }, [authToken]);

  useEffect(() => {
    if (!authToken || !isHydrated) return;

    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== "active") return;
      void registerDevicePushToken({ silent: true }).then((ok) => {
        if (ok) hasRegistered.current = true;
      });
    };

    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, [authToken, isHydrated]);

  useEffect(() => {
    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification: ExpoNotifications.Notification) => {
        notificationRef.current = notification;
        const data = notification.request.content.data as Record<string, string> | undefined;
        handlePushPayload(data, queryClient);
      },
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response: ExpoNotifications.NotificationResponse) => {
        const data = response.notification.request.content.data as Record<string, string>;
        handlePushPayload(data, queryClient);
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
