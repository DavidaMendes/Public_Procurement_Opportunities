from pyspark.sql import SparkSession, DataFrame
 
 
class SparkExtract: 
    def __init__(self, spark: SparkSession):
        self.spark = spark
 
    def read_collection(self, database: str, collection: str) -> DataFrame:
        df = (
            self.spark.read.format("mongodb")
            .option("database", database)
            .option("collection", collection)
            .load()
        )
        print(f"[SparkExtract] Lidos {df.count()} documentos de {database}.{collection}")
        return df
 