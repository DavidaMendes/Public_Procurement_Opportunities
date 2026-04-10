from app.etl.extract import Extract
from app.etl.transform import Transform
from app.etl.load import Load
from dotenv import load_dotenv
from app.core.settings import RECIFE_PROCUREMENT
import os

load_dotenv()

DATABASE_NAME = os.getenv("DATABASE_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")

params = RECIFE_PROCUREMENT

def run_etl():

    extractor = Extract()
    transformer = Transform()
    loader = Load()
    
    print("Extraindo dados da API...")
    data = extractor.extract_procurements(params)

    if not data:
        print("Nenhum dado retornado da API.")
        return
    
    transformed_data = transformer.transform_data(data)

    print("Carregando dados no database...")
    loader.insert_data(transformed_data, DATABASE_NAME, COLLECTION_NAME)

    print("ETL Finalizado com sucesso.")

if __name__ == "__main__":
    run_etl()