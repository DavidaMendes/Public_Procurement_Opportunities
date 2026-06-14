import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/components/ui/Screen";
import { theme } from "@/theme";

export default function TermosScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.container}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()}>
          <Text style={styles.back}>← Voltar</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Termos de Uso</Text>
          <Text style={styles.meta}>Versão de consentimento: 1.0</Text>
        </View>

        <Text style={styles.paragraph}>
          Estes Termos de Uso regulam o acesso e a utilização do aplicativo de
          acompanhamento de oportunidades públicas. Ao criar uma conta, você
          declara que leu e concorda com as condições abaixo.
        </Text>

        <Text style={styles.sectionTitle}>1. Cadastro e conta</Text>
        <Text style={styles.paragraph}>
          Você é responsável pelas informações fornecidas no cadastro e por
          manter a confidencialidade da sua senha. Use uma senha forte e não a
          compartilhe com terceiros.
        </Text>

        <Text style={styles.sectionTitle}>2. Uso permitido</Text>
        <Text style={styles.paragraph}>
          O aplicativo deve ser utilizado apenas para fins lícitos de consulta e
          acompanhamento de oportunidades públicas. É vedado tentar burlar a
          autenticação ou sobrecarregar os serviços.
        </Text>

        <Text style={styles.sectionTitle}>3. Disponibilidade</Text>
        <Text style={styles.paragraph}>
          As informações de oportunidades são provenientes de fontes públicas e
          podem sofrer indisponibilidades temporárias. Não garantimos a
          completude ou atualidade em tempo real dos dados.
        </Text>

        <Text style={styles.sectionTitle}>4. Privacidade</Text>
        <Text style={styles.paragraph}>
          O tratamento dos seus dados pessoais segue a nossa Política de
          Privacidade, que faz parte integrante destes Termos.
        </Text>

        <Text style={styles.sectionTitle}>5. Alterações</Text>
        <Text style={styles.paragraph}>
          Estes Termos podem ser atualizados periodicamente. Mudanças
          relevantes serão comunicadas e poderão exigir um novo aceite.
        </Text>

        <Text style={styles.disclaimer}>
          Documento de caráter acadêmico, elaborado para fins de demonstração.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  back: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontWeight: "800",
    marginBottom: theme.spacing.sm,
  },
  header: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.title,
    fontWeight: "800",
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontWeight: "700",
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.subtitle,
    fontWeight: "800",
    marginTop: theme.spacing.sm,
  },
  paragraph: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  disclaimer: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    fontStyle: "italic",
    marginTop: theme.spacing.lg,
  },
});
