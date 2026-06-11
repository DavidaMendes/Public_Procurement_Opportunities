import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from prefect import flow, get_run_logger, task

from app.etl.extract import Extract
from app.etl.load import Load
from app.etl.transform import Transform
from app.infrastructure.config import (
    MONGODB_COLLECTION_NAME,
    MONGODB_DB_NAME,
    RECIFE_PROCUREMENT,
)
from app.infrastructure.database import init_sqlite_db
from app.infrastructure.exceptions import NonRetryableAPIError


load_dotenv()


SERVER_DIR = Path(__file__).resolve().parents[1]


def _should_retry_extract(task, task_run, state) -> bool:
    exception = state.result(raise_on_failure=False)
    return not isinstance(exception, NonRetryableAPIError)


def _python_module_command(module: str, args: Optional[List[str]] = None) -> List[str]:
    return [sys.executable, "-m", module, *(args or [])]


def _worker_env() -> Dict[str, str]:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(SERVER_DIR)
    return env


def _extract_worker_args(params: Dict[str, Any], max_pages: Optional[int]) -> List[str]:
    args = [
        "--dataInicial",
        str(params["dataInicial"]),
        "--dataFinal",
        str(params["dataFinal"]),
        "--tamanhoPagina",
        str(params.get("tamanhoPagina", 50)),
    ]

    if params.get("codigoModalidadeContratacao"):
        args.extend(["--codigoModalidadeContratacao", str(params["codigoModalidadeContratacao"])])
    if params.get("codigoMunicipioIbge"):
        args.extend(["--codigoMunicipioIbge", str(params["codigoMunicipioIbge"])])
    if max_pages:
        args.extend(["--maxPages", str(max_pages)])

    return args


@task(name="Initialize SQLite database")
def initialize_database() -> None:
    init_sqlite_db()


@task(name="Run Kafka workers")
def run_kafka_workers(
    params: Dict[str, Any],
    max_pages: Optional[int] = None,
    timeout_ms: int = 1000,
    batch_size: int = 10,
    max_idle_polls: int = 30,
    startup_seconds: int = 5,
    worker_timeout_seconds: int = 300,
) -> Dict[str, Any]:
    logger = get_run_logger()
    env = _worker_env()

    transform_command = _python_module_command(
        "app.workers.transform_worker",
        [
            "--timeout",
            str(timeout_ms),
            "--maxIdlePolls",
            str(max_idle_polls),
        ],
    )
    load_command = _python_module_command(
        "app.workers.load_worker",
        [
            "--timeout",
            str(timeout_ms),
            "--batchSize",
            str(batch_size),
            "--maxIdlePolls",
            str(max_idle_polls),
        ],
    )
    extract_command = _python_module_command(
        "app.workers.extract_worker",
        _extract_worker_args(params, max_pages),
    )

    workers = []
    try:
        logger.info("Iniciando LoadWorker.")
        load_process = subprocess.Popen(load_command, cwd=SERVER_DIR, env=env)
        workers.append(("load", load_process))

        logger.info("Iniciando TransformWorker.")
        transform_process = subprocess.Popen(transform_command, cwd=SERVER_DIR, env=env)
        workers.append(("transform", transform_process))

        logger.info("Aguardando %s segundos para consumers assinarem os topicos.", startup_seconds)
        time.sleep(startup_seconds)

        logger.info("Executando ExtractWorker.")
        extract_result = subprocess.run(extract_command, cwd=SERVER_DIR, env=env, check=False)
        if extract_result.returncode != 0:
            raise RuntimeError(f"ExtractWorker falhou com exit code {extract_result.returncode}.")

        logger.info("ExtractWorker finalizado. Aguardando workers drenarem os topicos.")
        worker_results = {}
        for name, process in workers:
            try:
                worker_results[name] = process.wait(timeout=worker_timeout_seconds)
            except subprocess.TimeoutExpired:
                logger.warning("%s nao encerrou no timeout; finalizando processo.", name)
                process.terminate()
                worker_results[name] = process.wait(timeout=30)

        failed_workers = {
            name: code
            for name, code in worker_results.items()
            if code not in (0, None)
        }
        if failed_workers:
            raise RuntimeError(f"Workers falharam: {failed_workers}")

        return {
            "extract_exit_code": extract_result.returncode,
            "worker_exit_codes": worker_results,
        }

    finally:
        for name, process in workers:
            if process.poll() is None:
                logger.warning("Encerrando %s ainda em execucao.", name)
                process.terminate()


