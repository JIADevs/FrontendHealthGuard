import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type { ThemeContextValue } from "@helu/ui";

/** Opciones de stack alineadas al tema activo (claro / oscuro). */
export function getDocumentsStackScreenOptions(
  t: ThemeContextValue,
): NativeStackNavigationOptions {
  return {
    headerStyle: { backgroundColor: t.surface.bgCard },
    headerTintColor: t.brand.fg,
    headerTitleStyle: { color: t.text.primary },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: t.surface.bg },
  };
}
