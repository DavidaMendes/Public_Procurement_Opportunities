import argparse
from typing import Any, Dict, List, Optional

from app.infrastructure.config import (
    MONGODB_BRONZE_COLLECTION_NAME,
    MONGODB_COLLECTION_NAME,
    MONGODB_DB_NAME,
    RECIFE_PROCUREMENT,
)
from app.orchestrate_prefect import procurement_etl_flow, procurement_streaming_flow


def build_params(args: argparse.Namespace) -> Dict[str, Any]:
    params = {
        "dataInicial": args.data_inicial or RECIFE_PROCUREMENT["dataInicial"],
        "dataFinal": args.data_final or RECIFE_PROCUREMENT["dataFinal"],
        "pagina": "1",
        "tamanhoPagina": str(args.tamanho_pagina),
    }

    codigo_modalidade = (
        args.codigo_modalidade_contratacao
        if args.codigo_modalidade_contratacao is not None
        else RECIFE_PROCUREMENT.get("codigoModalidadeContratacao")
    )
    codigo_municipio = (
        args.codigo_municipio_ibge
        if args.codigo_municipio_ibge is not None
        else RECIFE_PROCUREMENT.get("codigoMunicipioIbge")
    )

    if codigo_modalidade:
        params["codigoModalidadeContratacao"] = codigo_modalidade
    if codigo_municipio:
        params["codigoMunicipioIbge"] = codigo_municipio

    return params


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the PNCP ETL Prefect flow.")
    parser.add_argument(
        "--mode",
        choices=["streaming", "batch"],
        default="streaming",
        help="Modo de execucao: streaming usa Kafka workers; batch usa ETL direto.",
    )
    parser.add_argument("--dataInicial", dest="data_inicial", help="Data inicial no formato YYYYMMDD.")
    parser.add_argument("--dataFinal", dest="data_final", help="Data final no formato YYYYMMDD.")
    parser.add_argument(
        "--codigoModalidadeContratacao",
        dest="codigo_modalidade_contratacao",
        help="Codigo da modalidade de contratacao.",
    )
    parser.add_argument(
        "--codigoMunicipioIbge",
        dest="codigo_municipio_ibge",
        help="Codigo IBGE do municipio.",
    )
    parser.add_argument(
        "--tamanhoPagina",
        dest="tamanho_pagina",
        type=int,
        default=int(RECIFE_PROCUREMENT.get("tamanhoPagina", 50)),
        help="Quantidade de registros por pagina.",
    )
    parser.add_argument(
        "--maxPages",
        dest="max_pages",
        type=int,
        default=None,
        help="Quantidade maxima de paginas para extrair.",
    )
    parser.add_argument(
        "--mongodbDb",
        default=MONGODB_DB_NAME,
        help="Nome do banco MongoDB usado na carga.",
    )
    parser.add_argument(
        "--mongodbCollection",
        default=MONGODB_COLLECTION_NAME,
        help="Nome da collection MongoDB silver usada na carga.",
    )
    parser.add_argument(
        "--mongodbBronzeCollection",
        default=MONGODB_BRONZE_COLLECTION_NAME,
        help="Nome da collection MongoDB bronze usada na carga bruta.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=1000,
        help="Timeout dos consumers Kafka em ms (modo streaming).",
    )
    parser.add_argument(
        "--batchSize",
        type=int,
        default=10,
        help="Tamanho do lote do LoadWorker (modo streaming).",
    )
    parser.add_argument(
        "--maxIdlePolls",
        type=int,
        default=30,
        help="Quantidade de polls sem mensagens antes de encerrar workers (modo streaming).",
    )
    parser.add_argument(
        "--startupSeconds",
        type=int,
        default=5,
        help="Tempo para aguardar consumers assinarem topicos antes do extract (modo streaming).",
    )
    parser.add_argument(
        "--workerTimeoutSeconds",
        type=int,
        default=300,
        help="Timeout para workers drenarem topicos apos extract finalizar (modo streaming).",
    )
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> Dict[str, Any]:
    args = parse_args(argv)
    params = build_params(args)

    if args.mode == "streaming":
        return procurement_streaming_flow(
            params=params,
            max_pages=args.max_pages,
            timeout_ms=args.timeout,
            batch_size=args.batchSize,
            max_idle_polls=args.maxIdlePolls,
            startup_seconds=args.startupSeconds,
            worker_timeout_seconds=args.workerTimeoutSeconds,
        )

    return procurement_etl_flow(
        params=params,
        max_pages=args.max_pages,
        mongodb_db=args.mongodbDb,
        mongodb_collection=args.mongodbCollection,
        mongodb_bronze_collection=args.mongodbBronzeCollection,
    )


if __name__ == "__main__":
    main()
