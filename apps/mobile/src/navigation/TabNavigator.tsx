import { View, Text, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HomeScreen } from "../screens/HomeScreen";
import { DocumentsScreen } from "../screens/DocumentsScreen";
import { AgendaScreen } from "../screens/AgendaScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { BackpacksScreen } from "../screens/BackpacksScreen";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Folder,
} from "lucide-react-native";
import { useAuthStore } from "@helu/stores";
import {
  colors,
  palette,
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
} from "@helu/ui";

export type TabParamList = {
  Documents: undefined;
  Agenda: { initialTab?: "appointments" | "medications" } | undefined;
  Home: undefined;
  Backpacks: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// ─── Center Tab (Inicio) — elevated FAB-like icon ───────────────────────────

function CenterTabIcon({ focused }: { focused: boolean }) {
  const t = useAppTheme();
  return (
    <View
      style={[
        styles.centerTab,
        {
          backgroundColor: focused ? t.brand.fg : t.brand.tintText,
          shadowColor: t.brand.fg,
        },
      ]}
    >
      <LayoutDashboard size={24} color={colors.white} />
    </View>
  );
}

// ─── Profile Tab Icon — Airbnb-inspired avatar ──────────────────────────────

function ProfileTabIcon({ focused }: { focused: boolean }) {
  const user = useAuthStore((s) => s.user);
  const t = useAppTheme();

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    "U";

  return (
    <View
      style={[
        styles.profileAvatar,
        {
          backgroundColor: focused ? t.brand.fg : t.text.muted,
          borderColor: focused ? t.brand.tintBorder : colors.transparent,
        },
      ]}
    >
      <Text style={styles.profileAvatarText}>{initials}</Text>
    </View>
  );
}

// ─── Tab Navigator ───────────────────────────────────────────────────────────

export function TabNavigator() {
  const t = useAppTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: t.brand.fg,
        tabBarInactiveTintColor: t.text.muted,
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: fontWeight.medium,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: spacing[1],
          gap: 2,
        },
        tabBarStyle: {
          backgroundColor: t.surface.bgCard,
          borderTopWidth: 0,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          height: Platform.OS === "ios" ? 90 : 68,
          paddingBottom: Platform.OS === "ios" ? spacing[6] : spacing[2],
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
        component={DocumentsScreen}
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
          tabBarLabelStyle: {
            fontSize: fontSize.xs,
            fontWeight: fontWeight.bold,
            marginTop: spacing[1],
            color: t.brand.fg,
          },
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
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => <ProfileTabIcon focused={focused} />,
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
    // Glow shadow (color set inline via theme)
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
