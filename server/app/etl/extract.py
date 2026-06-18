import time
from typing import Any, Dict, Generator

import requests

from app.infrastructure.exceptions import NonRetryableAPIError
from app.infrastructure.logging_config import get_logger
from app.infrastructure.settings import PNCP_BASE_URL

logger = get_logger("extract")


class Extract():
    def __init__(self, timeout: int = 60, max_retries: int = 3):
        self.timeout = timeout
        self.max_retries = max_retries

    def extract_procurements(self, params: dict) -> Dict[str, Any]:
        """Extract single page from PNCP API."""
        try:
            response = requests.get(
                PNCP_BASE_URL,
                params=params,
                timeout=self.timeout,
            )

            if response.status_code == 422:
                raise NonRetryableAPIError(f"Erro 422 - parâmetros inválidos: {response.text}")

            response.raise_for_status()
            try:
                return response.json()
            except requests.exceptions.JSONDecodeError:
                content_type = response.headers.get("content-type", "")
                body_preview = response.text[:300].replace("\n", " ").replace("\r", " ")
                raise NonRetryableAPIError(
                    "Resposta da API PNCP nao veio em JSON "
                    f"(status={response.status_code}, content_type={content_type}, body={body_preview!r})"
                ) from None

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

                logger.debug(
                    "Página obtida da API PNCP",
                    extra={"event": "page_fetched", "page": current_page, "record_count": len(data)},
                )

                for record in data:
                    yield {
                        'extracted_at': params.get('extracted_at'),
                        'pagina': current_page,
                        'payload': record,
                    }

                pages_fetched += 1
                current_page += 1
                time.sleep(0.5)

            except NonRetryableAPIError as exc:
                logger.warning(
                    "Extração interrompida por erro non-retryable",
                    extra={"event": "extract_stopped", "page": current_page, "reason": str(exc)},
                )
                break
            except Exception:
                logger.error(
                    "Erro ao extrair página",
                    extra={"event": "error", "page": current_page},
                    exc_info=True,
                )
                break
