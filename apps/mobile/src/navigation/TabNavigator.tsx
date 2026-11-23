import { View, Text, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HomeScreen } from "../screens/HomeScreen";
import { DocumentsScreen } from "../screens/DocumentsScreen";
import { withDocumentsTheme } from "../components/documents";
import { AgendaScreen } from "../screens/AgendaScreen";
import { MoreScreen } from "../screens/MoreScreen";
import { BackpacksScreen } from "../screens/BackpacksScreen";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Folder,
  Menu,
} from "lucide-react-native";
import { useAuthStore } from "@helu/stores";
import {
  colors,
  palette,
  radii,
  spacing,
  fontSize,
  fontWeight,
  nativeFont,
  useAppTheme,
} from "@helu/ui";
import { useManagedUsersQuery, useDelegationContextColorsQuery } from "@helu/api/hooks";
import { resolveDelegationRingColor } from "../components/dependientes/colorTokens";
import { initialsOf } from "../components/dependientes/PersonCard";
import { usePatientContextGuard } from "../hooks/usePatientContextGuard";
import { TabSceneFade } from "./TabSceneFade";

import type { AgendaRouteParams } from "./RootNavigator";

export type TabParamList = {
  Documents: undefined;
  Agenda: AgendaRouteParams | undefined;
  Home: undefined;
  Backpacks: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const DocumentsScreenLight = withDocumentsTheme(DocumentsScreen);

// ─── Center Tab (Inicio) — elevated FAB-like icon ───────────────────────────

function CenterTabIcon({ focused }: { focused: boolean }) {
  const t = useAppTheme();
  const isManaging = useAuthStore((s) => s.isManaging);
  const activePatientId = useAuthStore((s) => s.activePatientId);
  const managedQuery = useManagedUsersQuery();
  const contextColorsQuery = useDelegationContextColorsQuery();

  if (isManaging && activePatientId) {
    const managed = managedQuery.data ?? [];
    const activeIdx = managed.findIndex(
      (d) => (d.dependentUserId ?? d.id) === activePatientId,
    );
    const activeDelegate = activeIdx >= 0 ? managed[activeIdx] : undefined;
    const contextColors = contextColorsQuery.data ?? {};
    const ringColor = resolveDelegationRingColor(
      contextColors,
      activePatientId,
      activeIdx >= 0 ? activeIdx : 0,
    );
    const isDelegateLoading =
      managedQuery.isPending ||
      (managedQuery.isFetching && !activeDelegate);

    if (isDelegateLoading) {
      return (
        <View
          style={[
            styles.centerTab,
            {
              backgroundColor: focused ? t.brand.fg : t.text.muted,
              borderWidth: 3,
              borderColor: ringColor,
            },
          ]}
        >
          <ActivityIndicator size="small" color={colors.white} />
        </View>
      );
    }

    const name = activeDelegate?.linkedUserName ?? activeDelegate?.linkedUserEmail ?? "";
    const initials = name ? initialsOf(name) : "?";

    return (
      <View
        style={[
          styles.centerTab,
          {
            backgroundColor: focused ? t.brand.fg : t.text.muted,
            borderWidth: 3,
            borderColor: ringColor,
            shadowColor: ringColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 6,
          },
        ]}
      >
        <Text style={styles.centerTabInitials}>{initials}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.centerTab,
        focused
          ? {
              backgroundColor: t.brand.fg,
              shadowColor: t.brand.fg,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }
          : { backgroundColor: t.text.muted },
      ]}
    >
      <LayoutDashboard size={24} color={colors.white} />
    </View>
  );
}
// ─── Tab Navigator ───────────────────────────────────────────────────────────

export function TabNavigator() {
  usePatientContextGuard();
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  // En Android con navegación por botones (back/circle/square), la barra del
  // sistema no siempre se refleja en el inset, así que garantizamos un mínimo.
  const bottomInset =
    Platform.OS === "ios" ? insets.bottom : Math.max(insets.bottom, spacing[2]);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      // Sibling tabs: the new one fades in over 150 ms, no slide (movimiento-interacciones.md §3).
      // The fade runs in TabSceneFade (Reanimated); the navigator's own "fade" could leave Inicio
      // blank after fast switching on a real iPhone.
      screenLayout={({ navigation, route, children }) => (
        <TabSceneFade navigation={navigation} routeKey={route.key}>
          {children}
        </TabSceneFade>
      )}
      screenOptions={{
        tabBarActiveTintColor: t.brand.fg,
        tabBarInactiveTintColor: t.text.muted,
        headerShown: false,
        // Kit `.tab`: Inter 500 11 px, never cut. With larger system text «Documentos» showed as
        // «Document…»: the label shrinks just enough to fit its tab instead of truncating.
        tabBarLabel: ({ color, children }) => (
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={{
              color,
              fontSize: fontSize.xs,
              fontFamily: nativeFont("body", children === "Inicio" ? 600 : 500),
              marginTop: children === "Inicio" ? spacing[1] : 2,
            }}
          >
            {children}
          </Text>
        ),
        tabBarItemStyle: {
          paddingVertical: spacing[1],
          gap: 2,
        },
        tabBarStyle: {
          backgroundColor: t.surface.bgCard,
          borderTopWidth: 0,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: spacing[2],
          paddingHorizontal: spacing[2],
          // Elevated shadow
          elevation: 12,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        },
      }}
    >
      <Tab.Screen
        name="Documents"
        component={DocumentsScreenLight}
        options={{
          title: "Documentos",
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Agenda"
        component={AgendaScreen}
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => <CenterTabIcon focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Backpacks"
        component={BackpacksScreen}
        options={{
          title: "Mochilas",
          tabBarIcon: ({ color, size }) => <Folder color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          title: "Más",
          tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centerTab: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
  },
  centerTabInitials: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    lineHeight: 16,
  },
  profileAvatar: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  profileAvatarText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: fontWeight.bold,
    lineHeight: 12,
  },
});
