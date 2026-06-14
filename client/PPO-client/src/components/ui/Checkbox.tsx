import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/theme";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Conteúdo do rótulo — pode incluir links (ex.: Política de Privacidade). */
  children: ReactNode;
  error?: string;
  accessibilityLabel?: string;
};

export function Checkbox({
  checked,
  onChange,
  children,
  error,
  accessibilityLabel,
}: CheckboxProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
        onPress={() => onChange(!checked)}
        style={styles.row}
      >
        <View
          style={[
            styles.box,
            checked && styles.boxChecked,
            error && !checked && styles.boxError,
          ]}
        >
          {checked ? <Text style={styles.check}>✓</Text> : null}
        </View>
        <View style={styles.labelWrapper}>{children}</View>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  boxError: {
    borderColor: theme.colors.danger,
  },
  check: {
    color: "#FFFFFF",
    fontSize: theme.typography.small,
    fontWeight: "800",
    lineHeight: 18,
  },
  labelWrapper: {
    flex: 1,
  },
  error: {
    color: theme.colors.danger,
    fontSize: theme.typography.small,
  },
});
