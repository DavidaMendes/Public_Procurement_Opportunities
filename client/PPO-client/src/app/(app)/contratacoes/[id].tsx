import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { formatDate } from "@/helpers/formatDate";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/services/api/client";
import { getContratacao } from "@/services/contratacoes/contratacaoService";
import { theme } from "@/theme";
import type { ContratacaoDetail } from "@/types/contratacao";

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatText(value: string | number | null | undefined, fallback = "Nao informado") {
  if (typeof value === "number") {
    return String(value);
  }

  return value?.trim() ? value : fallback;
}

type DetailRowProps = {
  label: string;
  value: string | number | null | undefined;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{formatText(value)}</Text>
    </View>
  );
}

export default function ContratacaoDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = getParamValue(params.id);
  const { signOut, token } = useAuth();
  const [contratacao, setContratacao] = useState<ContratacaoDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const handleUnauthorized = useCallback(async () => {
    await signOut();
    router.replace("/(auth)/login");
  }, [router, signOut]);

  const loadContratacao = useCallback(async () => {
    if (!token || !id) {
      setIsLoading(false);
      setError("Contratacao nao informada.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const response = await getContratacao({ id, token });
      setContratacao(response);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await handleUnauthorized();
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel carregar a contratacao.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [handleUnauthorized, id, token]);

  useEffect(() => {
    loadContratacao();
  }, [loadContratacao]);

  return (
    <Screen>
      <View style={styles.container}>
        <Button title="Voltar" onPress={() => router.back()} variant="ghost" style={styles.backButton} />

        {isLoading ? <Text style={styles.stateText}>Carregando contratacao...</Text> : null}

        {!isLoading && error ? (
          <View style={styles.stateContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Tentar novamente" onPress={loadContratacao} variant="secondary" />
          </View>
        ) : null}

        {!isLoading && !error && contratacao ? (
          <>
            <View style={styles.header}>
              <Text style={styles.kicker}>Detalhe da contratacao</Text>
              <Text style={styles.title}>{contratacao.objetoCompra}</Text>
              <Text style={styles.description}>
                {formatText(contratacao.orgaoEntidade.razaoSocial)}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Resumo</Text>
              <DetailRow label="Valor estimado" value={contratacao.valorTotalEstimado} />
              <DetailRow label="Modalidade" value={contratacao.modalidadeNome} />
              <DetailRow label="Processo" value={contratacao.processo} />
              <DetailRow label="Ano da compra" value={contratacao.anoCompra} />
              <DetailRow label="Controle PNCP" value={contratacao.numeroControlePNCP} />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Orgao</Text>
              <DetailRow label="Razao social" value={contratacao.orgaoEntidade.razaoSocial} />
              <DetailRow label="CNPJ" value={contratacao.orgaoEntidade.cnpj} />
              <DetailRow label="Poder" value={contratacao.orgaoEntidade.poderId} />
              <DetailRow label="Esfera" value={contratacao.orgaoEntidade.esferaId} />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Unidade</Text>
              <DetailRow label="Unidade" value={contratacao.unidadeOrgao.nomeUnidade} />
              <DetailRow label="Municipio" value={contratacao.unidadeOrgao.municipioNome} />
              <DetailRow label="UF" value={contratacao.unidadeOrgao.ufSigla} />
              <DetailRow label="UF nome" value={contratacao.unidadeOrgao.ufNome} />
              <DetailRow label="Codigo unidade" value={contratacao.unidadeOrgao.codigoUnidade} />
              <DetailRow label="Codigo IBGE" value={contratacao.unidadeOrgao.codigoIbge} />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Datas</Text>
              <DetailRow
                label="Inclusao"
                value={formatDate(contratacao.dataInclusao, "Nao informado")}
              />
              <DetailRow
                label="Publicacao PNCP"
                value={formatDate(contratacao.dataPublicacaoPncp, "Nao informado")}
              />
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.spacing.lg,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 0,
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
    fontSize: theme.typography.subtitle,
    fontWeight: "800",
    lineHeight: 28,
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  stateContainer: {
    gap: theme.spacing.lg,
  },
  stateText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  card: {
    gap: theme.spacing.md,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "800",
  },
  detailRow: {
    gap: theme.spacing.xs,
  },
  detailLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  detailValue: {
    color: theme.colors.text,
    fontSize: theme.typography.small,
    lineHeight: 20,
  },
});
