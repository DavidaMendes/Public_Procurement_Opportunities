import sqlite3
from pathlib import Path
 
from pyspark.sql import DataFrame
 
 
class SparkLoad:
    def __init__(self, db_path: str):
        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
 
    def save(
        self,
        df: DataFrame,
        table_name: str,
        if_exists: str = "append",
    ) -> int:

        pandas_df = df.toPandas()
 
        if pandas_df.empty:
            print("[SparkLoad] Nenhum dado para salvar no SQLite.")
            return 0
 
        for col in pandas_df.select_dtypes(include=["datetime64[ns]", "datetimetz"]):
            pandas_df[col] = pandas_df[col].astype(str)
 
        conn = sqlite3.connect(self.db_path)
        try:
            pandas_df.to_sql(
                name=table_name,
                con=conn,
                if_exists=if_exists,
                index=False,
                method="multi",   
                chunksize=500,
            )
            conn.commit()
            rows = len(pandas_df)
            print(f"[SparkLoad] {rows} linhas salvas em '{self.db_path}' tabela '{table_name}'.")
            return rows
        finally:
            conn.close()