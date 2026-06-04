import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { formatDate } from "@/helpers/formatDate";
import { useSavedOpportunities } from "@/hooks/useSavedOpportunities";
import { updateSavedOpportunityAlert } from "@/services/saved-opportunities/savedOpportunityService";
import { theme } from "@/theme";
import type { SavedOpportunity } from "@/types/savedOpportunity";

type AlertStatus = "done" | "overdue" | "soon" | "scheduled" | "missing";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateOnly(value: string | null) {
  if (!value || !DATE_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getAlertStatus(item: SavedOpportunity): AlertStatus {
  if (item.alertDone) {
    return "done";
  }

  const alertDate = parseDateOnly(item.alertDate);

  if (!alertDate) {
    return "missing";
  }

  const today = getToday();
  const daysUntilAlert = Math.ceil((alertDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (daysUntilAlert < 0) {
    return "overdue";
  }

  if (daysUntilAlert <= 7) {
    return "soon";
  }

  return "scheduled";
}

function getStatusLabel(status: AlertStatus) {
  const labels: Record<AlertStatus, string> = {
    done: "Concluído",
    missing: "Sem prazo",
    overdue: "Vencido",
    scheduled: "Agendado",
    soon: "Próximo",
  };

  return labels[status];
}

function getStatusStyle(status: AlertStatus) {
  if (status === "overdue") {
    return styles.statusDanger;
  }

  if (status === "soon") {
    return styles.statusWarning;
  }

  if (status === "done") {
    return styles.statusDone;
  }

  return styles.statusNeutral;
}

function sortAlerts(items: SavedOpportunity[]) {
  const priority: Record<AlertStatus, number> = {
    overdue: 0,
    soon: 1,
    scheduled: 2,
    missing: 3,
    done: 4,
  };

  return [...items].sort((a, b) => {
    const statusA = getAlertStatus(a);
    const statusB = getAlertStatus(b);
    const priorityDiff = priority[statusA] - priority[statusB];

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    const dateA = parseDateOnly(a.alertDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const dateB = parseDateOnly(b.alertDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;

    return dateA - dateB;
  });
}

export default function AlertasScreen() {
  const router = useRouter();
  const { isLoading, items, refresh } = useSavedOpportunities();
  const [draftDates, setDraftDates] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const sortedItems = useMemo(() => sortAlerts(items), [items]);

  useEffect(() => {
    setDraftDates((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };

      items.forEach((item) => {
        if (nextDrafts[item.id] === undefined) {
          nextDrafts[item.id] = item.alertDate ?? "";
        }
      });

      return nextDrafts;
    });
  }, [items]);

  async function handleSaveDate(item: SavedOpportunity) {
    const draftDate = draftDates[item.id]?.trim() ?? "";
    const normalizedDate = draftDate || null;

    if (normalizedDate && !parseDateOnly(normalizedDate)) {
      return;
    }

    try {
      setSavingId(item.id);
      await updateSavedOpportunityAlert(item.id, {
        alertDate: normalizedDate,
        alertDone: false,
      });
      await refresh();
    } finally {
      setSavingId(null);
    }
  }

  async function handleToggleDone(item: SavedOpportunity) {
    try {
      setSavingId(item.id);
      await updateSavedOpportunityAlert(item.id, {
        alertDone: !item.alertDone,
      });
      await refresh();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Acompanhamento</Text>
          <Text style={styles.title}>Alertas</Text>
          <Text style={styles.description}>
            Defina prazos para editais salvos e acompanhe o que está próximo, vencido ou concluído.
          </Text>
        </View>

        {isLoading ? <Text style={styles.stateText}>Carregando alertas...</Text> : null}

        {!isLoading && sortedItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhum edital salvo</Text>
            <Text style={styles.emptyText}>
              Salve um edital na tela de detalhe para criar alertas de prazo.
            </Text>
          </View>
        ) : null}

        {!isLoading && sortedItems.length > 0 ? (
          <View style={styles.list}>
            {sortedItems.map((item) => {
              const status = getAlertStatus(item);
              const draftDate = draftDates[item.id] ?? "";
              const hasInvalidDate = !!draftDate.trim() && !parseDateOnly(draftDate.trim());

              return (
                <View key={item.id} style={styles.item}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTitleGroup}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemDetail}>{item.organization}</Text>
                    </View>
                    <View style={[styles.statusBadge, getStatusStyle(status)]}>
                      <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
                    </View>
                  </View>

                  <View style={styles.meta}>
                    <Text style={styles.metaText}>{item.estimatedValue}</Text>
                    <Text style={styles.metaText}>{item.location}</Text>
                    <Text style={styles.metaText}>
                      {item.alertDate ? `Prazo ${formatDate(item.alertDate)}` : "Prazo não definido"}
                    </Text>
                  </View>

                  <TextField
                    error={hasInvalidDate ? "Use o formato YYYY-MM-DD." : undefined}
                    keyboardType="numbers-and-punctuation"
                    label="Prazo"
                    onChangeText={(value) => {
                      setDraftDates((currentDrafts) => ({
                        ...currentDrafts,
                        [item.id]: value,
                      }));
                    }}
                    placeholder="2026-06-30"
                    value={draftDate}
                  />

                  <View style={styles.actions}>
                    <Button
                      disabled={hasInvalidDate}
                      loading={savingId === item.id}
                      onPress={() => handleSaveDate(item)}
                      title="Salvar prazo"
                    />
                    <Button
                      loading={savingId === item.id}
                      onPress={() => handleToggleDone(item)}
                      title={item.alertDone ? "Reabrir" : "Concluir"}
                      variant="secondary"
                    />
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        router.push({
                          pathname: "/(app)/contratacoes/[id]",
                          params: { id: item.id },
                        });
                      }}
                    >
                      <Text style={styles.link}>Ver edital</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
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
  list: {
    gap: theme.spacing.md,
  },
  item: {
    gap: theme.spacing.md,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  itemTitleGroup: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  itemTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "800",
    lineHeight: 22,
  },
  itemDetail: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    lineHeight: 20,
  },
  statusBadge: {
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  statusNeutral: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  statusDanger: {
    backgroundColor: theme.colors.dangerSurface,
  },
  statusWarning: {
    backgroundColor: "#FEF3C7",
  },
  statusDone: {
    backgroundColor: theme.colors.successSurface,
  },
  statusText: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    fontWeight: "800",
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  metaText: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: "700",
  },
  actions: {
    gap: theme.spacing.md,
  },
  link: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontWeight: "800",
    textAlign: "center",
  },
});
