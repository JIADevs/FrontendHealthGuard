import { Platform } from "react-native";
import * as Device from "expo-device";
import { getApiUrl, setRuntimeApiUrl } from "@helu/config";

declare const __DEV__: boolean;

/**
 * Physical device: keep LAN IP from EXPO_PUBLIC_API_URL.
 * Android emulator: host loopback is 10.0.2.2 (not the Wi‑Fi IP shown in the QR).
 * iOS simulator: host loopback is 127.0.0.1.
 */
function resolveRuntimeApiUrl(): string {
    const configured = getApiUrl();

    if (!__DEV__ || Device.isDevice) {
        return configured;
    }

    if (Platform.OS === "android") {
        return configured.replace(/^(https?:\/\/)[^:/?#]+/, "$110.0.2.2");
    }

    if (Platform.OS === "ios") {
        return configured.replace(/^(https?:\/\/)[^:/?#]+/, "$1127.0.0.1");
    }

    return configured;
}

const apiUrl = resolveRuntimeApiUrl();
setRuntimeApiUrl(apiUrl);
