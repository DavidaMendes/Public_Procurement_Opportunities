import { apiRequest } from "@/services/api/client";
import type { MeResponse, UpdateNameResponse } from "@/types/user";

export function getMe(token: string) {
  return apiRequest<MeResponse>("/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateName(input: { token: string; nome: string }) {
  return apiRequest<UpdateNameResponse>("/users/me", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
    body: { nome: input.nome },
  });
}

export function deleteMe(token: string) {
  return apiRequest<{ message: string }>("/users/me", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
