export type ContratacaoRaw = Record<string, unknown> & {
  _id?: string;
  id?: string;
};

export type ContratacaoListResponse = {
  data: ContratacaoRaw[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ContratacaoListItem = {
  id: string;
  title: string;
  organization: string;
  estimatedValue: string;
  deadline: string;
};
