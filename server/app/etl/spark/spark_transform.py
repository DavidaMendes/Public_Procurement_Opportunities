from pyspark.sql import DataFrame
from pyspark.sql import functions as F
from pyspark.sql.types import (
    DoubleType,
    IntegerType,
    StringType,
    TimestampType,
)
 
COLUMNS_SCHEMA = {
    "numeroControlePNCP":     StringType(),
    "orgaoEntidade":          StringType(),   
    "modalidadeNome":         StringType(),
    "objetoCompra":           StringType(),
    "valorTotalEstimado":     DoubleType(),
    "valorTotalHomologado":   DoubleType(),
    "dataPublicacaoPncp":     StringType(),
    "dataAberturaProposta":   StringType(),
    "dataEncerramentoProposta": StringType(),
    "situacaoCompraId":       IntegerType(),
    "situacaoCompraNome":     StringType(),
    "ufNome":                 StringType(),
    "municipioNome":          StringType(),
    "linkSistemaOrigem":      StringType(),
}
 
 
class SparkTransform:
    def transform(self, df: DataFrame) -> DataFrame:
        df = self._flatten_nested(df)
        df = self._select_and_cast(df)
        df = self._parse_dates(df)
        df = self._add_metadata(df)
        print(f"[SparkTransform] DataFrame final: {df.count()} linhas, {len(df.columns)} colunas")
        return df

 
    def _flatten_nested(self, df: DataFrame) -> DataFrame:
        existing = set(df.columns)
        if "orgaoEntidade" in existing:
            df = df.withColumn(
                "orgaoEntidade",
                F.when(
                    F.col("orgaoEntidade").isNotNull(),
                    F.col("orgaoEntidade.razaoSocial"),
                ).otherwise(F.lit(None).cast(StringType())),
            )
 
        if "unidadeOrgao" in existing:
            df = df.withColumn(
                "municipioNome",
                F.col("unidadeOrgao.municipioNome"),
            ).withColumn(
                "ufNome",
                F.col("unidadeOrgao.ufNome"),
            ).drop("unidadeOrgao")
 
        return df
 
    def _select_and_cast(self, df: DataFrame) -> DataFrame:
        existing = set(df.columns)
        exprs = []
        for col_name, col_type in COLUMNS_SCHEMA.items():
            if col_name in existing:
                exprs.append(F.col(col_name).cast(col_type).alias(col_name))
            else:
                exprs.append(F.lit(None).cast(col_type).alias(col_name))
        return df.select(exprs)
 
    def _parse_dates(self, df: DataFrame) -> DataFrame:
        date_cols = [
            "dataPublicacaoPncp",
            "dataAberturaProposta",
            "dataEncerramentoProposta",
        ]
        for col in date_cols:
            if col in df.columns:
                df = df.withColumn(col, F.to_timestamp(F.col(col)))
        return df
 
    def _add_metadata(self, df: DataFrame) -> DataFrame:
        return df.withColumn(
            "processado_em",
            F.current_timestamp().cast(TimestampType()),
        )
 