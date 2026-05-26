import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking, Platform, type AppStateStatus } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Camera, type PermissionResponse } from "expo-camera";
import {
  messageBlockedInSettings,
  messageDeniedRetry,
  messageDialogNoResponse,
  messageOpeningDialog,
  messageRetryPermission,
  messageWebUnsupported,
  shouldOpenSettingsForPermission,
} from "../utils/scannerPermissionMessages";

const REQUEST_TIMEOUT_MS = 8_000;
const isNativeMobile = Platform.OS === "ios" || Platform.OS === "android";

async function requestWithTimeout(): Promise<PermissionResponse> {
  return Promise.race([
    Camera.requestCameraPermissionsAsync(),
    new Promise<PermissionResponse>((_, reject) => {
      setTimeout(() => reject(new Error("permission_request_timeout")), REQUEST_TIMEOUT_MS);
    }),
  ]);
}

/**
 * Permisos de cámara para el escáner (iOS y Android).
 * Cada toque lanza una solicitud nueva (con timeout) para no quedar bloqueado si el SO no responde.
 */
export function useScannerCameraPermission() {
  const [permission, setPermission] = useState<PermissionResponse | null>(null);
  const [permissionReady, setPermissionReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const autoRequestedRef = useRef(false);
  const requestInFlightRef = useRef(false);
  const deniedRequestCountRef = useRef(0);
  const wentBackgroundDuringRequestRef = useRef(false);

  const syncPermission = useCallback(async (): Promise<PermissionResponse | null> => {
    try {
      const latest = await Camera.getCameraPermissionsAsync();
      setPermission(latest);
      setPermissionReady(true);
      if (latest.granted) {
        deniedRequestCountRef.current = 0;
        setStatusMessage(null);
      }
      return latest;
    } catch {
      setPermissionReady(true);
      return null;
    }
  }, []);

  const runPermissionRequest = useCallback(
    async (source: "auto" | "button") => {
      if (requestInFlightRef.current) {
        requestInFlightRef.current = false;
        await new Promise((resolve) => setTimeout(resolve, 120));
      }

      if (Platform.OS === "web") {
        setStatusMessage(messageWebUnsupported());
        return;
      }

      const before = await syncPermission();
      if (!before) return;
      if (before.granted) return;

      if (
        source === "button" &&
        shouldOpenSettingsForPermission(before, deniedRequestCountRef.current)
      ) {
        setStatusMessage(messageBlockedInSettings());
        return;
      }

      requestInFlightRef.current = true;
      wentBackgroundDuringRequestRef.current = false;

      if (source === "button") {
        setStatusMessage(messageOpeningDialog());
      }

      try {
        const response = await requestWithTimeout();
        setPermission(response);

        if (response.granted) {
          deniedRequestCountRef.current = 0;
          setStatusMessage(null);
          return;
        }

        if (response.status === "denied") {
          deniedRequestCountRef.current += 1;
        }

        if (response.status === "denied") {
          if (shouldOpenSettingsForPermission(response, deniedRequestCountRef.current)) {
            setStatusMessage(messageBlockedInSettings());
          } else {
            setStatusMessage(messageDeniedRetry());
          }
          return;
        }

        setStatusMessage(messageRetryPermission());
      } catch {
        const after = await syncPermission();
        if (after?.granted) {
          setStatusMessage(null);
          return;
        }

        if (after?.status === "denied") {
          deniedRequestCountRef.current += 1;
        }

        setStatusMessage(messageDialogNoResponse());
      } finally {
        requestInFlightRef.current = false;
      }
    },
    [syncPermission],
  );

  useEffect(() => {
    void syncPermission();
  }, [syncPermission]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const latest = await syncPermission();
        if (latest?.granted || autoRequestedRef.current) return;
        if (latest?.status === "undetermined") {
          autoRequestedRef.current = true;
          await runPermissionRequest("auto");
        }
      })();

      return () => {
        autoRequestedRef.current = false;
      };
    }, [syncPermission, runPermissionRequest]),
  );

  useEffect(() => {
    if (!isNativeMobile) return;

    const onAppState = (state: AppStateStatus) => {
      if (state === "inactive" || state === "background") {
        if (requestInFlightRef.current) {
          wentBackgroundDuringRequestRef.current = true;
        }
        return;
      }

      if (state !== "active") return;

      void (async () => {
        const latest = await syncPermission();
        if (latest?.granted) {
          requestInFlightRef.current = false;
          return;
        }

        if (requestInFlightRef.current || wentBackgroundDuringRequestRef.current) {
          requestInFlightRef.current = false;
          wentBackgroundDuringRequestRef.current = false;
          setStatusMessage(messageDeniedRetry());
        }
      })();
    };

    const sub = AppState.addEventListener("change", onAppState);
    return () => sub.remove();
  }, [syncPermission]);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const requestCameraAccess = useCallback(() => {
    void runPermissionRequest("button");
  }, [runPermissionRequest]);

  const needsSettings =
    permission != null &&
    shouldOpenSettingsForPermission(permission, deniedRequestCountRef.current);

  return {
    permission,
    permissionReady,
    granted: permission?.granted === true,
    needsSettings,
    statusMessage,
    requestCameraAccess,
    openSettings,
    refreshPermission: syncPermission,
  };
}
