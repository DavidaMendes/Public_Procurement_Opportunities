import Constants from "expo-constants";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

type ExpoExtra = {
  apiBaseUrl?: string;
};

type ApiErrorResponse = {
  error?: string;
  errors?: Array<{
    msg?: string;
  }>;
};

const expoExtra = Constants.expoConfig?.extra as ExpoExtra | undefined;

export const apiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? expoExtra?.apiBaseUrl ?? "",
};

export class ApiConfigurationError extends Error {
  constructor() {
    super("A API propria ainda nao foi configurada para o aplicativo.");
    this.name = "ApiConfigurationError";
  }
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseResponseBody(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getApiErrorMessage(data: unknown) {
  const errorData = data as ApiErrorResponse | null;

  if (typeof errorData?.error === "string") {
    return errorData.error;
  }

  const firstValidationError = errorData?.errors?.[0]?.msg;

  if (typeof firstValidationError === "string") {
    return firstValidationError;
  }

  return "Nao foi possivel concluir a comunicacao com a API.";
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

  const data = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(getApiErrorMessage(data), response.status);
  }

  return data as TResponse;
}
