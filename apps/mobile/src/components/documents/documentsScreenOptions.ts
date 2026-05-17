import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { lightTheme } from "@helu/ui";

/** Opciones de stack con colores fijos en modo claro para pantallas del módulo documentos. */
export const documentsStackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: lightTheme.surface.bgCard },
  headerTintColor: lightTheme.brand.fg,
  headerTitleStyle: { color: lightTheme.text.primary },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: lightTheme.surface.bg },
};
