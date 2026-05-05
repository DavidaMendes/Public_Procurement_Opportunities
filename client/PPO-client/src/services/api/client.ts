import Constants from "expo-constants";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

type ExpoExtra = {
  apiBaseUrl?: string;
};

const expoExtra = Constants.expoConfig?.extra as ExpoExtra | undefined;

export const apiConfig = {
  baseUrl: expoExtra?.apiBaseUrl ?? "",
};

export class ApiConfigurationError extends Error {
  constructor() {
    super("A API própria ainda não foi configurada para o aplicativo.");
    this.name = "ApiConfigurationError";
  }
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  if (!apiConfig.baseUrl) {
    throw new ApiConfigurationError();
  }

  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error("Não foi possível concluir a comunicação com a API.");
  }

  return response.json() as Promise<TResponse>;
}
