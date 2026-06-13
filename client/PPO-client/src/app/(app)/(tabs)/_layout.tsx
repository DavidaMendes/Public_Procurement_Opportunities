import { Tabs } from "expo-router";

import { theme } from "@/theme";

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarIconStyle: {
          display: "none",
        },
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
          minHeight: 58,
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
        }}
      />
      <Tabs.Screen
        name="documentos/index"
        options={{
          title: "Documentos",
          tabBarLabel: "Documentos",
        }}
      />
      <Tabs.Screen
        name="alertas/index"
        options={{
          title: "Alertas",
          tabBarLabel: "Alertas",
        }}
      />
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
        }}
      />
      <Tabs.Screen
        name="conta/index"
        options={{
          title: "Conta",
          tabBarLabel: "Conta",
        }}
      />
    </Tabs>
  );
}
