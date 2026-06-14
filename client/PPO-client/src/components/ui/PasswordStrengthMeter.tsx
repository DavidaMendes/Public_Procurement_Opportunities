import { StyleSheet, Text, View } from "react-native";

import {
  PASSWORD_CRITERIA,
  evaluatePasswordStrength,
  type PasswordStrengthLevel,
} from "@/features/auth/passwordStrength";
import { theme } from "@/theme";

type PasswordStrengthMeterProps = {
  password: string;
};

const LEVEL_COLOR: Record<PasswordStrengthLevel, string> = {
  0: theme.colors.border,
  1: theme.colors.danger,
  2: "#B45309",
  3: theme.colors.primary,
};

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { checks, level, label } = evaluatePasswordStrength(password);

  if (!password) {
    return null;
  }

  const activeColor = LEVEL_COLOR[level];

  return (
    <View style={styles.container}>
      <View style={styles.barRow}>
        {[1, 2, 3].map((segment) => (
          <View
            key={segment}
            style={[
              styles.barSegment,
              { backgroundColor: segment <= level ? activeColor : theme.colors.surfaceMuted },
            ]}
          />
        ))}
      </View>
      {label ? (
        <Text style={[styles.label, { color: activeColor }]}>Força: {label}</Text>
      ) : null}
      <View style={styles.checklist}>
        {PASSWORD_CRITERIA.map((criterion) => {
          const met = checks[criterion.key];
          return (
            <Text
              key={criterion.key}
              style={[styles.criterion, met ? styles.criterionMet : styles.criterionPending]}
            >
              {met ? "✓" : "○"} {criterion.label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  barRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  barSegment: {
    flex: 1,
    height: 6,
    borderRadius: theme.radius.sm,
  },
  label: {
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  checklist: {
    gap: 2,
  },
  criterion: {
    fontSize: theme.typography.caption,
  },
  criterionMet: {
    color: theme.colors.primary,
  },
  criterionPending: {
    color: theme.colors.textMuted,
  },
});
