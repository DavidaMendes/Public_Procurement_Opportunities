from app.core.database import client

class Load():
    def __init__(self):
        pass

    def insert_data(self, api_response: dict, db_name: str, table_name: str):
        database = client[db_name]
        collection = database[table_name]

        procurements_list = api_response.get("data", [])

        if procurements_list and isinstance(procurements_list, list):
            collection.insert_many(procurements_list)
            print(f"{len(procurements_list)} documentos inseridos com sucesso.")
        else:
            print("Nenhum dado válido para inserir")
