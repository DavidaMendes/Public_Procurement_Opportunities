import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { SavedOpportunity } from "@/types/savedOpportunity";

const SAVED_OPPORTUNITIES_KEY = "ppo.saved.opportunities";

type SaveOpportunityInput = Omit<SavedOpportunity, "savedAt">;

function canUseWebStorage() {
  return Platform.OS === "web" && typeof window !== "undefined" && !!window.localStorage;
}

function parseSavedOpportunities(value: string | null): SavedOpportunity[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is SavedOpportunity => (
      item &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.organization === "string" &&
      typeof item.estimatedValue === "string" &&
      typeof item.location === "string" &&
      typeof item.savedAt === "string"
    ));
  } catch {
    return [];
  }
}

async function readRawSavedOpportunities() {
  if (canUseWebStorage()) {
    return window.localStorage.getItem(SAVED_OPPORTUNITIES_KEY);
  }

  if (!(await SecureStore.isAvailableAsync())) {
    return null;
  }

  return SecureStore.getItemAsync(SAVED_OPPORTUNITIES_KEY);
}

async function writeSavedOpportunities(items: SavedOpportunity[]) {
  const value = JSON.stringify(items);

  if (canUseWebStorage()) {
    window.localStorage.setItem(SAVED_OPPORTUNITIES_KEY, value);
    return;
  }

  if (!(await SecureStore.isAvailableAsync())) {
    return;
  }

  await SecureStore.setItemAsync(SAVED_OPPORTUNITIES_KEY, value);
}

export async function getSavedOpportunities() {
  return parseSavedOpportunities(await readRawSavedOpportunities());
}

export async function isOpportunitySaved(id: string) {
  const savedOpportunities = await getSavedOpportunities();
  return savedOpportunities.some((item) => item.id === id);
}

export async function saveOpportunity(input: SaveOpportunityInput) {
  const currentItems = await getSavedOpportunities();

  if (currentItems.some((item) => item.id === input.id)) {
    return currentItems;
  }

  const nextItems = [
    {
      ...input,
      savedAt: new Date().toISOString(),
    },
    ...currentItems,
  ];

  await writeSavedOpportunities(nextItems);
  return nextItems;
}

export async function removeSavedOpportunity(id: string) {
  const currentItems = await getSavedOpportunities();
  const nextItems = currentItems.filter((item) => item.id !== id);

  await writeSavedOpportunities(nextItems);
  return nextItems;
}
