import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { lightTheme, darkTheme } from "./theme";
import type { AppTheme, ThemeMode } from "./theme";

export type ThemeContextValue = AppTheme & { mode: ThemeMode };

const ThemeContext = createContext<ThemeContextValue>({
  ...lightTheme,
  mode: "light",
});

type ThemePreference = "light" | "dark" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Manual override — when "system", follows OS color scheme */
  preference?: ThemePreference;
}

export function ThemeProvider({ children, preference = "system" }: ThemeProviderProps) {
  const scheme = useColorScheme();
  const osMode: ThemeMode = scheme === "dark" ? "dark" : "light";
  const mode: ThemeMode = preference === "system" ? osMode : preference;
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
