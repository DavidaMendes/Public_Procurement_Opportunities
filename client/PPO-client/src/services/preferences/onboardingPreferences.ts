import AsyncStorage from "@react-native-async-storage/async-storage";

export const ONBOARDING_COMPLETED_STORAGE_KEY = "@ppo/onboarding-completed";

export type OnboardingPreferencesRepository = {
  getCompleted: () => Promise<boolean>;
  setCompleted: (completed: boolean) => Promise<void>;
};

export const onboardingPreferences: OnboardingPreferencesRepository = {
  async getCompleted() {
    const storedValue = await AsyncStorage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY);

    return storedValue === "true";
  },
  async setCompleted(completed) {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_STORAGE_KEY, String(completed));
  },
};
