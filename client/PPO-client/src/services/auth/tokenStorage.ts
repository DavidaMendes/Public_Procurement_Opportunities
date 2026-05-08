import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_TOKEN_KEY = "ppo.auth.token";

function canUseWebStorage() {
  return Platform.OS === "web" && typeof window !== "undefined" && !!window.localStorage;
}

export async function saveToken(token: string) {
  if (canUseWebStorage()) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  if (!(await SecureStore.isAvailableAsync())) {
    throw new Error("Armazenamento seguro indisponivel neste dispositivo.");
  }

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function getToken() {
  if (canUseWebStorage()) {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  }

  if (!(await SecureStore.isAvailableAsync())) {
    return null;
  }

  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function deleteToken() {
  if (canUseWebStorage()) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }

  if (!(await SecureStore.isAvailableAsync())) {
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}
