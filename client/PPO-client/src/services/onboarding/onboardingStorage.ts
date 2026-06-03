import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ONBOARDING_COMPLETED_KEY = "ppo.onboarding.completed";

function canUseWebStorage() {
  return Platform.OS === "web" && typeof window !== "undefined" && !!window.localStorage;
}

export async function saveOnboardingCompleted() {
  if (canUseWebStorage()) {
    window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    return;
  }

  if (!(await SecureStore.isAvailableAsync())) {
    return;
  }

  await SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, "true");
}

export async function getOnboardingCompleted() {
  if (canUseWebStorage()) {
    return window.localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
  }

  if (!(await SecureStore.isAvailableAsync())) {
    return false;
  }

  return (await SecureStore.getItemAsync(ONBOARDING_COMPLETED_KEY)) === "true";
}
