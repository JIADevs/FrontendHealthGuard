import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

type UiState = {
    theme: Theme;
    sidebarOpen: boolean;
    setTheme: (theme: Theme) => void;
    toggleSidebar: () => void;
};

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            theme: "system",
            sidebarOpen: true,
            setTheme: (theme) => set({ theme }),
            toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
        }),
        {
            name: "ui-store",
            storage: createJSONStorage(() =>
                typeof window !== "undefined" ? localStorage : {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                }
            ),
        }
    )
);

export const useTheme = () => useUiStore((s) => s.theme);
