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
