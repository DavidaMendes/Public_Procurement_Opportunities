import type { ContratacaoDetailRaw } from "@/types/contratacao";

export type SavedOpportunityRaw = {
  contratacaoId: string;
  contratacao?: ContratacaoDetailRaw | null;
  alertDate?: string | null;
  alertDone?: boolean;
  savedAt: string;
};

export type SavedOpportunity = {
  id: string;
  title: string;
  organization: string;
  estimatedValue: string;
  location: string;
  alertDate: string | null;
  alertDone: boolean;
  savedAt: string;
  alertDate: string | null;
  alertDone: boolean;
};

export type SavedOpportunityListResponse = {
  data: SavedOpportunityRaw[];
};

export type SavedOpportunityResponse = {
  data: SavedOpportunityRaw;
};

export type SavedOpportunityListResponse = {
  data: SavedOpportunityRaw[];
};

export type SavedOpportunityResponse = {
  data: SavedOpportunityRaw;
};
