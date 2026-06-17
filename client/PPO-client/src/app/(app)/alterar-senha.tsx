import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { ChangePasswordFormData, changePasswordSchema } from "@/features/auth/validation";
import { useAuth } from "@/hooks/useAuth";
import { changePassword } from "@/services/auth/authService";
import { theme } from "@/theme";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { token, clearSession } = useAuth();
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: "",
    },
  });

  const onSubmit: SubmitHandler<ChangePasswordFormData> = async (data) => {
    if (!token) {
      return;
    }

    try {
      setFormError("");
      const response = await changePassword({
        token,
        senhaAtual: data.senhaAtual,
        novaSenha: data.novaSenha,
      });
      // Sucesso: a API invalida o token atual. Mostramos a confirmação e o
      // usuário precisa entrar novamente.
      setSuccessMessage(response.message);
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
        return;
      }

      setFormError("Não foi possível alterar a senha.");
    }
  };

  async function handleGoToLogin() {
    await clearSession();
    router.replace("/(auth)/login");
  }

  return (
    <Screen>
      <View style={styles.container}>
        {!successMessage ? (
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()}>
            <Text style={styles.back}>← Voltar</Text>
          </Pressable>
        ) : null}

        <View style={styles.header}>
          <Text style={styles.title}>Alterar senha</Text>
          <Text style={styles.description}>
            Por segurança, você precisará entrar novamente após alterar a senha.
          </Text>
        </View>

        {successMessage ? (
          <View style={styles.successBlock}>
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
            <Button title="Ir para o login" onPress={handleGoToLogin} />
          </View>
        ) : (
          <View style={styles.form}>
            <FormError message={formError} />
            <Controller
              control={control}
              name="senhaAtual"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextField
                  error={errors.senhaAtual?.message}
                  label="Senha atual"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Sua senha atual"
                  secureTextEntry
                  textContentType="password"
                  value={value}
                />
              )}
            />
            <Controller
              control={control}
              name="novaSenha"
              render={({ field: { onBlur, onChange, value } }) => (
                <View style={styles.passwordField}>
                  <TextField
                    error={errors.novaSenha?.message}
                    label="Nova senha"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Mín. 8: maiúscula, minúscula, número e símbolo"
                    secureTextEntry
                    textContentType="newPassword"
                    value={value}
                  />
                  <PasswordStrengthMeter password={value} />
                </View>
              )}
            />
            <Controller
              control={control}
              name="confirmarSenha"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextField
                  error={errors.confirmarSenha?.message}
                  label="Confirmar nova senha"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Repita a nova senha"
                  secureTextEntry
                  textContentType="newPassword"
                  value={value}
                />
              )}
            />
            <Button
              title="Alterar senha"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.xxl,
  },
  back: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontWeight: "800",
  },
  header: {
    gap: theme.spacing.md,
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
  form: {
    gap: theme.spacing.lg,
  },
  passwordField: {
    gap: theme.spacing.sm,
  },
  successBlock: {
    gap: theme.spacing.lg,
  },
  successBox: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.successSurface,
    padding: theme.spacing.lg,
  },
  successText: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: "600",
    lineHeight: 20,
  },
});
