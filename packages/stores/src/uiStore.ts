import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { resolvePersistStorage } from "./persistStorage";

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
            theme: "light",
            sidebarOpen: true,
            setTheme: (theme) => set({ theme }),
            toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
        }),
        {
            name: "ui-store",
            storage: createJSONStorage(() => resolvePersistStorage("UiStore")),
        }
    )
);

export const useTheme = () => useUiStore((s) => s.theme);
