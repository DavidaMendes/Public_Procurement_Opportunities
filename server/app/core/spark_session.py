import os
from pathlib import Path
from dotenv import load_dotenv
from pyspark.sql import SparkSession

_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(_ROOT / ".env")
 
load_dotenv()
 
_MONGO_SPARK_PKG = "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0"
 
 
def create_spark_session(app_name: str = "procurement-spark-etl") -> SparkSession:

    mongo_uri = os.getenv("DATABASE_URI")
    if not mongo_uri:
        raise EnvironmentError(
            "DATABASE_URI não está definida no .env. "
            "Adicione a variável com a connection string do Atlas."
        )
 
    spark = (
        SparkSession.builder.appName(app_name)
        .config("spark.jars.packages", _MONGO_SPARK_PKG)
        .config("spark.mongodb.read.connection.uri", mongo_uri)
        .config("spark.mongodb.read.partitioner", "MongoSinglePartitioner")
        .config("spark.driver.extraJavaOptions", "-Dlog4j.logger.org.mongodb=WARN")
        .getOrCreate()
    )
 
    spark.sparkContext.setLogLevel("WARN")
    return spark