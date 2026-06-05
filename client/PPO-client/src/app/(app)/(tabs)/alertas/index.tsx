import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { formatDate } from "@/helpers/formatDate";
import { useAuth } from "@/hooks/useAuth";
import { useSavedOpportunities } from "@/hooks/useSavedOpportunities";
import { ApiError } from "@/services/api/client";
import {
  cancelAlertNotification,
  scheduleAlertNotification,
} from "@/services/notifications/alertNotificationService";
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

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPickerDate(value: string) {
  return parseDateOnly(value) ?? getToday();
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
  const { signOut } = useAuth();
  const { error, isLoading, items, refresh, token } = useSavedOpportunities();
  const [draftDates, setDraftDates] = useState<Record<string, string>>({});
  const [activePickerId, setActivePickerId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
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
    if (!token) {
      return;
    }

    const draftDate = draftDates[item.id]?.trim() ?? "";
    const normalizedDate = draftDate;

    if (!normalizedDate) {
      setActionError("Informe um prazo para salvar o alerta.");
      return;
    }

    if (!parseDateOnly(normalizedDate)) {
      return;
    }

    try {
      setSavingId(item.id);
      setActionError("");
      const updatedItem = await updateSavedOpportunityAlert({
        id: item.id,
        input: {
          alertDate: normalizedDate,
          alertDone: false,
        },
        token,
      });
      await scheduleAlertNotification({
        ...item,
        alertDate: updatedItem.alertDate,
        alertDone: updatedItem.alertDone,
        savedAt: updatedItem.savedAt,
      });
      await refresh();
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await signOut();
        router.replace("/(auth)/login");
        return;
      }

      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível salvar o alerta.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleToggleDone(item: SavedOpportunity) {
    if (!token) {
      return;
    }

    try {
      setSavingId(item.id);
      setActionError("");
      const nextAlertDone = !item.alertDone;
      const updatedItem = await updateSavedOpportunityAlert({
        id: item.id,
        input: {
          alertDate: item.alertDate,
          alertDone: nextAlertDone,
        },
        token,
      });

      if (nextAlertDone) {
        await cancelAlertNotification(item.id);
      } else {
        await scheduleAlertNotification({
          ...item,
          alertDate: updatedItem.alertDate,
          alertDone: updatedItem.alertDone,
          savedAt: updatedItem.savedAt,
        });
      }

      await refresh();
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await signOut();
        router.replace("/(auth)/login");
        return;
      }

      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível atualizar o status do alerta.",
      );
    } finally {
      setSavingId(null);
    }
  }

  function handleDatePickerChange(
    itemId: string,
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) {
    if (Platform.OS !== "ios") {
      setActivePickerId(null);
    }

    if (event.type !== "set" || !selectedDate) {
      return;
    }

    setDraftDates((currentDrafts) => ({
      ...currentDrafts,
      [itemId]: formatDateOnly(selectedDate),
    }));
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

        {!isLoading && error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Tentar novamente" onPress={refresh} variant="secondary" />
          </View>
        ) : null}

        {!isLoading && actionError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.errorText}>{actionError}</Text>
          </View>
        ) : null}

        {!isLoading && !error && sortedItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhum edital salvo</Text>
            <Text style={styles.emptyText}>
              Salve um edital na tela de detalhe para criar alertas de prazo.
            </Text>
          </View>
        ) : null}

        {!isLoading && !error && sortedItems.length > 0 ? (
          <View style={styles.list}>
            {sortedItems.map((item) => {
              const status = getAlertStatus(item);
              const draftDate = draftDates[item.id] ?? "";
              const canToggleDone = !!item.alertDate;

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

                  <View style={styles.dateField}>
                    <Text style={styles.dateLabel}>Prazo</Text>
                    {Platform.OS === "web" ? (
                      <TextInput
                        {...({ type: "date" } as object)}
                        accessibilityLabel="Prazo do alerta"
                        onChangeText={(value) => {
                          setDraftDates((currentDrafts) => ({
                            ...currentDrafts,
                            [item.id]: value,
                          }));
                        }}
                        style={styles.dateInput}
                        value={draftDate}
                      />
                    ) : (
                      <>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setActivePickerId(item.id)}
                          style={({ pressed }) => [
                            styles.dateInput,
                            styles.dateButton,
                            pressed && styles.dateButtonPressed,
                          ]}
                        >
                          <Text style={draftDate ? styles.dateValue : styles.datePlaceholder}>
                            {draftDate ? formatDate(draftDate) : "Selecionar data"}
                          </Text>
                        </Pressable>
                        {activePickerId === item.id ? (
                          <DateTimePicker
                            display={Platform.OS === "ios" ? "inline" : "default"}
                            minimumDate={getToday()}
                            mode="date"
                            onChange={(event, selectedDate) => {
                              handleDatePickerChange(item.id, event, selectedDate);
                            }}
                            value={getPickerDate(draftDate)}
                          />
                        ) : null}
                      </>
                    )}
                  </View>

                  <View style={styles.actions}>
                    <Button
                      loading={savingId === item.id}
                      onPress={() => handleSaveDate(item)}
                      title="Salvar prazo"
                    />
                    <Button
                      disabled={!canToggleDone}
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
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typography.small,
    fontWeight: "700",
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
  dateField: {
    gap: theme.spacing.xs,
  },
  dateLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.small,
    fontWeight: "700",
  },
  dateInput: {
    minHeight: 48,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: theme.typography.body,
    paddingHorizontal: theme.spacing.md,
  },
  dateButton: {
    justifyContent: "center",
  },
  dateButtonPressed: {
    opacity: 0.82,
  },
  dateValue: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
  datePlaceholder: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
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
