import { Redirect, Stack } from "expo-router";

import { SessionLoading } from "@/components/ui/SessionLoading";
import { useAuth } from "@/hooks/useAuth";
import { theme } from "@/theme";

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SessionLoading />;
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
