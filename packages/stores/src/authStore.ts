import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type User = {
    id: string;
    name: string | null;
    email: string;
};

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
    logout: () => void;
    setHydrated: () => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            refreshToken: null,
            user: null,
            isHydrated: false,
            activePatientId: null,
            isManaging: false,

            setAuth: (token, refreshToken) => set({ token, refreshToken }),
            setUser: (user) => set({ user }),
            setPatientContext: (patientId) =>
                set({ activePatientId: patientId, isManaging: !!patientId }),
            logout: () =>
                set({
                    token: null,
                    refreshToken: null,
                    user: null,
                    activePatientId: null,
                    isManaging: false,
                }),
            setHydrated: () => set({ isHydrated: true }),
        }),
        {
            name: "auth-store",
            storage: createJSONStorage(() => {
                if (typeof window === "undefined") {
                    return {
                        getItem: () => null,
                        setItem: () => {},
                        removeItem: () => {},
                    };
                }

                const safeStorage = {
                    getItem: (key: string) => {
                        try {
                            return localStorage.getItem(key);
                        } catch {
                            return null;
                        }
                    },
                    setItem: (key: string, value: string) => {
                        try {
                            localStorage.setItem(key, value);
                        } catch {
                            // ignore storage errors (e.g. private mode)
                        }
                    },
                    removeItem: (key: string) => {
                        try {
                            localStorage.removeItem(key);
                        } catch {
                            // ignore storage errors
                        }
                    },
                };

                return safeStorage;
            }),
            partialize: (s) => ({
                token: s.token,
                refreshToken: s.refreshToken,
                user: s.user,
            }),
            onRehydrateStorage: () => (state) => state?.setHydrated(),
        }
    )
);

export const useToken = () => useAuthStore((s) => s.token);
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuth = () => useAuthStore((s) => !!s.token);
export const useIsManaging = () => useAuthStore((s) => s.isManaging);
