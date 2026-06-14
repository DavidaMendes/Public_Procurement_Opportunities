import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormError } from "@/components/ui/FormError";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
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
      acceptedTerms: false,
    },
  });

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    try {
      setFormError("");
      await register({
        nome: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        senha: data.password,
        cnpj: data.companyIdentifier.trim(),
      });
      router.replace("/(auth)/login");

    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
        return;
      }

      setFormError("Não foi possível se cadastrar.");
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
              <View style={styles.passwordField}>
                <TextField
                  error={errors.password?.message}
                  label="Senha"
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
                keyboardType="number-pad"
                label="CNPJ"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="12345678000195"
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="acceptedTerms"
            render={({ field: { onChange, value } }) => (
              <Checkbox
                checked={value}
                onChange={onChange}
                error={errors.acceptedTerms?.message}
                accessibilityLabel="Aceitar Política de Privacidade e Termos de Uso"
              >
                <Text style={styles.consentText}>
                  Li e aceito a{" "}
                  <Text style={styles.consentLink} onPress={() => router.push("/privacidade")}>
                    Política de Privacidade
                  </Text>
                  {" "}e os{" "}
                  <Text style={styles.consentLink} onPress={() => router.push("/termos")}>
                    Termos de Uso
                  </Text>
                  .
                </Text>
              </Checkbox>
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
  passwordField: {
    gap: theme.spacing.sm,
  },
  consentText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    lineHeight: 20,
  },
  consentLink: {
    color: theme.colors.primary,
    fontWeight: "800",
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
