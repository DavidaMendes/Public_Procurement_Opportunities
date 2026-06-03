import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { theme } from "@/theme";

const alerts = [
  { title: "Revisar prazos das oportunidades", detail: "Verifique datas antes de preparar propostas." },
  { title: "Atualizar documentos", detail: "Mantenha certidões e comprovantes prontos para uso." },
  { title: "Conferir checklists", detail: "Revise itens pendentes nas contratações acompanhadas." },
];

export default function AlertasScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Acompanhamento</Text>
          <Text style={styles.title}>Alertas</Text>
          <Text style={styles.description}>
            Organize lembretes de preparação para não perder prazos importantes.
          </Text>
        </View>

        <View style={styles.list}>
          {alerts.map((alert) => (
            <View key={alert.title} style={styles.item}>
              <Text style={styles.itemTitle}>{alert.title}</Text>
              <Text style={styles.itemDetail}>{alert.detail}</Text>
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
  list: {
    gap: theme.spacing.md,
  },
  item: {
    gap: theme.spacing.sm,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  itemTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "800",
  },
  itemDetail: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    lineHeight: 20,
  },
});
