import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DocumentsScreen } from "../screens/DocumentsScreen";
import { AgendaScreen } from "../screens/AgendaScreen";
import { LayoutDashboard, FileText, CalendarDays } from "lucide-react-native";

export type TabParamList = {
  Dashboard: undefined;
  Documents: undefined;
  Agenda: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#0ea5e9", // primary-500
        tabBarInactiveTintColor: "#64748b", // slate-500
        headerShown: false,
        tabBarStyle: {
          borderTopColor: "#e2e8f0",
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
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          title: "Documentos",
          tabBarIcon: ({ color, size }) => (
            <FileText color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Agenda"
        component={AgendaScreen}
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, size }) => (
            <CalendarDays color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
