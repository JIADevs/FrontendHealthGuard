import Constants from "expo-constants";

/** Expo mobile — read API URL from app.config extra when env vars are not inlined. */
export function readExpoExtraApiUrl(): string | undefined {
    const extra = Constants.expoConfig?.extra as
        | { apiUrl?: string; API_URL?: string }
        | undefined;
    const fromExtra = extra?.apiUrl ?? extra?.API_URL;
    return typeof fromExtra === "string" && fromExtra.length > 0 ? fromExtra : undefined;
}
