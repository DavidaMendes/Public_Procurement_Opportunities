from app.core.database import client

class Load():
    def __init__(self):
        pass

    def insert_data(self, api_response: list, db_name: str, table_name: str):
        database = client[db_name]
        collection = database[table_name]

        if api_response and isinstance(api_response, list):
            collection.insert_many(api_response)
            print(f"{len(api_response)} documentos inseridos com sucesso.")
        else:
            print("Nenhum dado válido para inserir")
