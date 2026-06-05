import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ContratacaoChecklist } from "@/components/contratacoes/ContratacaoChecklist";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { formatDate } from "@/helpers/formatDate";
import { useAuth } from "@/hooks/useAuth";
import { useContratacaoChecklist } from "@/hooks/useContratacaoChecklist";
import { ApiError } from "@/services/api/client";
import { getContratacao } from "@/services/contratacoes/contratacaoService";
import { cancelAlertNotification } from "@/services/notifications/alertNotificationService";
import {
  isOpportunitySaved,
  removeSavedOpportunity,
  saveOpportunity,
} from "@/services/saved-opportunities/savedOpportunityService";
import { theme } from "@/theme";
import type { ContratacaoDetail } from "@/types/contratacao";

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatText(value: string | number | null | undefined, fallback = "Não informado") {
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
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");

  const handleUnauthorized = useCallback(async () => {
    await signOut();
    router.replace("/(auth)/login");
  }, [router, signOut]);

  const {
    error: checklistError,
    isLoading: isChecklistLoading,
    items: checklistItems,
    progress: checklistProgress,
    retry: retryChecklist,
    toggleItem: toggleChecklistItem,
  } = useContratacaoChecklist({
    contratacaoId: id,
    onUnauthorized: handleUnauthorized,
    token,
  });

  const loadContratacao = useCallback(async () => {
    if (!token || !id) {
      setIsLoading(false);
      setError("Contratação não informada.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSaveError("");
      const response = await getContratacao({ id, token });
      setContratacao(response);
      setIsSaved(await isOpportunitySaved({ id: response.id, token }));
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await handleUnauthorized();
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar a contratação.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [handleUnauthorized, id, token]);

  useEffect(() => {
    loadContratacao();
  }, [loadContratacao]);

  async function handleToggleSaved() {
    if (!contratacao || !token) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveError("");

      if (isSaved) {
        await removeSavedOpportunity({ id: contratacao.id, token });
        await cancelAlertNotification(contratacao.id);
        setIsSaved(false);
        return;
      }

      await saveOpportunity({ id: contratacao.id, token });
      setIsSaved(true);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await handleUnauthorized();
        return;
      }

      setSaveError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível atualizar os salvos.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Button title="Voltar" onPress={() => router.back()} variant="ghost" style={styles.backButton} />

        {isLoading ? <Text style={styles.stateText}>Carregando contratação...</Text> : null}

        {!isLoading && error ? (
          <View style={styles.stateContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Tentar novamente" onPress={loadContratacao} variant="secondary" />
          </View>
        ) : null}

        {!isLoading && !error && contratacao ? (
          <>
            <View style={styles.header}>
              <Text style={styles.kicker}>Detalhe da contratação</Text>
              <Text style={styles.title}>{contratacao.objetoCompra}</Text>
              <Text style={styles.description}>
                {formatText(contratacao.orgaoEntidade.razaoSocial)}
              </Text>
              <Button
                title={isSaved ? "Remover dos salvos" : "Salvar edital"}
                loading={isSaving}
                onPress={handleToggleSaved}
                variant={isSaved ? "secondary" : "primary"}
              />
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Resumo</Text>
              <DetailRow label="Valor estimado" value={contratacao.valorTotalEstimado} />
              <DetailRow label="Modalidade" value={contratacao.modalidadeNome} />
              <DetailRow label="Processo" value={contratacao.processo} />
              <DetailRow label="Ano da compra" value={contratacao.anoCompra} />
              <DetailRow label="Controle PNCP" value={contratacao.numeroControlePNCP} />
            </View>

            {isChecklistLoading ? (
              <Text style={styles.stateText}>Carregando checklist...</Text>
            ) : (
              <>
                <ContratacaoChecklist
                  items={checklistItems}
                  progress={checklistProgress}
                  onToggleItem={toggleChecklistItem}
                />
                {checklistError ? (
                  <View style={styles.stateContainer}>
                    <Text style={styles.errorText}>{checklistError}</Text>
                    <Button title="Recarregar checklist" onPress={retryChecklist} variant="secondary" />
                  </View>
                ) : null}
              </>
            )}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Órgão</Text>
              <DetailRow label="Razão social" value={contratacao.orgaoEntidade.razaoSocial} />
              <DetailRow label="CNPJ" value={contratacao.orgaoEntidade.cnpj} />
              <DetailRow label="Poder" value={contratacao.orgaoEntidade.poderId} />
              <DetailRow label="Esfera" value={contratacao.orgaoEntidade.esferaId} />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Unidade</Text>
              <DetailRow label="Unidade" value={contratacao.unidadeOrgao.nomeUnidade} />
              <DetailRow label="Município" value={contratacao.unidadeOrgao.municipioNome} />
              <DetailRow label="UF" value={contratacao.unidadeOrgao.ufSigla} />
              <DetailRow label="UF nome" value={contratacao.unidadeOrgao.ufNome} />
              <DetailRow label="Código unidade" value={contratacao.unidadeOrgao.codigoUnidade} />
              <DetailRow label="Código IBGE" value={contratacao.unidadeOrgao.codigoIbge} />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Datas</Text>
              <DetailRow
                label="Inclusão"
                value={formatDate(contratacao.dataInclusao, "Não informado")}
              />
              <DetailRow
                label="Publicação PNCP"
                value={formatDate(contratacao.dataPublicacaoPncp, "Não informado")}
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
    gap: theme.spacing.md,
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
