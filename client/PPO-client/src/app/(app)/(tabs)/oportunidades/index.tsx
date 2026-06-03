import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ContratacaoFiltersForm } from "@/components/contratacoes/ContratacaoFiltersForm";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { formatDate } from "@/helpers/formatDate";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/services/api/client";
import {
  hasContratacaoFilters,
  initialContratacaoFilters,
  normalizeContratacaoFilters,
} from "@/services/contratacoes/contratacaoFilters";
import { listContratacoes } from "@/services/contratacoes/contratacaoService";
import { theme } from "@/theme";
import type { ContratacaoFilters, ContratacaoListItem } from "@/types/contratacao";

export default function OportunidadesScreen() {
  const router = useRouter();
  const { signOut, token } = useAuth();
  const [items, setItems] = useState<ContratacaoListItem[]>([]);
  const [filters, setFilters] = useState<ContratacaoFilters>(initialContratacaoFilters);
  const [appliedFilters, setAppliedFilters] = useState<ContratacaoFilters>(initialContratacaoFilters);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const isFiltering = hasContratacaoFilters(appliedFilters);

  const handleUnauthorized = useCallback(async () => {
    await signOut();
    router.replace("/(auth)/login");
  }, [router, signOut]);

  const loadPage = useCallback(
    async (pageToLoad: number, mode: "replace" | "append") => {
      if (!token) {
        return;
      }

      try {
        setError("");
        const response = await listContratacoes({
          filters: appliedFilters,
          page: pageToLoad,
          token,
        });

        if (mode === "replace") {
          setItems(response.data);
        } else {
          setItems((currentItems) => [...currentItems, ...response.data]);
        }

        setPage(response.page);
        setTotal(response.total);
        setTotalPages(response.totalPages);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          await handleUnauthorized();
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar as oportunidades.",
        );
      }
    },
    [appliedFilters, handleUnauthorized, token],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadInitialPage() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        await loadPage(1, "replace");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialPage();

    return () => {
      isMounted = false;
    };
  }, [loadPage, token]);

  async function loadNextPage() {
    if (!token || isLoading || isLoadingMore || page >= totalPages || error) {
      return;
    }

    try {
      setIsLoadingMore(true);
      await loadPage(page + 1, "append");
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  function handleApplyFilters() {
    setAppliedFilters(normalizeContratacaoFilters(filters));
  }

  function handleClearFilters() {
    setFilters(initialContratacaoFilters);
    setAppliedFilters(initialContratacaoFilters);
  }

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <FlatList
          contentContainerStyle={styles.listContent}
          data={isLoading || error ? [] : items}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <Button title="Sair" onPress={handleSignOut} variant="secondary" style={styles.signOutButton} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.kicker}>Área autenticada</Text>
                <Text style={styles.title}>Oportunidades</Text>
                <Text style={styles.description}>
                  {isFiltering
                    ? `${total} oportunidades encontradas`
                    : `${items.length} oportunidades carregadas`}
                </Text>
              </View>
              <ContratacaoFiltersForm
                filters={filters}
                isFiltering={isFiltering}
                onApply={handleApplyFilters}
                onChange={setFilters}
                onClear={handleClearFilters}
              />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.stateContainer}>
              {isLoading ? <Text style={styles.stateText}>Carregando oportunidades...</Text> : null}
              {!isLoading && error ? <Text style={styles.errorText}>{error}</Text> : null}
              {!isLoading && !error ? (
                <Text style={styles.stateText}>Nenhuma oportunidade encontrada.</Text>
              ) : null}
            </View>
          }
          ListFooterComponent={
            !isLoading && !error && items.length > 0 ? (
              <View style={styles.footer}>
                {isLoadingMore ? (
                  <Text style={styles.stateText}>Carregando mais oportunidades...</Text>
                ) : null}
                {!isLoadingMore && page >= totalPages ? (
                  <Text style={styles.stateText}>Todas as oportunidades foram carregadas.</Text>
                ) : null}
              </View>
            ) : null
          }
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.35}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                router.push({
                  pathname: "/(app)/contratacoes/[id]",
                  params: { id: item.id },
                });
              }}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemText}>{item.organization}</Text>
              <View style={styles.itemMeta}>
                <Text style={styles.itemMetaText}>{item.estimatedValue}</Text>
                <Text style={styles.itemMetaText}>
                  {formatDate(item.deadline, "Prazo não informado")}
                </Text>
              </View>
              <Text style={styles.itemAction}>Ver detalhes</Text>
            </Pressable>
          )}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  headerText: {
    gap: theme.spacing.sm,
  },
  signOutButton: {
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  stateContainer: {
    paddingVertical: theme.spacing.xl,
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
  listContent: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  footer: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  item: {
    gap: theme.spacing.sm,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  itemPressed: {
    opacity: 0.82,
  },
  itemTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "800",
    lineHeight: 22,
  },
  itemText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    lineHeight: 20,
  },
  itemMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  itemMetaText: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: "700",
  },
  itemAction: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontWeight: "800",
  },
});
