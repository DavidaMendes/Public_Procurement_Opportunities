import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { theme } from "@/theme";

const metrics = [
  { label: "Oportunidades", value: "Ativas" },
  { label: "Checklists", value: "Manual" },
  { label: "Documentos", value: "Pendente" },
  { label: "Alertas", value: "Base" },
];

export default function DashboardScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Resumo</Text>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.description}>
            Visão geral para acompanhar preparação, documentos e oportunidades.
          </Text>
        </View>

        <View style={styles.grid}>
          {metrics.map((metric) => (
            <View key={metric.label} style={styles.metric}>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.sm,
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.title,
    fontWeight: "800",
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  metric: {
    minWidth: 140,
    flex: 1,
    gap: theme.spacing.sm,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  metricValue: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.subtitle,
    fontWeight: "800",
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontWeight: "700",
  },
});
