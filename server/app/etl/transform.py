from datetime import datetime
from typing import Dict, Any
import re

class Transform():
    def __init__(self):
        pass

    def _normalize_field(self, value: str) -> str:
        """Normalize field to snake_case."""
        if not value:
            return ""
        value = value.lower()
        value = re.sub(r'[àáãäâ]', 'a', value)
        value = re.sub(r'[èéêë]', 'e', value)
        value = re.sub(r'[ìíîï]', 'i', value)
        value = re.sub(r'[òóôõö]', 'o', value)
        value = re.sub(r'[ùúûü]', 'u', value)
        value = re.sub(r'[ç]', 'c', value)
        value = re.sub(r'\W+', '_', value).strip('_')
        return value

    def _parse_date(self, date_str: str) -> str:
        """Convert date string to YYYY-MM-DD format."""
        if not date_str:
            return None
        try:
            for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%Y%m%d']:
                try:
                    return datetime.strptime(date_str.strip(), fmt).strftime('%Y-%m-%d')
                except ValueError:
                    continue
            return None
        except Exception:
            return None

    def _extract_ano_mes(self, date_str: str) -> str:
        """Extract YYYY-MM from date string."""
        if not date_str:
            return None
        parsed_date = self._parse_date(date_str)
        if parsed_date:
            return parsed_date[:7]
        return None

    def transform_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a single record from raw to normalized format."""
        payload = record.get('payload', {})

        data_publicacao = payload.get('dataPublicacaoPncp')
        ano_mes = self._extract_ano_mes(data_publicacao)

        transformed = {
            'numero_controle_pncp': payload.get('numeroControlePNCP'),
            'orgao_cnpj': payload.get('orgaoEntidade', {}).get('cnpj'),
            'orgao_razao_social': payload.get('orgaoEntidade', {}).get('razaoSocial'),
            'data_publicacao': self._parse_date(data_publicacao),
            'valor_total_estimado': float(payload.get('valorTotalEstimado') or 0.0),
            'modalidade': self._normalize_field(payload.get('modalidadeNome', '')),
            'situacao_compra': self._normalize_field(payload.get('situacaoCompraNome', '')),
            'objeto_compra': payload.get('objetoCompra'),
            'ano_mes': ano_mes,
            'extracted_at': record.get('extracted_at'),
            'pagina': record.get('pagina'),
        }

        return transformed

    def transform_data(self, data: Dict[str, Any]) -> list:
        """Transform a batch of records (legacy support)."""
        filtered_data = []
        for item in data.get('data', []):
            if item.get('valorTotalEstimado') is not None and item['valorTotalEstimado'] < 81000:
                filtered_data.append(item)
        return filtered_data

    