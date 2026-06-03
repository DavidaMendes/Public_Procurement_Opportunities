import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import { SessionLoading } from "@/components/ui/SessionLoading";
import { useAuth } from "@/hooks/useAuth";
import { getOnboardingCompleted } from "@/services/onboarding/onboardingStorage";

export default function Index() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadOnboardingState() {
      try {
        const completed = await getOnboardingCompleted();

        if (isMounted) {
          setHasCompletedOnboarding(completed);
        }
      } finally {
        if (isMounted) {
          setIsOnboardingLoading(false);
        }
      }
    }

    loadOnboardingState();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isAuthLoading || isOnboardingLoading) {
    return <SessionLoading />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(auth)/login" />;
}
