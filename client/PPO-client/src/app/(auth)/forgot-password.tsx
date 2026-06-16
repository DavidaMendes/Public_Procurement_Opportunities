import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { ForgotPasswordFormData, forgotPasswordSchema } from "@/features/auth/validation";
import { forgotPassword } from "@/services/auth/authService";
import { theme } from "@/theme";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormData> = async (data) => {
    try {
      setFormError("");
      const response = await forgotPassword(data.email.trim().toLowerCase());

      if (__DEV__ && response.resetToken) {
        // Em desenvolvimento a API devolve o token para facilitar o teste.
        console.log("[DEV] resetToken:", response.resetToken);
      }

      setSuccessMessage(response.message);
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
        return;
      }

      setFormError("Não foi possível enviar a recuperação.");
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Esqueci minha senha</Text>
          <Text style={styles.description}>
            Informe o e-mail da sua conta e enviaremos as instruções para redefinir a senha.
          </Text>
        </View>

        {successMessage ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : (
          <View style={styles.form}>
            <FormError message={formError} />
            <Controller
              control={control}
              name="email"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextField
                  autoCapitalize="none"
                  error={errors.email?.message}
                  keyboardType="email-address"
                  label="E-mail"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="voce@email.com"
                  textContentType="emailAddress"
                  value={value}
                />
              )}
            />
            <Button
              title="Enviar instruções"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Lembrou a senha?</Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={styles.link}>Entrar</Text>
          </Pressable>
        </View>
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
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
  },
  link: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontWeight: "800",
  },
});
