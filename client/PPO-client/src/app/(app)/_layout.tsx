import { Redirect, Stack } from "expo-router";
import { Text } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/hooks/useAuth";
import { theme } from "@/theme";

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Screen scroll={false}>
        <Text style={{ color: theme.colors.textMuted }}>Carregando sessao...</Text>
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
