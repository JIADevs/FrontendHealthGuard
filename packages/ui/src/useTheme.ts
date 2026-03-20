import { useColorScheme } from "react-native";
import { lightTheme, darkTheme, type AppTheme } from "./theme";

/**
 * Hook que devuelve los tokens semánticos según el esquema de color del sistema.
 * Funciona en React Native (Expo) y en Next.js con react-native-web.
 *
 * Uso:
 *   const { surface, text, border, mode } = useTheme();
 */
export function useTheme(): AppTheme & { mode: "light" | "dark" } {
  const scheme = useColorScheme();
  const mode = scheme === "dark" ? "dark" : "light";
  const theme = mode === "dark" ? darkTheme : lightTheme;
  return { ...theme, mode };
}
