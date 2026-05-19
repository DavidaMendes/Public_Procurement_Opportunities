import os

from dotenv import load_dotenv
from prefect import flow, task, get_run_logger

from app.core.settings import RECIFE_PROCUREMENT
from app.etl.extract import Extract
from app.etl.load import Load
from app.etl.transform import Transform


load_dotenv()


@task(name="Extract procurements", retries=3, retry_delay_seconds=10)
def extract_procurements(params: dict) -> dict:
    logger = get_run_logger()
    logger.info("Iniciando extração dos dados da API PNCP.")

    data = Extract().extract_procurements(params)
    if not data:
        raise ValueError("Nenhum dado foi retornado pela API.")

    total_records = len(data.get("data", []))
    logger.info("Extração finalizada com %s registros recebidos.", total_records)
    return data


@task(name="Transform procurements")
def transform_procurements(data: dict) -> list:
    logger = get_run_logger()
    logger.info("Iniciando transformação dos dados.")

    transformed_data = Transform().transform_data(data)

    logger.info(
        "Transformação finalizada com %s registros aprovados.",
        len(transformed_data),
    )
    return transformed_data


@task(name="Load procurements")
def load_procurements(data: list, database_name: str, collection_name: str) -> int:
    logger = get_run_logger()

    if not database_name:
        raise ValueError("A variável DATABASE_NAME não foi configurada.")
    if not collection_name:
        raise ValueError("A variável COLLECTION_NAME não foi configurada.")

    if not data:
        logger.info("Nenhum registro para carregar no MongoDB.")
        return 0

    logger.info(
        "Iniciando carga de %s registros em %s.%s.",
        len(data),
        database_name,
        collection_name,
    )

    Load().insert_data(data, database_name, collection_name)

    logger.info("Carga finalizada com sucesso.")
    return len(data)


@flow(name="public-procurement-opportunities-etl")
def procurement_etl_flow(
    params: dict | None = None,
    database_name: str | None = None,
    collection_name: str | None = None,
) -> dict:
    logger = get_run_logger()

    resolved_params = params or RECIFE_PROCUREMENT
    resolved_database_name = database_name or os.getenv("DATABASE_NAME")
    resolved_collection_name = collection_name or os.getenv("COLLECTION_NAME")

    logger.info("Pipeline ETL iniciado.")

    extracted_data = extract_procurements(resolved_params)
    transformed_data = transform_procurements(extracted_data)
    inserted_count = load_procurements(
        transformed_data,
        resolved_database_name,
        resolved_collection_name,
    )

    result = {
        "extracted_count": len(extracted_data.get("data", [])),
        "transformed_count": len(transformed_data),
        "inserted_count": inserted_count,
    }

    logger.info("Pipeline ETL finalizado: %s", result)
    return result


if __name__ == "__main__":
    procurement_etl_flow()
