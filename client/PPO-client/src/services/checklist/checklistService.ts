import { apiRequest } from "@/services/api/client";
import type { ChecklistApiItem, ChecklistResponse } from "@/types/checklist";

type ChecklistInput = {
  contratacaoId: string;
  token: string;
};

type UpdateChecklistInput = ChecklistInput & {
  items: ChecklistApiItem[];
};

export function getChecklist({ contratacaoId, token }: ChecklistInput) {
  return apiRequest<ChecklistResponse>(
    `/contratacoes/${encodeURIComponent(contratacaoId)}/checklist`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export function updateChecklist({ contratacaoId, items, token }: UpdateChecklistInput) {
  return apiRequest<ChecklistResponse>(
    `/contratacoes/${encodeURIComponent(contratacaoId)}/checklist`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        items,
      },
    },
  );
}
