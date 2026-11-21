import type { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft } from "lucide-react-native";
import { IconButton, nativeFont, spacing, useAppTheme } from "@helu/ui";

interface ScreenHeaderProps {
  title: string;
  /** Línea secundaria bajo el título (por ejemplo el medicamento de un ciclo). */
  subtitle?: string;
  /** Acción a la derecha: un `IconButton` de 44 px. */
  right?: ReactNode;
  /** Por defecto vuelve atrás con la navegación. */
  onBack?: () => void;
}

/**
 * Cabecera de pantallas de detalle y formulario (kit `mback` de los mockups v2):
 * botón redondo de 44 px para volver, título H3 de 18 px a la izquierda y una acción opcional.
 */
export function ScreenHeader({ title, subtitle, right, onBack }: ScreenHeaderProps) {
  const t = useAppTheme();
  const navigation = useNavigation();
  return (
    <View style={[styles.header, { backgroundColor: t.surface.bg }]}>
      <IconButton
        icon={<ChevronLeft size={20} strokeWidth={2.4} color={t.text.primary} />}
        accessibilityLabel="Volver"
        onPress={onBack ?? (() => navigation.goBack())}
      />
      <View style={styles.titles}>
        <Text style={[styles.title, { color: t.text.primary }]} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: t.text.secondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  titles: { flex: 1 },
  title: { fontSize: 18, fontFamily: nativeFont("heading", 800) },
  subtitle: { fontSize: 13, fontFamily: nativeFont("body", 400) },
});
