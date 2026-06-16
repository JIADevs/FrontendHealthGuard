// Support both Next.js and Expo environment variable conventions.
// On Expo monorepos, `EXPO_PUBLIC_*` may not inline into workspace packages — read `expo.extra` too.

let runtimeApiUrl: string | null = null;

export function setRuntimeApiUrl(url: string) {
    runtimeApiUrl = url.replace(/\/$/, "");
}

function readExpoExtraApiUrl(): string | undefined {
    try {
        const Constants = require("expo-constants").default as {
            expoConfig?: { extra?: { apiUrl?: string; API_URL?: string } };
        };
        const extra = Constants.expoConfig?.extra;
        const fromExtra = extra?.apiUrl ?? extra?.API_URL;
        return typeof fromExtra === "string" && fromExtra.length > 0 ? fromExtra : undefined;
    } catch {
        return undefined;
    }
}

export function getApiUrl(): string {
    if (runtimeApiUrl) return runtimeApiUrl;

    const fromExpoExtra = readExpoExtraApiUrl();
    if (fromExpoExtra) return fromExpoExtra.replace(/\/$/, "");

    const fromExpoEnv =
        typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_API_URL : undefined;
    if (fromExpoEnv) return fromExpoEnv.replace(/\/$/, "");

    const fromNextEnv =
        typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_API_URL : undefined;
    if (fromNextEnv) return fromNextEnv.replace(/\/$/, "");

    return "http://127.0.0.1:8000";
}

export const env = {
    get API_URL() {
        return getApiUrl();
    },
    /**
     * Base URL de la web alcanzable desde un dispositivo físico (p. ej. IP LAN + :3000).
     * Sirve para reescribir enlaces de compartir que el backend arma con localhost cuando probás con Expo en un teléfono.
     */
    get WEB_APP_PUBLIC_URL() {
        const a = typeof process !== "undefined" ? process.env.EXPO_PUBLIC_WEB_APP_URL : "";
        const b = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_WEB_APP_URL : "";
        return (a || b || "").trim();
    },
} as const;
