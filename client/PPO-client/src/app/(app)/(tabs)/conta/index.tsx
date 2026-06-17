import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { formatDate } from "@/helpers/formatDate";
import { useAuth } from "@/hooks/useAuth";
import { deleteMe, getMe, updateName } from "@/services/user/userService";
import { exportUserData } from "@/services/user/exportUserData";
import { theme } from "@/theme";
import type { MeResponse } from "@/types/user";

export default function ContaScreen() {
  const router = useRouter();
  const { token, signOut, clearSession } = useAuth();

  const [data, setData] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [nameInput, setNameInput] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameFeedback, setNameFeedback] = useState("");

  const [actionError, setActionError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMe = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setLoadError("");
      setIsLoading(true);
      const response = await getMe(token);
      setData(response);
      setNameInput(response.usuario.nome);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Não foi possível carregar seus dados.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  async function handleSaveName() {
    if (!token || !data) {
      return;
    }

    const nome = nameInput.trim();

    if (!nome || nome === data.usuario.nome) {
      return;
    }

    try {
      setActionError("");
      setNameFeedback("");
      setIsSavingName(true);
      const updated = await updateName({ token, nome });
      setData({ ...data, usuario: { ...data.usuario, nome: updated.nome } });
      setNameFeedback("Nome atualizado com sucesso.");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Não foi possível atualizar o nome.",
      );
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleExport() {
    if (!data) {
      return;
    }

    try {
      setActionError("");
      setIsExporting(true);
      await exportUserData(data);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Não foi possível exportar os dados.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  async function handleDelete() {
    if (!token) {
      return;
    }

    try {
      setActionError("");
      setIsDeleting(true);
      await deleteMe(token);
      await clearSession();
      router.replace("/(auth)/login");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Não foi possível excluir a conta.",
      );
      setIsDeleting(false);
    }
  }

  const canSaveName =
    !!data && !!nameInput.trim() && nameInput.trim() !== data.usuario.nome && !isSavingName;

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Privacidade</Text>
          <Text style={styles.title}>Meus dados</Text>
          <Text style={styles.description}>
            Acesse, corrija e gerencie seus dados pessoais conforme a LGPD.
          </Text>
        </View>

        {isLoading ? <Text style={styles.stateText}>Carregando seus dados...</Text> : null}
        {!isLoading && loadError ? <FormError message={loadError} /> : null}

        {!isLoading && data ? (
          <>
            <View style={styles.card}>
              <DataRow label="Nome" value={data.usuario.nome} />
              <DataRow label="E-mail" value={data.usuario.email} />
              <DataRow label="CNPJ" value={data.usuario.cnpj} />
              <DataRow
                label="Consentimento"
                value={`Versão ${data.usuario.consentVersion ?? "—"} • ${formatDate(
                  data.usuario.consentAt,
                  "—",
                )}`}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Editar nome</Text>
              <TextField
                label="Nome"
                value={nameInput}
                onChangeText={(value) => {
                  setNameInput(value);
                  setNameFeedback("");
                }}
                placeholder="Seu nome"
                textContentType="name"
              />
              {nameFeedback ? <Text style={styles.feedback}>{nameFeedback}</Text> : null}
              <Button
                title="Salvar nome"
                variant="secondary"
                loading={isSavingName}
                disabled={!canSaveName}
                onPress={handleSaveName}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ações</Text>
              {actionError ? <FormError message={actionError} /> : null}
              <Button
                title="Exportar meus dados (JSON)"
                variant="secondary"
                loading={isExporting}
                onPress={handleExport}
              />
              <Button
                title="Alterar senha"
                variant="secondary"
                onPress={() => router.push("/alterar-senha")}
              />
              <View style={styles.links}>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => router.push("/privacidade")}
                >
                  <Text style={styles.link}>Política de Privacidade</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => router.push("/termos")}
                >
                  <Text style={styles.link}>Termos de Uso</Text>
                </Pressable>
              </View>
              <Button title="Sair" variant="secondary" onPress={handleSignOut} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Zona de risco</Text>
              <Text style={styles.dangerHint}>
                A exclusão anonimiza seus dados pessoais e encerra a conta. Esta ação é
                irreversível.
              </Text>
              {confirmingDelete ? (
                <View style={styles.confirmRow}>
                  <Button
                    title="Confirmar exclusão"
                    loading={isDeleting}
                    onPress={handleDelete}
                    style={styles.dangerButton}
                  />
                  <Button
                    title="Cancelar"
                    variant="ghost"
                    onPress={() => setConfirmingDelete(false)}
                  />
                </View>
              ) : (
                <Button
                  title="Excluir minha conta"
                  onPress={() => setConfirmingDelete(true)}
                  style={styles.dangerButton}
                />
              )}
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xl,
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
  },
  card: {
    gap: theme.spacing.md,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  dataRow: {
    gap: 2,
  },
  dataLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dataValue: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "600",
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.subtitle,
    fontWeight: "800",
  },
  feedback: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: "600",
  },
  links: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
  },
  link: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontWeight: "800",
  },
  dangerHint: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    lineHeight: 20,
  },
  dangerButton: {
    backgroundColor: theme.colors.danger,
  },
  confirmRow: {
    gap: theme.spacing.sm,
  },
});
