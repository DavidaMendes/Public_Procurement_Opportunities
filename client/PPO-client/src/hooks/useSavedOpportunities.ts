import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { getSavedOpportunities } from "@/services/saved-opportunities/savedOpportunityService";
import type { SavedOpportunity } from "@/types/savedOpportunity";

export function useSavedOpportunities() {
  const [items, setItems] = useState<SavedOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setItems(await getSavedOpportunities());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return {
    isLoading,
    items,
    refresh,
  };
}
