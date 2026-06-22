import { View, Text, StyleSheet, Platform } from "react-native";
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
  useAppTheme,
} from "@helu/ui";

export type TabParamList = {
  Documents: undefined;
  Agenda: { initialTab?: "calendar" | "appointments" | "medications" | "cycles" | "wellbeing" } | undefined;
  Home: undefined;
  Backpacks: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const DocumentsScreenLight = withDocumentsTheme(DocumentsScreen);

// ─── Center Tab (Inicio) — elevated FAB-like icon ───────────────────────────

function CenterTabIcon({ focused }: { focused: boolean }) {
  const t = useAppTheme();
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
          tabBarLabelStyle: {
            fontSize: fontSize.xs,
            fontWeight: fontWeight.bold,
            marginTop: spacing[1],
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
