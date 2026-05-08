import { apiRequest } from "@/services/api/client";
import type {
  ContratacaoListItem,
  ContratacaoListResponse,
  ContratacaoRaw,
} from "@/types/contratacao";

type ListContratacoesInput = {
  token: string;
  page?: number;
};

type ListContratacoesOutput = Omit<ContratacaoListResponse, "data"> & {
  data: ContratacaoListItem[];
};

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatCurrency(value: unknown) {
  const number = readNumber(value);

  if (number === null) {
    return "Nao informado";
  }

  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(number);
}

function mapContratacao(item: ContratacaoRaw, index: number): ContratacaoListItem {
  const title =
    readString(item.objetoCompra) ??
    readString(item.objeto) ??
    readString(item.descricao) ??
    "Contratacao sem titulo";

  const organization =
    readString(item.razaoSocialOrgao) ??
    readString(item.nomeOrgao) ??
    readString(item.orgaoEntidade) ??
    "Orgao nao informado";

  const deadline =
    readString(item.dataEncerramentoProposta) ??
    readString(item.dataFinalProposta) ??
    readString(item.dataFimRecebimentoPropostas) ??
    "Prazo nao informado";

  return {
    id: readString(item._id) ?? readString(item.id) ?? `contratacao-${index}`,
    title,
    organization,
    estimatedValue: formatCurrency(item.valorTotalEstimado),
    deadline,
  };
}

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
