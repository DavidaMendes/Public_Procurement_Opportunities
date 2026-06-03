import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "@/services/api/client";
import { checklistTemplate } from "@/services/checklist/checklistItems";
import { getChecklist, updateChecklist } from "@/services/checklist/checklistService";
import type { ChecklistApiItem, ChecklistKey } from "@/types/checklist";

type UseContratacaoChecklistInput = {
  contratacaoId: string | undefined;
  token: string | null;
  onUnauthorized: () => Promise<void>;
};

function mapApiItems(items: ChecklistApiItem[]) {
  return items.reduce<Partial<Record<ChecklistKey, boolean>>>((acc, item) => {
    acc[item.key] = item.checked;
    return acc;
  }, {});
}

export function useContratacaoChecklist({
  contratacaoId,
  onUnauthorized,
  token,
}: UseContratacaoChecklistInput) {
  const [checkedByKey, setCheckedByKey] = useState<Partial<Record<ChecklistKey, boolean>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const items = useMemo(
    () =>
      checklistTemplate.map((item) => ({
        ...item,
        completed: !!checkedByKey[item.key],
      })),
    [checkedByKey],
  );
  const completedItems = items.filter((item) => item.completed).length;
  const progress = Math.round((completedItems / items.length) * 100);

  const loadChecklist = useCallback(async () => {
    if (!contratacaoId || !token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const response = await getChecklist({ contratacaoId, token });
      setCheckedByKey(mapApiItems(response.items));
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await onUnauthorized();
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar o checklist.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [contratacaoId, onUnauthorized, token]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  async function toggleItem(key: ChecklistKey) {
    if (!contratacaoId || !token) {
      return;
    }

    const checked = !checkedByKey[key];
    const previousState = checkedByKey;
    const nextState = {
      ...checkedByKey,
      [key]: checked,
    };

    setCheckedByKey(nextState);
    setError("");

    try {
      const response = await updateChecklist({
        contratacaoId,
        token,
        items: [{ key, checked }],
      });
      setCheckedByKey(mapApiItems(response.items));
    } catch (requestError) {
      setCheckedByKey(previousState);

      if (requestError instanceof ApiError && requestError.status === 401) {
        await onUnauthorized();
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível atualizar o checklist.",
      );
    }
  }

  return {
    error,
    isLoading,
    items,
    progress,
    retry: loadChecklist,
    toggleItem,
  };
}
