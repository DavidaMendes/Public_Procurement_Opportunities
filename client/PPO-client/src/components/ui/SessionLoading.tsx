import { Text } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { theme } from "@/theme";

type SessionLoadingProps = {
  message?: string;
};

export function SessionLoading({ message = "Carregando sessão..." }: SessionLoadingProps) {
  return (
    <Screen scroll={false}>
      <Text style={{ color: theme.colors.textMuted }}>{message}</Text>
    </Screen>
  );
}