@task(
    name="Extract procurements",
    retries=3,
    retry_delay_seconds=10,
    retry_condition_fn=_should_retry_extract,
)
def extract_procurements(
    params: Dict[str, Any],
    max_pages: Optional[int] = None,
) -> List[Dict[str, Any]]:
    logger = get_run_logger()
    logger.info("Iniciando extracao paginada dos dados da API PNCP.")

    extraction_params = dict(params)
    extraction_params["extracted_at"] = datetime.utcnow().isoformat() + "Z"

    records = list(Extract().extract_paginated(extraction_params, max_pages=max_pages))
    if not records:
        raise ValueError("Nenhum dado foi retornado pela API.")

    logger.info("Extracao finalizada com %s registros recebidos.", len(records))
    return records


@task(name="Transform procurements")
def transform_procurements(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    logger = get_run_logger()
    logger.info("Iniciando transformacao dos dados.")

    transformer = Transform()
    transformed_records = [transformer.transform_record(record) for record in records]

    logger.info(
        "Transformacao finalizada com %s registros normalizados.",
        len(transformed_records),
    )
    return transformed_records


@task(name="Load procurements")
def load_procurements(
    records: List[Dict[str, Any]],
    mongodb_db: str,
    mongodb_collection: str,
) -> Dict[str, Any]:
    logger = get_run_logger()

    if not records:
        logger.info("Nenhum registro para carregar.")
        return {
            "sqlite": {"inserted": 0, "updated": 0, "errors": 0},
            "mongodb": {"inserted": 0, "errors": 0},
            "total_records": 0,
            "success": True,
        }

    logger.info(
        "Iniciando carga de %s registros em SQLite e MongoDB %s.%s.",
        len(records),
        mongodb_db,
        mongodb_collection,
    )

    result = Load(
        mongodb_db=mongodb_db,
        mongodb_collection=mongodb_collection,
    ).batch_persist(records)

    logger.info("Carga finalizada: %s", result)
    return result


@flow(name="public-procurement-opportunities-etl")
def procurement_etl_flow(
    params: Optional[Dict[str, Any]] = None,
    max_pages: Optional[int] = None,
    mongodb_db: str = MONGODB_DB_NAME,
    mongodb_collection: str = MONGODB_COLLECTION_NAME,
) -> Dict[str, Any]:
    logger = get_run_logger()
    resolved_params = params or RECIFE_PROCUREMENT

    logger.info("Pipeline ETL iniciado.")

    initialize_database()
    extracted_records = extract_procurements(resolved_params, max_pages=max_pages)
    transformed_records = transform_procurements(extracted_records)
    load_result = load_procurements(
        transformed_records,
        mongodb_db,
        mongodb_collection,
    )

    result = {
        "extracted_count": len(extracted_records),
        "transformed_count": len(transformed_records),
        "load": load_result,
    }

    logger.info("Pipeline ETL finalizado: %s", result)
    return result


@flow(name="public-procurement-opportunities-streaming")
def procurement_streaming_flow(
    params: Optional[Dict[str, Any]] = None,
    max_pages: Optional[int] = None,
    timeout_ms: int = 1000,
    batch_size: int = 10,
    max_idle_polls: int = 30,
    startup_seconds: int = 5,
    worker_timeout_seconds: int = 300,
) -> Dict[str, Any]:
    logger = get_run_logger()
    resolved_params = params or RECIFE_PROCUREMENT

    logger.info("Pipeline streaming iniciado via Prefect + Kafka workers.")

    initialize_database()
    result = run_kafka_workers(
        params=resolved_params,
        max_pages=max_pages,
        timeout_ms=timeout_ms,
        batch_size=batch_size,
        max_idle_polls=max_idle_polls,
        startup_seconds=startup_seconds,
        worker_timeout_seconds=worker_timeout_seconds,
    )

    logger.info("Pipeline streaming finalizado: %s", result)
    return result
