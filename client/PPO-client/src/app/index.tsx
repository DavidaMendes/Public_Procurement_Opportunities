import { useEffect, useState } from "react";
import { Redirect } from "expo-router";

import { Screen } from "@/components/ui/Screen";
import { onboardingPreferences } from "@/services/preferences/onboardingPreferences";

export default function Index() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOnboardingPreference() {
      try {
        const completed = await onboardingPreferences.getCompleted();

        if (isMounted) {
          setHasCompletedOnboarding(completed);
        }
      } catch {
        if (isMounted) {
          setHasCompletedOnboarding(false);
        }
      }
    }

    loadOnboardingPreference();

    return () => {
      isMounted = false;
    };
  }, []);

  if (hasCompletedOnboarding === null) {
    return <Screen scroll={false} />;
  }

  return <Redirect href={hasCompletedOnboarding ? "/(auth)/login" : "/onboarding"} />;
}
