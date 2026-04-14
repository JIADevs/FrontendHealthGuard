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

const memoryStorage = new Map<string, string>();
let _customStorage: any = null;

export const setStoreStorage = (storage: any) => {
    _customStorage = storage;
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
                if (_customStorage) return _customStorage;
                
                // Fallback para entornos sin window o sin localStorage (React Native)
                const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";
                
                if (!isBrowser) {
                    console.log("[AuthStore] Storage: Using memory fallback");
                    return {
                        getItem: (key) => memoryStorage.get(key) || null,
                        setItem: (key, value) => { memoryStorage.set(key, value); },
                        removeItem: (key) => { memoryStorage.delete(key); },
                    };
                }

                console.log("[AuthStore] Storage: Using window.localStorage");
                return window.localStorage;
            }),
            partialize: (s) => ({
                token: s.token,
                refreshToken: s.refreshToken,
                user: s.user,
                activePatientId: s.activePatientId,
            }),
            onRehydrateStorage: () => (state) => state?.setHydrated(),
        }
    )
);

export const useToken = () => useAuthStore((s) => s.token);
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuth = () => useAuthStore((s) => !!s.token);
export const useIsManaging = () => useAuthStore((s) => s.isManaging);
