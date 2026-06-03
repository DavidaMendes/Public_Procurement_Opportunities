import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { theme } from "@/theme";

const documents = [
  { name: "CNPJ e registro empresarial", status: "Pendente" },
  { name: "Certidões fiscais", status: "Pendente" },
  { name: "Regularidade trabalhista", status: "Pendente" },
  { name: "Atestados técnicos", status: "Opcional" },
];

export default function DocumentosScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Preparação</Text>
          <Text style={styles.title}>Documentos</Text>
          <Text style={styles.description}>
            Acompanhe os documentos mais comuns para participação em oportunidades públicas.
          </Text>
        </View>

        <View style={styles.list}>
          {documents.map((document) => (
            <View key={document.name} style={styles.item}>
              <Text style={styles.itemTitle}>{document.name}</Text>
              <Text style={styles.itemStatus}>{document.status}</Text>
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
  itemStatus: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: "700",
  },
});
