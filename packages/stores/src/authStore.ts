import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { resolvePersistStorage } from "./persistStorage";

type User = {
    id: string;
    name: string | null;
    email: string;
};

/** `full` wipes the cache (login/logout). `patient-context` drops only patient-scoped queries. */
export type QueryCacheCleanMode = "full" | "patient-context";

type QueryCacheCleaner = (mode?: QueryCacheCleanMode) => void;

type AuthState = {
    token: string | null;
    refreshToken: string | null;
    user: User | null;
    isHydrated: boolean;
    activePatientId: string | null;
    isManaging: boolean;

    setAuth: (token: string, refreshToken: string) => void;
    setUser: (user: User) => void;
    setPatientContext: (patientId: string | null) => void;
    switchPatientContext: (patientId: string | null) => void;
    setQueryCacheCleaner: (fn: QueryCacheCleaner) => void;
    logout: () => void;
    setHydrated: () => void;
};

// Injected cache cleaner — set at bootstrap; lives outside the Zustand state
// to avoid serialization and circular dep (api → stores → api).
let _queryCacheCleaner: QueryCacheCleaner | null = null;

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            refreshToken: null,
            user: null,
            isHydrated: false,
            activePatientId: null,
            isManaging: false,

            setAuth: (token, refreshToken) => {
                _queryCacheCleaner?.("full");
                set({
                    token,
                    refreshToken,
                    user: null,
                    activePatientId: null,
                    isManaging: false,
                });
            },
            setUser: (user) => set({ user }),
            setPatientContext: (patientId) =>
                set({ activePatientId: patientId, isManaging: !!patientId }),
            switchPatientContext: (patientId) => {
                set({ activePatientId: patientId, isManaging: !!patientId });
                _queryCacheCleaner?.("patient-context");
            },
            setQueryCacheCleaner: (fn) => {
                _queryCacheCleaner = fn;
            },
            logout: () => {
                _queryCacheCleaner?.("full");
                set({
                    token: null,
                    refreshToken: null,
                    user: null,
                    activePatientId: null,
                    isManaging: false,
                });
            },
            setHydrated: () => set({ isHydrated: true }),
        }),
        {
            name: "auth-store",
            storage: createJSONStorage(() => resolvePersistStorage("AuthStore")),
            partialize: (s) => ({
                token: s.token,
                refreshToken: s.refreshToken,
                user: s.user,
                // R7 Option B: do NOT persist activePatientId — reset to null on cold start
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.activePatientId = null;
                    state.isManaging = false;
                }
                state?.setHydrated();
            },
        }
    )
);

export const useToken = () => useAuthStore((s) => s.token);
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuth = () => useAuthStore((s) => !!s.token);
export const useIsManaging = () => useAuthStore((s) => s.isManaging);
