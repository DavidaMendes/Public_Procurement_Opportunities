import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { formatDate } from "@/helpers/formatDate";
import { useSavedOpportunities } from "@/hooks/useSavedOpportunities";
import { theme } from "@/theme";

export default function DashboardScreen() {
  const router = useRouter();
  const { isLoading, items } = useSavedOpportunities();

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Acompanhamento</Text>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.description}>
            Retome editais salvos e acompanhe oportunidades escolhidas para análise.
          </Text>
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryValue}>{items.length}</Text>
          <Text style={styles.summaryLabel}>
            {items.length === 1 ? "edital salvo" : "editais salvos"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Editais salvos</Text>

          {isLoading ? <Text style={styles.stateText}>Carregando editais salvos...</Text> : null}

          {!isLoading && items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhum edital salvo</Text>
              <Text style={styles.emptyText}>
                Abra uma contratação e toque em Salvar edital para acompanhá-la aqui.
              </Text>
            </View>
          ) : null}

          {!isLoading && items.length > 0 ? (
            <View style={styles.savedList}>
              {items.map((item) => (
                <Pressable
                  accessibilityRole="button"
                  key={item.id}
                  onPress={() => {
                    router.push({
                      pathname: "/(app)/contratacoes/[id]",
                      params: { id: item.id },
                    });
                  }}
                  style={({ pressed }) => [styles.savedItem, pressed && styles.savedItemPressed]}
                >
                  <Text style={styles.savedTitle}>{item.title}</Text>
                  <Text style={styles.savedText}>{item.organization}</Text>
                  <View style={styles.savedMeta}>
                    <Text style={styles.savedMetaText}>{item.estimatedValue}</Text>
                    <Text style={styles.savedMetaText}>{item.location}</Text>
                    <Text style={styles.savedMetaText}>Salvo em {formatDate(item.savedAt)}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
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
  summary: {
    alignSelf: "flex-start",
    minWidth: 148,
    gap: theme.spacing.xs,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  summaryValue: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.subtitle,
    fontWeight: "800",
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontWeight: "700",
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "800",
  },
  stateText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  emptyCard: {
    gap: theme.spacing.sm,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "800",
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    lineHeight: 20,
  },
  savedList: {
    gap: theme.spacing.md,
  },
  savedItem: {
    gap: theme.spacing.sm,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  savedItemPressed: {
    opacity: 0.82,
  },
  savedTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "800",
    lineHeight: 22,
  },
  savedText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    lineHeight: 20,
  },
  savedMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  savedMetaText: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: "700",
  },
});
