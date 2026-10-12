import { useMemo, useCallback, useState } from "react";
import { View, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Pill,
  Activity,
  Share2,
  Users,
  Bell,
  ShieldCheck,
  HelpCircle,
  LogOut,
  Settings,
} from "lucide-react-native";
import { useAuthStore } from "@helu/stores";
import { isDelegationInbound } from "@helu/api";
import {
  useProfileQuery,
  useMedicationsQuery,
  useTreatmentsQuery,
  useManagedUsersQuery,
  useManagersQuery,
} from "@helu/api/hooks";
import { palette, spacing, useAppTheme, Typography } from "@helu/ui";
import { ProfileCard, MenuItem, MenuSection } from "../components/more";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { LINKED_PEOPLE_SCREEN_TITLE } from "../constants/linkedPeople";
import { unregisterDevicePushToken } from "../services/pushTokenRegistration";

export function MoreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useAppTheme();

  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const storeUserEmail = useAuthStore((s) => s.user?.email);
  const profile = useProfileQuery();
  const userEmail = (profile.data?.email ?? storeUserEmail ?? "").toLowerCase();
  const medications = useMedicationsQuery();
  const treatments = useTreatmentsQuery(1, 100);
  const managedQuery = useManagedUsersQuery();
  const managersQuery = useManagersQuery();

  useFocusEffect(
    useCallback(() => {
      managedQuery.refetch();
      managersQuery.refetch();
    }, []),
  );

  const activeMedsCount = useMemo(() => {
    if (!medications.data?.items) return 0;
    return medications.data.items.filter((m: any) => m.active).length;
  }, [medications.data]);

  const pendingDelegationsCount = useMemo(() => {
    const inboundManaged = (managedQuery.data ?? []).filter(
      (d) => d.status === "PENDING" && isDelegationInbound(d, userEmail),
    ).length;
    const inboundManagers = (managersQuery.data ?? []).filter(
      (m) => m.status === "PENDING" && isDelegationInbound(m, userEmail),
    ).length;
    return inboundManaged + inboundManagers;
  }, [managedQuery.data, managersQuery.data, userEmail]);

  const profileLoading =
    profile.isPending || (profile.isFetching && !profile.data);

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
            setLoggingOut(true);
            // Unregister while the auth header is still present — a best-effort
            // accelerator for the server-side reassign-on-register (no toast on
            // failure: logout must always succeed locally, deviation documented
            // in openspec/changes/push-notification-fixes/design.md).
            void unregisterDevicePushToken().finally(() => {
              queryClient.clear();
              logout();
            });
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

        {profileLoading ? (
          <View
            style={{
              padding: spacing[4],
              borderRadius: 12,
              backgroundColor: t.surface.bgCard,
              marginBottom: spacing[4],
              alignItems: "center",
              justifyContent: "center",
              minHeight: 84,
            }}
          >
            <ActivityIndicator size="small" color={palette.brand[500]} />
          </View>
        ) : (
          <ProfileCard
            initials={initials}
            name={profile.data?.name || "Sin nombre"}
            email={profile.data?.email ?? ""}
            onPress={() => navigation.navigate("Profile", { backTitle: "Más" })}
          />
        )}

        <MenuSection>
          <MenuItem
            icon={<Pill size={20} color={palette.status.warning[500]} />}
            label="Medicamentos"
            badge={activeMedsCount > 0 ? `${activeMedsCount} activos` : undefined}
            onPress={() => navigation.navigate("MainTabs", { screen: "Agenda", params: { initialTab: "medications" } } as any)}
          />
          <MenuItem
            icon={<Activity size={20} color={palette.brand[500]} />}
            label="Tratamientos"
            badge={treatments.data?.total ? `${treatments.data.total}` : undefined}
            onPress={() => navigation.navigate("Treatments", { backTitle: "Más" })}
          />
          <MenuItem
            icon={<Share2 size={20} color={palette.brand[500]} />}
            label="Compartidos"
            onPress={() => navigation.navigate("SharedHistory", { backTitle: "Más" })}
          />
          <MenuItem
            icon={<Users size={20} color={palette.brand[600]} />}
            label={LINKED_PEOPLE_SCREEN_TITLE}
            badge={pendingDelegationsCount > 0 ? pendingDelegationsCount : undefined}
            onPress={() => navigation.navigate("Dependientes", { backTitle: "Más" })}
            last
          />
        </MenuSection>

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

        <MenuSection>
          <MenuItem
            icon={<HelpCircle size={20} color={t.text.secondary} />}
            label="Ayuda"
            onPress={showComingSoon}
            last
          />
        </MenuSection>

        <MenuSection>
          <MenuItem
            icon={
              loggingOut ? (
                <ActivityIndicator size="small" color={palette.status.error[500]} />
              ) : (
                <LogOut size={20} color={palette.status.error[500]} />
              )
            }
            label="Cerrar sesión"
            onPress={loggingOut ? () => {} : handleLogout}
            danger
            last
          />
        </MenuSection>
      </ScrollView>
    </SafeAreaView>
  );
}
