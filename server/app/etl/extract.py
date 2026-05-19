import requests
from app.core.settings import PNCP_BASE_URL
from app.core.exceptions import NonRetryableAPIError

class Extract():
    def __init__(self):
        pass

    def extract_procurements(self, params: dict):
        try:
            response = requests.get(PNCP_BASE_URL, params=params)

            if response.status_code == 422:
                raise NonRetryableAPIError(f"Erro 422 - parâmetros inválidos: {response.text}")
            
            response.raise_for_status()
            print("Dados extraídos da API com sucesso.")
            return response.json() 
        
        except requests.exceptions.ReadTimeout as err:
            raise err

        except requests.exceptions.HTTPError as err:
            raise err 
