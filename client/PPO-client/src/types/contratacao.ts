export type ContratacaoRaw = Record<string, unknown> & {
  _id?: string;
  id?: string;
};

export type ContratacaoOrgaoEntidade = {
  cnpj: string | null;
  razaoSocial: string | null;
  poderId: string | null;
  esferaId: string | null;
};

export type ContratacaoUnidadeOrgao = {
  ufNome: string | null;
  codigoUnidade: string | null;
  ufSigla: string | null;
  municipioNome: string | null;
  nomeUnidade: string | null;
  codigoIbge: string | null;
};

export type ContratacaoDetailRaw = ContratacaoRaw & {
  numeroControlePNCP?: string;
  processo?: string;
  objetoCompra?: string;
  modalidadeNome?: string;
  valorTotalEstimado?: number;
  anoCompra?: number;
  dataInclusao?: string;
  dataPublicacaoPncp?: string;
  orgaoEntidade?: Partial<ContratacaoOrgaoEntidade>;
  unidadeOrgao?: Partial<ContratacaoUnidadeOrgao>;
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

export type ContratacaoDetailResponse = {
  data: ContratacaoDetailRaw;
};

export type ContratacaoDetail = {
  id: string;
  numeroControlePNCP: string | null;
  processo: string | null;
  objetoCompra: string;
  modalidadeNome: string | null;
  valorTotalEstimado: string;
  anoCompra: number | null;
  dataInclusao: string | null;
  dataPublicacaoPncp: string | null;
  orgaoEntidade: ContratacaoOrgaoEntidade;
  unidadeOrgao: ContratacaoUnidadeOrgao;
};
