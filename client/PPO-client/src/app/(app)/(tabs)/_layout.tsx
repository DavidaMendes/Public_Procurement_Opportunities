import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "@/theme";

type TabIconProps = {
  color: string;
  size: number;
};

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarItemStyle: {
          paddingVertical: theme.spacing.sm,
        },
        tabBarLabelPosition: "below-icon",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
          lineHeight: 14,
        },
        tabBarStyle: {
          minHeight: 64,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.sm,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="oportunidades/index"
        options={{
          title: "Oportunidades",
          tabBarLabel: "Oportunidades",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="briefcase-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="documentos/index"
        options={{
          title: "Documentos",
          tabBarLabel: "Documentos",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="alertas/index"
        options={{
          title: "Alertas",
          tabBarLabel: "Alertas",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="notifications-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="stats-chart-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="conta/index"
        options={{
          title: "Conta",
          tabBarLabel: "Conta",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
