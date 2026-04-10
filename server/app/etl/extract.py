import requests
from app.core.settings import PNCP_BASE_URL

class Extract():
    def __init__(self):
        pass

    def extract_procurements(self, params: dict):
        try:
            response = requests.get(PNCP_BASE_URL, params=params)
            response.raise_for_status()
            print("Dados extraídos da API com sucesso.")
            return response.json() 
        except requests.exceptions.HTTPError as errHttp:
            print("HTTP Error")
            print(errHttp.args[0])
        except requests.exceptions.ReadTimeout as errTimeout:
            print(f"Timeout on connection: {errTimeout.args[0]}")
