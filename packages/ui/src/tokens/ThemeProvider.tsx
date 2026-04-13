import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { lightTheme, darkTheme } from "./theme";
import type { AppTheme, ThemeMode } from "./theme";

export type ThemeContextValue = AppTheme & { mode: ThemeMode };

const ThemeContext = createContext<ThemeContextValue>({
  ...lightTheme,
  mode: "light",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const mode: ThemeMode = scheme === "dark" ? "dark" : "light";
  const theme = mode === "dark" ? darkTheme : lightTheme;
  const value: ThemeContextValue = {
    surface: { ...theme.surface },
    text:    { ...theme.text },
    border:  { ...theme.border },
    mode,
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
