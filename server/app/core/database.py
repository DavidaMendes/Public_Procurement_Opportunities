import sqlite3
from pathlib import Path
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URI = os.getenv("DATABASE_URI")
SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", "./data/licitacoes.db")

# MongoDB Client
try:
    mongo_client = MongoClient(DATABASE_URI, server_api=ServerApi('1')) if DATABASE_URI else None
except Exception as e:
    print(f"MongoDB connection error: {e}")
    mongo_client = None

# SQLite Client
def get_sqlite_connection():
    Path(SQLITE_DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_sqlite_db():
    conn = get_sqlite_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS licitacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_controle_pncp TEXT UNIQUE NOT NULL,
            orgao_cnpj TEXT,
            orgao_razao_social TEXT,
            data_publicacao DATE,
            valor_total_estimado REAL,
            modalidade TEXT,
            situacao_compra TEXT,
            objeto_compra TEXT,
            ano_mes TEXT,
            extracted_at TIMESTAMP,
            pagina INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_numero_controle
        ON licitacoes(numero_controle_pncp)
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_ano_mes
        ON licitacoes(ano_mes)
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_orgao_cnpj
        ON licitacoes(orgao_cnpj)
    """)

    conn.commit()
    conn.close()

# Legacy MongoDB client for backward compatibility
client = mongo_client


