import { apiRequest } from "@/services/api/client";
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from "@/types/auth";

export function login(input: LoginRequest) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export function register(input: RegisterRequest) {
  return apiRequest<RegisterResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export function logout(token: string) {
  return apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function forgotPassword(email: string) {
  // A API responde sempre com uma mensagem genérica; em dev também devolve
  // `resetToken` para facilitar o teste do fluxo.
  return apiRequest<{ message: string; resetToken?: string }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function resetPassword(input: { token: string; novaSenha: string }) {
  return apiRequest<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: input,
  });
}

export function changePassword(input: {
  token: string;
  senhaAtual: string;
  novaSenha: string;
}) {
  return apiRequest<{ message: string }>("/auth/change-password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
    body: { senhaAtual: input.senhaAtual, novaSenha: input.novaSenha },
    // Um 401 aqui significa "senha atual incorreta" (erro de negócio), não
    // token revogado — a tela trata localmente, sem logout global.
    suppressUnauthorizedHandler: true,
  });
}
