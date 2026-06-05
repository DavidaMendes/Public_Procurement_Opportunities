import { apiRequest } from "@/services/api/client";
import { mapContratacaoDetail } from "@/services/contratacoes/contratacaoMappers";
import { formatCurrency, readString } from "@/services/contratacoes/contratacaoParsers";
import type {
  SavedOpportunity,
  SavedOpportunityListResponse,
  SavedOpportunityRaw,
  SavedOpportunityResponse,
} from "@/types/savedOpportunity";

type AuthenticatedRequestInput = {
  token: string;
};

type OpportunityRequestInput = AuthenticatedRequestInput & {
  id: string;
};

type UpdateSavedOpportunityAlertInput = {
  alertDate?: string | null;
  alertDone?: boolean;
};

type UpdateSavedOpportunityAlertRequestInput = OpportunityRequestInput & {
  input: UpdateSavedOpportunityAlertInput;
};

function getLocation(item: SavedOpportunityRaw) {
  const unidadeOrgao = item.contratacao?.unidadeOrgao;
  const city = readString(unidadeOrgao?.municipioNome);
  const uf = readString(unidadeOrgao?.ufSigla);

  if (city && uf) {
    return `${city}/${uf}`;
  }

  return city ?? uf ?? "Local não informado";
}

function mapSavedOpportunity(item: SavedOpportunityRaw): SavedOpportunity {
  const contratacao = item.contratacao ? mapContratacaoDetail(item.contratacao) : null;

  return {
    id: item.contratacaoId,
    title: contratacao?.objetoCompra ?? "Contratação sem título",
    organization: contratacao?.orgaoEntidade.razaoSocial ?? "Órgão não informado",
    estimatedValue: contratacao?.valorTotalEstimado ?? formatCurrency(null),
    location: getLocation(item),
    alertDate: item.alertDate ?? null,
    alertDone: item.alertDone ?? false,
    savedAt: item.savedAt,
  };
}

function getAuthorizationHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getSavedOpportunities({ token }: AuthenticatedRequestInput) {
  const response = await apiRequest<SavedOpportunityListResponse>("/me/saved-opportunities", {
    headers: getAuthorizationHeader(token),
  });

  return response.data.map(mapSavedOpportunity);
}

export async function isOpportunitySaved({ id, token }: OpportunityRequestInput) {
  const savedOpportunities = await getSavedOpportunities({ token });
  return savedOpportunities.some((item) => item.id === id);
}

export async function saveOpportunity({ id, token }: OpportunityRequestInput) {
  const response = await apiRequest<SavedOpportunityResponse>(
    `/contratacoes/${encodeURIComponent(id)}/save`,
    {
      method: "POST",
      headers: getAuthorizationHeader(token),
    },
  );

  return mapSavedOpportunity(response.data);
}

export async function removeSavedOpportunity({ id, token }: OpportunityRequestInput) {
  await apiRequest<null>(`/contratacoes/${encodeURIComponent(id)}/save`, {
    method: "DELETE",
    headers: getAuthorizationHeader(token),
  });
}

export async function updateSavedOpportunityAlert({
  id,
  input,
  token,
}: UpdateSavedOpportunityAlertRequestInput) {
  const response = await apiRequest<SavedOpportunityResponse>(
    `/contratacoes/${encodeURIComponent(id)}/alert`,
    {
      method: "PATCH",
      body: input,
      headers: getAuthorizationHeader(token),
    },
  );

  return mapSavedOpportunity(response.data);
}
