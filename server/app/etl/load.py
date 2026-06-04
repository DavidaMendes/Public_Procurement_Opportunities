from app.core.database import client, get_sqlite_connection
from typing import Dict, Any, List
from datetime import datetime
import sqlite3

class Load():
    def __init__(self):
        pass

    def insert_data(self, api_response: list, db_name: str, table_name: str):
        """Legacy method for MongoDB insertion."""
        if not client:
            print("MongoDB client not available")
            return

        database = client[db_name]
        collection = database[table_name]

        if api_response and isinstance(api_response, list):
            collection.insert_many(api_response)
            print(f"{len(api_response)} documentos inseridos com sucesso.")
        else:
            print("Nenhum dado válido para inserir")

    def upsert_licitacao(self, record: Dict[str, Any]) -> bool:
        """
        Upsert a single procurement record into SQLite.
        Uses numero_controle_pncp as unique key.
        """
        try:
            conn = get_sqlite_connection()
            cursor = conn.cursor()

            numero_controle = record.get('numero_controle_pncp')
            if not numero_controle:
                return False

            now = datetime.now().isoformat()

            # Check if record exists
            cursor.execute(
                "SELECT id FROM licitacoes WHERE numero_controle_pncp = ?",
                (numero_controle,)
            )
            existing = cursor.fetchone()

            if existing:
                # Update
                cursor.execute("""
                    UPDATE licitacoes
                    SET
                        orgao_cnpj = ?,
                        orgao_razao_social = ?,
                        data_publicacao = ?,
                        valor_total_estimado = ?,
                        modalidade = ?,
                        situacao_compra = ?,
                        objeto_compra = ?,
                        ano_mes = ?,
                        extracted_at = ?,
                        pagina = ?,
                        updated_at = ?
                    WHERE numero_controle_pncp = ?
                """, (
                    record.get('orgao_cnpj'),
                    record.get('orgao_razao_social'),
                    record.get('data_publicacao'),
                    record.get('valor_total_estimado'),
                    record.get('modalidade'),
                    record.get('situacao_compra'),
                    record.get('objeto_compra'),
                    record.get('ano_mes'),
                    record.get('extracted_at'),
                    record.get('pagina'),
                    now,
                    numero_controle
                ))
            else:
                # Insert
                cursor.execute("""
                    INSERT INTO licitacoes (
                        numero_controle_pncp,
                        orgao_cnpj,
                        orgao_razao_social,
                        data_publicacao,
                        valor_total_estimado,
                        modalidade,
                        situacao_compra,
                        objeto_compra,
                        ano_mes,
                        extracted_at,
                        pagina,
                        created_at,
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    numero_controle,
                    record.get('orgao_cnpj'),
                    record.get('orgao_razao_social'),
                    record.get('data_publicacao'),
                    record.get('valor_total_estimado'),
                    record.get('modalidade'),
                    record.get('situacao_compra'),
                    record.get('objeto_compra'),
                    record.get('ano_mes'),
                    record.get('extracted_at'),
                    record.get('pagina'),
                    now,
                    now
                ))

            conn.commit()
            conn.close()
            return True

        except sqlite3.Error as e:
            print(f"Erro ao fazer upsert do registro {numero_controle}: {e}")
            return False

    def batch_upsert_licitacoes(self, records: List[Dict[str, Any]]) -> int:
        """
        Upsert multiple records into SQLite.
        Returns number of successfully inserted/updated records.
        """
        success_count = 0
        for record in records:
            if self.upsert_licitacao(record):
                success_count += 1
        return success_count

