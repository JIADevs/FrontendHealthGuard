import type { ReactNode } from "react";
import { View, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing, useAppTheme } from "@helu/ui";

interface AuthScreenLayoutProps {
  children: ReactNode;
  /** Barra inferior fija (Bienvenida); va fuera del scroll. */
  bottomBar?: ReactNode;
}

/**
 * Fondo de Acceso (m1 · kit `phone({bg:'linear-gradient(#E6EFFF,#F6F8FC 45%)'})`): tinte de marca
 * que se funde en el fondo a la altura del 45 %. Quieto: los bucles decorativos no están permitidos
 * (movimiento-interacciones.md §8).
 */
export function AuthScreenLayout({ children, bottomBar }: AuthScreenLayoutProps) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.surface.bg }}>
      <LinearGradient
        colors={[t.brand.tint, t.surface.bg]}
        locations={[0, 0.45]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            gap: spacing[4],
            paddingHorizontal: spacing[4],
            paddingTop: insets.top + spacing[4],
            paddingBottom: bottomBar ? spacing[4] : insets.bottom + spacing[6],
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        {bottomBar}
      </KeyboardAvoidingView>
    </View>
  );
}
