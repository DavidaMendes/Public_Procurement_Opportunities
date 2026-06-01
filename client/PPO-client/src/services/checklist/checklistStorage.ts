import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { StoredChecklist } from "@/types/checklist";

const CHECKLIST_KEY_PREFIX = "ppo.checklist.";

function canUseWebStorage() {
  return Platform.OS === "web" && typeof window !== "undefined" && !!window.localStorage;
}

function getChecklistKey(contratacaoId: string) {
  return `${CHECKLIST_KEY_PREFIX}${contratacaoId}`;
}

function parseStoredChecklist(value: string | null): StoredChecklist {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.entries(parsed).reduce<StoredChecklist>((acc, [key, itemValue]) => {
      if (typeof itemValue === "boolean") {
        acc[key] = itemValue;
      }

      return acc;
    }, {});
  } catch {
    return {};
  }
}

export async function getChecklistState(contratacaoId: string) {
  const key = getChecklistKey(contratacaoId);

  if (canUseWebStorage()) {
    return parseStoredChecklist(window.localStorage.getItem(key));
  }

  if (!(await SecureStore.isAvailableAsync())) {
    return {};
  }

  return parseStoredChecklist(await SecureStore.getItemAsync(key));
}

export async function saveChecklistState(contratacaoId: string, state: StoredChecklist) {
  const key = getChecklistKey(contratacaoId);
  const value = JSON.stringify(state);

  if (canUseWebStorage()) {
    window.localStorage.setItem(key, value);
    return;
  }

  if (!(await SecureStore.isAvailableAsync())) {
    return;
  }

  await SecureStore.setItemAsync(key, value);
}
