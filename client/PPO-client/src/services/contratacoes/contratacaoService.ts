import { apiRequest } from "@/services/api/client";
import { mapContratacao, mapContratacaoDetail } from "@/services/contratacoes/contratacaoMappers";
import type {
  ContratacaoDetail,
  ContratacaoDetailResponse,
  ContratacaoListItem,
  ContratacaoListResponse,
} from "@/types/contratacao";

type ListContratacoesInput = {
  token: string;
  page?: number;
};

type ListContratacoesOutput = Omit<ContratacaoListResponse, "data"> & {
  data: ContratacaoListItem[];
};

type GetContratacaoInput = {
  id: string;
  token: string;
};

export async function listContratacoes({
  token,
  page = 1,
}: ListContratacoesInput): Promise<ListContratacoesOutput> {
  const response = await apiRequest<ContratacaoListResponse>(`/contratacoes?page=${page}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

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
