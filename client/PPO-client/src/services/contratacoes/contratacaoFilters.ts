import type { ContratacaoFilters } from "@/types/contratacao";

export const initialContratacaoFilters: ContratacaoFilters = {
  q: "",
  uf: "",
  valorMin: "",
  valorMax: "",
};

export function hasContratacaoFilters(filters: ContratacaoFilters) {
  return Object.values(filters).some((value) => !!value?.trim());
}

export function normalizeContratacaoFilters(filters: ContratacaoFilters): ContratacaoFilters {
  return {
    q: filters.q?.trim(),
    uf: filters.uf?.trim().toUpperCase(),
    valorMin: filters.valorMin?.trim(),
    valorMax: filters.valorMax?.trim(),
  };
}
