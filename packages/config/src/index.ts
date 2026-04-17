// Support both Next.js and Expo environment variable conventions
export const env = {
    API_URL:
        (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) ||
        (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
        "http://127.0.0.1:8000",
    /**
     * Base URL de la web alcanzable desde un dispositivo físico (p. ej. IP LAN + :3000).
     * Sirve para reescribir enlaces de compartir que el backend arma con localhost cuando probás con Expo en un teléfono.
     */
    WEB_APP_PUBLIC_URL: (() => {
        const a = typeof process !== "undefined" ? process.env.EXPO_PUBLIC_WEB_APP_URL : "";
        const b = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_WEB_APP_URL : "";
        return (a || b || "").trim();
    })(),
} as const;
