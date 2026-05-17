import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "@helu/ui";

/** Fuerza tema claro en todo el flujo de documentos (ignora preferencia global). */
export function DocumentsThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider preference="light">
      <StatusBar style="dark" />
      {children}
    </ThemeProvider>
  );
}
