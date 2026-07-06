import { useMemo, useCallback } from "react";
import { View, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Pill,
  Share2,
  Users,
  Bell,
  ShieldCheck,
  HelpCircle,
  LogOut,
  Settings,
} from "lucide-react-native";
import { useAuthStore } from "@helu/stores";
import { useProfileQuery, useMedicationsQuery } from "@helu/api/hooks";
import { palette, spacing, useAppTheme, Typography } from "@helu/ui";
import { ProfileCard, MenuItem, MenuSection } from "../components/more";
import type { RootStackParamList } from "../navigation/RootNavigator";

// ─── Screen ──────────────────────────────────────────────────────────────────

export function MoreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useAppTheme();

  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  const profile = useProfileQuery();
  const medications = useMedicationsQuery();

  const activeMedsCount = useMemo(() => {
    if (!medications.data?.items) return 0;
    return medications.data.items.filter((m: any) => m.active).length;
  }, [medications.data]);

  const initials =
    profile.data?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ??
    profile.data?.email?.[0]?.toUpperCase() ??
    "U";

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: () => {
            queryClient.clear();
            logout();
          },
        },
      ],
    );
  }, [logout, queryClient]);

  const showComingSoon = useCallback(() => {
    Alert.alert("Próximamente", "Esta función estará disponible pronto.");
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.surface.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10] }}>
        <View style={{ marginBottom: spacing[4] }}>
          <Typography variant="h2">Más</Typography>
        </View>

        <ProfileCard
          initials={initials}
          name={profile.data?.name || "Sin nombre"}
          email={profile.data?.email ?? ""}
          onPress={() => navigation.navigate("Profile", { backTitle: "Más" })}
        />

        {/* Funciones */}
        <MenuSection>
          <MenuItem
            icon={<Pill size={20} color={palette.status.warning[500]} />}
            label="Medicamentos"
            badge={activeMedsCount > 0 ? `${activeMedsCount} activos` : undefined}
            onPress={() => navigation.navigate("MainTabs", { screen: "Agenda", params: { initialTab: "medications" } } as any)}
          />
          <MenuItem
            icon={<Share2 size={20} color={palette.brand[500]} />}
            label="Compartidos"
            onPress={() => navigation.navigate("SharedHistory", { backTitle: "Más" })}
          />
          <MenuItem
            icon={<Users size={20} color={palette.brand[600]} />}
            label="Dependientes"
            onPress={showComingSoon}
            last
          />
        </MenuSection>

        {/* Configuración */}
        <MenuSection>
          <MenuItem
            icon={<Bell size={20} color={t.text.secondary} />}
            label="Notificaciones"
            onPress={() => navigation.navigate("Notifications", { backTitle: "Más" })}
          />
          <MenuItem
            icon={<Settings size={20} color={t.text.secondary} />}
            label="Configuraciones"
            onPress={() => navigation.navigate("Settings", { backTitle: "Más" })}
          />
          <MenuItem
            icon={<ShieldCheck size={20} color={t.text.secondary} />}
            label="Privacidad y seguridad"
            onPress={showComingSoon}
            last
          />
        </MenuSection>

        {/* Soporte */}
        <MenuSection>
          <MenuItem
            icon={<HelpCircle size={20} color={t.text.secondary} />}
            label="Ayuda"
            onPress={showComingSoon}
            last
          />
        </MenuSection>

        {/* Logout */}
        <MenuSection>
          <MenuItem
            icon={<LogOut size={20} color={palette.status.error[500]} />}
            label="Cerrar sesión"
            onPress={handleLogout}
            danger
            last
          />
        </MenuSection>
      </ScrollView>
    </SafeAreaView>
  );
}
