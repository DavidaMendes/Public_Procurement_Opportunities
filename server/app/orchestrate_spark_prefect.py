import os
 
from dotenv import load_dotenv
from prefect import flow, task, get_run_logger
 
from app.etl.spark.spark_extract import SparkExtract
from app.etl.spark.spark_transform import SparkTransform
from app.etl.spark.spark_load import SparkLoad
from app.core.spark_session import create_spark_session
 
from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
 
_DEFAULT_SQLITE_PATH = os.getenv("SQLITE_DB_PATH", "data/procurement.db")
_DEFAULT_SQLITE_TABLE = os.getenv("SQLITE_TABLE_NAME", "procurements")
 
 
@task(name="Spark: read MongoDB")
def spark_read_mongodb(database: str, collection: str):
    logger = get_run_logger()
    logger.info("Iniciando leitura do MongoDB Atlas com Spark.")
 
    spark = create_spark_session()
    df = SparkExtract(spark).read_collection(database, collection)
 
    total = df.count()
    logger.info("Spark leu %s documentos de %s.%s.", total, database, collection)
    return df
 
 
@task(name="Spark: transform to tabular")
def spark_transform(df):
    logger = get_run_logger()
    logger.info("Iniciando transformação Spark.")
 
    transformed = SparkTransform().transform(df)
 
    logger.info(
        "Transformação concluída: %s linhas, %s colunas.",
        transformed.count(),
        len(transformed.columns),
    )
    return transformed
 
 
@task(name="Spark: load to SQLite")
def spark_load_sqlite(
    df,
    db_path: str,
    table_name: str,
    if_exists: str = "append",
) -> int:
    logger = get_run_logger()
    logger.info("Carregando dados no SQLite: %s → tabela '%s'.", db_path, table_name)
 
    rows = SparkLoad(db_path).save(df, table_name, if_exists=if_exists)
 
    logger.info("%s linhas inseridas no SQLite.", rows)
    return rows
 
 
@flow(name="spark-procurement-etl")
def spark_procurement_etl_flow(
    database_name: str | None = None,
    collection_name: str | None = None,
    sqlite_path: str | None = None,
    sqlite_table: str | None = None,
    if_exists: str = "append",
) -> dict:

    logger = get_run_logger()
 
    resolved_db = database_name or os.getenv("DATABASE_NAME")
    resolved_col = collection_name or os.getenv("COLLECTION_NAME")
    resolved_sqlite = sqlite_path or _DEFAULT_SQLITE_PATH
    resolved_table = sqlite_table or _DEFAULT_SQLITE_TABLE
 
    if not resolved_db:
        raise ValueError("DATABASE_NAME não configurado.")
    if not resolved_col:
        raise ValueError("COLLECTION_NAME não configurado.")
 
    logger.info("Spark ETL iniciado → lendo %s.%s", resolved_db, resolved_col)
 
    df_raw = spark_read_mongodb(resolved_db, resolved_col)
    df_structured = spark_transform(df_raw)
    inserted = spark_load_sqlite(df_structured, resolved_sqlite, resolved_table, if_exists)
 
    result = {
        "source_collection": f"{resolved_db}.{resolved_col}",
        "sqlite_path": resolved_sqlite,
        "sqlite_table": resolved_table,
        "rows_inserted": inserted,
    }
    logger.info("Spark ETL finalizado: %s", result)
    return result
 
 
if __name__ == "__main__":
    spark_procurement_etl_flow()