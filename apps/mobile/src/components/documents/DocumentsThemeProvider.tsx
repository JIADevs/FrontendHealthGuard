import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { useAppTheme } from "@helu/ui";

/** Sincroniza la barra de estado con el tema global en pantallas del módulo documentos. */
export function DocumentsThemeProvider({ children }: { children: ReactNode }) {
  const t = useAppTheme();

  return (
    <>
      <StatusBar style={t.mode === "dark" ? "light" : "dark"} />
      {children}
    </>
  );
}
