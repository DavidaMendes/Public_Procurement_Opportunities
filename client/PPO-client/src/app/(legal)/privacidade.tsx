import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/components/ui/Screen";
import { theme } from "@/theme";

export default function PrivacidadeScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.container}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()}>
          <Text style={styles.back}>← Voltar</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Política de Privacidade</Text>
          <Text style={styles.meta}>Versão de consentimento: 1.0</Text>
        </View>

        <Text style={styles.paragraph}>
          Esta Política de Privacidade descreve como o aplicativo de
          acompanhamento de oportunidades públicas coleta, utiliza e protege os
          seus dados pessoais, em conformidade com a Lei Geral de Proteção de
          Dados (Lei nº 13.709/2018 — LGPD).
        </Text>

        <Text style={styles.sectionTitle}>1. Dados que coletamos</Text>
        <Text style={styles.paragraph}>
          Coletamos os dados informados no cadastro (nome, e-mail e CNPJ) e os
          dados gerados pelo uso do aplicativo, como checklists e oportunidades
          salvas. A senha é armazenada de forma criptografada e nunca é exibida.
        </Text>

        <Text style={styles.sectionTitle}>2. Como utilizamos os dados</Text>
        <Text style={styles.paragraph}>
          Os dados são utilizados para autenticar o seu acesso, personalizar o
          acompanhamento de oportunidades e enviar alertas que você configurar.
          Não vendemos os seus dados pessoais.
        </Text>

        <Text style={styles.sectionTitle}>3. Base legal e consentimento</Text>
        <Text style={styles.paragraph}>
          O tratamento dos dados de cadastro tem como base o seu consentimento,
          registrado no momento do cadastro junto com a versão desta política.
          Você pode revogar o consentimento a qualquer momento solicitando a
          exclusão da sua conta.
        </Text>

        <Text style={styles.sectionTitle}>4. Seus direitos (LGPD)</Text>
        <Text style={styles.paragraph}>
          Você pode, a qualquer momento, acessar e exportar seus dados,
          corrigir seu nome e solicitar a exclusão (anonimização) da sua conta
          diretamente na aba “Conta” do aplicativo.
        </Text>

        <Text style={styles.sectionTitle}>5. Retenção e exclusão</Text>
        <Text style={styles.paragraph}>
          Ao solicitar a exclusão, seus dados pessoais são anonimizados e as
          informações associadas à conta são removidas, mantendo-se apenas o
          necessário para fins legais.
        </Text>

        <Text style={styles.sectionTitle}>6. Contato</Text>
        <Text style={styles.paragraph}>
          Em caso de dúvidas sobre esta política ou sobre o tratamento dos seus
          dados, entre em contato com a equipe responsável pelo aplicativo.
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
