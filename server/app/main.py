from app.etl.extract import Extract
#from app.etl.transform import Transform
from app.etl.load import Load
from dotenv import load_dotenv
import os


load_dotenv()

DATABASE_NAME = os.getenv("DATABASE_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")

def run_etl():
    params = { 
        "dataFinal": "20260430",
        "codigoModalidadeContratacao": "8",
        "uf": "pe",
        "pagina": "1",
        "tamanhoPagina": "20",
    }

    extractor = Extract()
    #transformer = Transform()
    loader = Load()

    # implementar o transform aqui, se necessário
    
    # data é a resposta da api
    print("Extraindo dados da API...")
    data = extractor.extract_procurements(params)

    if not data:
        print("Nenhum dado retornado da API.")
        return
    
    print("Carregando dados no database...")
    loader.insert_data(data, DATABASE_NAME, COLLECTION_NAME)

    print("ETL Finalizado com sucesso.")

if __name__ == "__main__":
    run_etl()