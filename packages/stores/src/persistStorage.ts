import type { StateStorage } from "zustand/middleware";

declare const __DEV__: boolean;

const memoryStorage = new Map<string, string>();
let customStorage: StateStorage | null = null;

/** Inject platform storage (e.g. AsyncStorage on mobile) before stores hydrate. */
export const setStoreStorage = (storage: StateStorage) => {
    customStorage = storage;
};

export function resolvePersistStorage(logLabel = "Stores"): StateStorage {
    if (customStorage) return customStorage;

    const isBrowser =
        typeof window !== "undefined" && typeof window.localStorage !== "undefined";

    if (isBrowser) {
        return window.localStorage;
    }

    if (__DEV__) {
        console.log(`[${logLabel}] Storage: Using memory fallback`);
    }

    return {
        getItem: (key) => memoryStorage.get(key) ?? null,
        setItem: (key, value) => {
            memoryStorage.set(key, value);
        },
        removeItem: (key) => {
            memoryStorage.delete(key);
        },
    };
}
