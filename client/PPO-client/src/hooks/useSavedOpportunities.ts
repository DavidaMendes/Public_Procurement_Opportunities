import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/services/api/client";
import { getSavedOpportunities } from "@/services/saved-opportunities/savedOpportunityService";
import type { SavedOpportunity } from "@/types/savedOpportunity";

export function useSavedOpportunities() {
  const router = useRouter();
  const { signOut, token } = useAuth();
  const [items, setItems] = useState<SavedOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!token) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setItems(await getSavedOpportunities({ token }));
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await signOut();
        router.replace("/(auth)/login");
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar os editais salvos.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [router, signOut, token]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return {
    error,
    isLoading,
    items,
    refresh,
  };
}
