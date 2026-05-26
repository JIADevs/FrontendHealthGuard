import type { ComponentType } from "react";
import { DocumentsThemeProvider } from "./DocumentsThemeProvider";

export function withDocumentsTheme<P extends object>(Screen: ComponentType<P>) {
  function Wrapped(props: P) {
    return (
      <DocumentsThemeProvider>
        <Screen {...props} />
      </DocumentsThemeProvider>
    );
  }
  Wrapped.displayName = `WithDocumentsTheme(${Screen.displayName ?? Screen.name ?? "Screen"})`;
  return Wrapped;
}
