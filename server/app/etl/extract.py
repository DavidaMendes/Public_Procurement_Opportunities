import requests
from app.core.settings import PNCP_BASE_URL
from app.core.exceptions import NonRetryableAPIError
from typing import Dict, Generator, Any
import time

class Extract():
    def __init__(self, timeout: int = 30, max_retries: int = 3):
        self.timeout = timeout
        self.max_retries = max_retries

    def extract_procurements(self, params: dict) -> Dict[str, Any]:
        """Extract single page from PNCP API."""
        try:
            response = requests.get(
                PNCP_BASE_URL,
                params=params,
                timeout=self.timeout
            )

            if response.status_code == 422:
                raise NonRetryableAPIError(f"Erro 422 - parâmetros inválidos: {response.text}")

            response.raise_for_status()
            return response.json()

        except requests.exceptions.ReadTimeout as err:
            raise err
        except requests.exceptions.HTTPError as err:
            raise err

    def extract_paginated(self, params: dict, max_pages: int = None) -> Generator[Dict[str, Any], None, None]:
        """
        Extract procurements with pagination support.
        Yields individual records from each page.
        """
        current_page = int(params.get('pagina', 1))
        page_size = int(params.get('tamanhoPagina', 50))
        pages_fetched = 0

        while True:
            if max_pages and pages_fetched >= max_pages:
                break

            params['pagina'] = str(current_page)

            try:
                response_data = self.extract_procurements(params)
                data = response_data.get('data', [])

                if not data:
                    break

                for record in data:
                    yield {
                        'extracted_at': params.get('extracted_at'),
                        'pagina': current_page,
                        'payload': record
                    }

                pages_fetched += 1
                current_page += 1
                time.sleep(0.5)  # Rate limiting

            except NonRetryableAPIError:
                break
            except Exception as e:
                print(f"Erro na página {current_page}: {str(e)}")
                break

