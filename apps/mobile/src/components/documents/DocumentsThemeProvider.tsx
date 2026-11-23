import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { useAppTheme } from "@helu/ui";
import { useAuthStore } from "@helu/stores";

/** Sincroniza la barra de estado con el tema global en pantallas del módulo documentos. */
export function DocumentsThemeProvider({ children }: { children: ReactNode }) {
  const t = useAppTheme();
  // The management banner (module 8) sits under the status bar: keep its text white.
  const managing = useAuthStore((s) => s.isManaging);

  return (
    <>
      <StatusBar style={t.mode === "dark" || managing ? "light" : "dark"} />
      {children}
    </>
  );
}
