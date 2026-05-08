import { z } from "zod";

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
    password: z.string().min(6, "Use pelo menos 6 caracteres."),
    passwordConfirmation: z.string().min(1, "Confirme sua senha."),
    companyIdentifier: z
      .string()
      .trim()
      .min(1, "Informe seu CNPJ.")
      .regex(/^\d+$/, "CNPJ deve conter apenas numeros.")
      .length(14, "CNPJ deve ter 14 digitos."),
  })
  .refine((data) => data.passwordConfirmation === data.password, {
    message: "As senhas nao conferem.",
    path: ["passwordConfirmation"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
