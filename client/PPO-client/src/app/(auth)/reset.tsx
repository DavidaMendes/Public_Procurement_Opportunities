import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { ResetPasswordFormData, resetPasswordSchema } from "@/features/auth/validation";
import { resetPassword } from "@/services/auth/authService";
import { theme } from "@/theme";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === "string" ? params.token : "";
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      novaSenha: "",
      confirmarSenha: "",
    },
  });

  const onSubmit: SubmitHandler<ResetPasswordFormData> = async (data) => {
    try {
      setFormError("");
      const response = await resetPassword({ token, novaSenha: data.novaSenha });
      setSuccessMessage(response.message);
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
        return;
      }

      setFormError("Não foi possível redefinir a senha.");
    }
  };

  if (!token) {
    return (
      <Screen>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Link inválido</Text>
            <Text style={styles.description}>
              Não encontramos o token de redefinição. Solicite um novo link de recuperação.
            </Text>
          </View>
          <Button
            title="Solicitar novo link"
            onPress={() => router.replace("/forgot-password")}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Redefinir senha</Text>
          <Text style={styles.description}>Escolha uma nova senha para a sua conta.</Text>
        </View>

        {successMessage ? (
          <View style={styles.successBlock}>
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
            <Button title="Ir para o login" onPress={() => router.replace("/(auth)/login")} />
          </View>
        ) : (
          <View style={styles.form}>
            <FormError message={formError} />
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
              title="Redefinir senha"
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
