import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { LoginFormData, loginSchema } from "@/features/auth/validation";
import { login } from "@/services/auth/authService";
import { theme } from "@/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [formError, setFormError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      setFormError("");
      await login({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
    } catch {
      setFormError(
        "precisa da integração com a API",
      );
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Entrar</Text>
          <Text style={styles.description}>
            Acesse sua área para acompanhar oportunidades, prazos e documentos.
          </Text>
        </View>

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
          <Controller
            control={control}
            name="password"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextField
                error={errors.password?.message}
                label="Senha"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Sua senha"
                secureTextEntry
                textContentType="password"
                value={value}
              />
            )}
          />
          <Button title="Entrar" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ainda não tem conta?</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(auth)/register")}
            hitSlop={12}
          >
            <Text style={styles.link}>Criar cadastro</Text>
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
