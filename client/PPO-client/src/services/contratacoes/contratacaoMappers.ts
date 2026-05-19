import type {
  ContratacaoDetail,
  ContratacaoDetailResponse,
  ContratacaoListItem,
  ContratacaoRaw,
} from "@/types/contratacao";

import { formatCurrency, readNestedObject, readNumber, readString } from "./contratacaoParsers";

export function mapContratacao(item: ContratacaoRaw, index: number): ContratacaoListItem {
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

export function mapContratacaoDetail(item: ContratacaoDetailResponse["data"]): ContratacaoDetail {
  const orgaoEntidade = readNestedObject(item.orgaoEntidade);
  const unidadeOrgao = readNestedObject(item.unidadeOrgao);

  return {
    id: readString(item._id) ?? readString(item.id) ?? "",
    numeroControlePNCP: readString(item.numeroControlePNCP),
    processo: readString(item.processo),
    objetoCompra: readString(item.objetoCompra) ?? "Contratacao sem titulo",
    modalidadeNome: readString(item.modalidadeNome),
    valorTotalEstimado: formatCurrency(item.valorTotalEstimado),
    anoCompra: readNumber(item.anoCompra),
    dataInclusao: readString(item.dataInclusao),
    dataPublicacaoPncp: readString(item.dataPublicacaoPncp),
    orgaoEntidade: {
      cnpj: readString(orgaoEntidade.cnpj),
      razaoSocial: readString(orgaoEntidade.razaoSocial),
      poderId: readString(orgaoEntidade.poderId),
      esferaId: readString(orgaoEntidade.esferaId),
    },
    unidadeOrgao: {
      ufNome: readString(unidadeOrgao.ufNome),
      codigoUnidade: readString(unidadeOrgao.codigoUnidade),
      ufSigla: readString(unidadeOrgao.ufSigla),
      municipioNome: readString(unidadeOrgao.municipioNome),
      nomeUnidade: readString(unidadeOrgao.nomeUnidade),
      codigoIbge: readString(unidadeOrgao.codigoIbge),
    },
  };
}
