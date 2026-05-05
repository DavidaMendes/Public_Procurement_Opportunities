import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/theme";

type FormErrorProps = {
  message?: string;
};

export function FormError({ message }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.dangerSurface,
    padding: theme.spacing.lg,
  },
  text: {
    color: theme.colors.danger,
    fontSize: theme.typography.small,
    fontWeight: "600",
    lineHeight: 20,
  },
});
