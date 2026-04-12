import { View, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DocumentsScreen } from "../screens/DocumentsScreen";
import { AgendaScreen } from "../screens/AgendaScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { LayoutDashboard, FileText, CalendarDays, Bell, Folder } from "lucide-react-native";
import { BackpacksScreen } from "../screens/BackpacksScreen";
import { useUnreadCount } from "@helu/stores";
import { colors, radii, fontSize, fontWeight, useAppTheme } from "@helu/ui";

export type TabParamList = {
  Dashboard: undefined;
  Documents: undefined;
  Backpacks: undefined;
  Agenda: undefined;
  Notifications: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function NotificationsBadge({ color, size }: { color: string; size: number }) {
  const count = useUnreadCount();
  return (
    <View>
      <Bell color={color} size={size} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
        </View>
      )}
    </View>
  );
}

export function TabNavigator() {
  const t = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.sky[500],
        tabBarInactiveTintColor: t.text.secondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.surface.bgCard,
          borderTopColor: t.border.medium,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          title: "Documentos",
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
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
        name="Agenda"
        component={AgendaScreen}
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: "Alertas",
          tabBarIcon: ({ color, size }) => <NotificationsBadge color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: radii.full,
    backgroundColor: colors.error[500],
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    lineHeight: 11,
  },
});
