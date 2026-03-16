// Support both Next.js and Expo environment variable conventions
export const env = {
    API_URL:
        (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) ||
        (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
        "http://localhost:8000",
} as const;
