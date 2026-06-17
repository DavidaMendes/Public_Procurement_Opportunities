import { z } from "zod";

/**
 * Política de senha forte — espelha a regra `isStrongPassword` da API
 * (mín. 8 caracteres com maiúscula, minúscula, número e símbolo). Reutilizada
 * no cadastro, na redefinição e na troca de senha.
 */
export const strongPassword = z
  .string()
  .min(8, "Use ao menos 8 caracteres.")
  .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
  .regex(/[a-z]/, "Inclua uma letra minúscula.")
  .regex(/[0-9]/, "Inclua um número.")
  .regex(/[^A-Za-z0-9]/, "Inclua um símbolo.");

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe sua senha."),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Informe seu nome."),
    email: z
      .string()
      .trim()
      .min(1, "Informe seu e-mail.")
      .email("Informe um e-mail valido."),
    password: strongPassword,
    passwordConfirmation: z.string().min(1, "Confirme sua senha."),
    companyIdentifier: z
      .string()
      .trim()
      .min(1, "Informe seu CNPJ.")
      .regex(/^\d+$/, "CNPJ deve conter apenas numeros.")
      .length(14, "CNPJ deve ter 14 digitos."),
    acceptedTerms: z.boolean().refine((value) => value === true, {
      message: "É necessário aceitar a Política de Privacidade e os Termos de Uso.",
    }),
  })
  .refine((data) => data.passwordConfirmation === data.password, {
    message: "As senhas não conferem.",
    path: ["passwordConfirmation"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .email("Informe um e-mail valido."),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    novaSenha: strongPassword,
    confirmarSenha: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: "As senhas não conferem.",
    path: ["confirmarSenha"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe sua senha atual."),
    novaSenha: strongPassword,
    confirmarSenha: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: "As senhas não conferem.",
    path: ["confirmarSenha"],
  })
  .refine((data) => data.novaSenha !== data.senhaAtual, {
    message: "A nova senha deve ser diferente da atual.",
    path: ["novaSenha"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
