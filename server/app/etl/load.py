from app.core.database import client, get_sqlite_connection
from typing import Dict, Any, List
from datetime import datetime
import sqlite3

class Load():
    def __init__(self, mongodb_db: str = "procurement", mongodb_collection: str = "licitacoes"):
        self.mongodb_db = mongodb_db
        self.mongodb_collection = mongodb_collection

    def _persist_to_sqlite(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Persist records to SQLite with upsert logic.
        Returns: {'inserted': count, 'updated': count, 'errors': count}
        """
        inserted = 0
        updated = 0
        errors = 0

        try:
            conn = get_sqlite_connection()
            cursor = conn.cursor()
            now = datetime.now().isoformat()

            for record in records:
                try:
                    numero_controle = record.get('numero_controle_pncp')
                    if not numero_controle:
                        errors += 1
                        continue

                    cursor.execute(
                        "SELECT id FROM licitacoes WHERE numero_controle_pncp = ?",
                        (numero_controle,)
                    )
                    existing = cursor.fetchone()

                    if existing:
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
                        updated += 1
                    else:
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
                        inserted += 1

                except sqlite3.Error as e:
                    errors += 1

            conn.commit()
            conn.close()

        except sqlite3.Error as e:
            return {'inserted': inserted, 'updated': updated, 'errors': len(records)}

        return {'inserted': inserted, 'updated': updated, 'errors': errors}

    def _persist_to_mongodb(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Persist records to MongoDB.
        Returns: {'inserted': count, 'errors': count}
        """
        if not client:
            return {'inserted': 0, 'errors': len(records)}

        try:
            database = client[self.mongodb_db]
            collection = database[self.mongodb_collection]

            if records and isinstance(records, list):
                result = collection.insert_many(records)
                return {'inserted': len(result.inserted_ids), 'errors': 0}
            else:
                return {'inserted': 0, 'errors': 0}

        except Exception as e:
            return {'inserted': 0, 'errors': len(records)}

    def batch_persist(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Persist records to both SQLite and MongoDB.
        Returns consolidated result with separate counts for each database.
        """
        sqlite_result = self._persist_to_sqlite(records)
        mongodb_result = self._persist_to_mongodb(records)

        return {
            'sqlite': sqlite_result,
            'mongodb': mongodb_result,
            'total_records': len(records),
            'success': sqlite_result['errors'] == 0 and mongodb_result['errors'] == 0
        }

    def batch_upsert_licitacoes(self, records: List[Dict[str, Any]]) -> int:
        """
        Legacy method for backward compatibility.
        Calls batch_persist and returns only SQLite success count.
        """
        result = self.batch_persist(records)
        return result['sqlite']['inserted'] + result['sqlite']['updated']

    def insert_data(self, api_response: list, db_name: str, table_name: str):
        """Legacy method for standalone MongoDB insertion."""
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

