import { apiRequest } from "@/services/api/client";
import { mapContratacao, mapContratacaoDetail } from "@/services/contratacoes/contratacaoMappers";
import type {
  ContratacaoDetail,
  ContratacaoDetailResponse,
  ContratacaoFilters,
  ContratacaoListItem,
  ContratacaoListResponse,
} from "@/types/contratacao";

type ListContratacoesInput = {
  token: string;
  page?: number;
  filters?: ContratacaoFilters;
};

type ListContratacoesOutput = Omit<ContratacaoListResponse, "data"> & {
  data: ContratacaoListItem[];
};

type GetContratacaoInput = {
  id: string;
  token: string;
};

function buildContratacoesQuery(page: number, filters?: ContratacaoFilters) {
  const params = new URLSearchParams({
    page: String(page),
  });

  Object.entries(filters ?? {}).forEach(([key, value]) => {
    const normalizedValue = value?.trim();

    if (normalizedValue) {
      params.set(key, normalizedValue);
    }
  });

  return params.toString();
}

export async function listContratacoes({
  filters,
  token,
  page = 1,
}: ListContratacoesInput): Promise<ListContratacoesOutput> {
  const query = buildContratacoesQuery(page, filters);
  const response = await apiRequest<ContratacaoListResponse>(
    `/contratacoes?${query}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  console.log("[contratacoes:list]", response);

  return {
    ...response,
    data: response.data.map(mapContratacao),
  };
}

export async function getContratacao({
  id,
  token,
}: GetContratacaoInput): Promise<ContratacaoDetail> {
  const response = await apiRequest<ContratacaoDetailResponse>(
    `/contratacoes/${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return mapContratacaoDetail(response.data);
}
