import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { RegisterFormData, registerSchema } from "@/features/auth/validation";
import { register } from "@/services/auth/authService";
import { theme } from "@/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const [formError, setFormError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirmation: "",
      companyIdentifier: "",
    },
  });

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    try {
      setFormError("");
      await register({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        companyIdentifier: data.companyIdentifier.trim() || undefined,
      });
    } catch {
      setFormError(
        "O cadastro está preparado na interface, mas a API própria ainda precisa ser configurada.",
      );
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Novo acesso</Text>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.description}>
            Informe seus dados para preparar o acesso ao acompanhamento de oportunidades públicas.
          </Text>
        </View>

        <View style={styles.form}>
          <FormError message={formError} />
          <Controller
            control={control}
            name="name"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextField
                error={errors.name?.message}
                label="Nome"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Seu nome"
                textContentType="name"
                value={value}
              />
            )}
          />
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
          <Controller
            control={control}
            name="password"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextField
                error={errors.password?.message}
                label="Senha"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Mínimo de 6 caracteres"
                secureTextEntry
                textContentType="newPassword"
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="passwordConfirmation"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextField
                error={errors.passwordConfirmation?.message}
                label="Confirmar senha"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Repita sua senha"
                secureTextEntry
                textContentType="newPassword"
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="companyIdentifier"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextField
                autoCapitalize="characters"
                error={errors.companyIdentifier?.message}
                label="CNPJ ou CNAE (opcional)"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Ex.: 12.345.678/0001-90"
                value={value}
              />
            )}
          />
          <Button title="Cadastrar" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Já tem conta?</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/(auth)/login")}
            hitSlop={12}
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
  form: {
    gap: theme.spacing.lg,
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
