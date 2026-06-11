"""Centralized configuration module for Kafka and application settings."""
import os
from dotenv import load_dotenv

load_dotenv()

# ============================================================================
# PNCP API Configuration
# ============================================================================

PNCP_BASE_URL = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao"

RECIFE_PROCUREMENT = {
    "dataInicial": "20260601",
    "dataFinal": "20260602",
    "codigoModalidadeContratacao": "8",
    "codigoMunicipioIbge": "2611606",
    "pagina": "1",
    "tamanhoPagina": "50",
}

# ============================================================================
# Database Configuration
# ============================================================================

SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", "./data/licitacoes.db")
DATABASE_URI = os.getenv("DATABASE_URI")
MONGODB_DB_NAME = "procurement"
MONGODB_COLLECTION_NAME = "licitacoes"

# ============================================================================
# Kafka Configuration
# ============================================================================

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

# Topics
KAFKA_TOPICS = {
    'raw_licitacoes': 'raw.licitacoes',
    'transformed_licitacoes': 'transformed.licitacoes',
    'raw_licitacoes_dlq': 'raw.licitacoes.dlq',
    'transformed_licitacoes_dlq': 'transformed.licitacoes.dlq',
}

# Consumer Groups
KAFKA_CONSUMER_GROUPS = {
    'transform': 'transform-group',
    'load': 'load-group',
}

# Producer Configuration
PRODUCER_CONFIG = {
    'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
    'client.id': 'extract-producer',
    'acks': 'all',
    'retries': 3,
    'linger.ms': 100,
}

# Consumer Configuration (Base)
CONSUMER_CONFIG = {
    'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
    'auto.offset.reset': 'earliest',
    'enable.auto.commit': False,
    'session.timeout.ms': 30000,
}

# Transform Worker Consumer Configuration
TRANSFORM_CONSUMER_CONFIG = {
    **CONSUMER_CONFIG,
    'group.id': KAFKA_CONSUMER_GROUPS['transform'],
    'client.id': 'transform-consumer',
}

# Load Worker Consumer Configuration
LOAD_CONSUMER_CONFIG = {
    **CONSUMER_CONFIG,
    'group.id': KAFKA_CONSUMER_GROUPS['load'],
    'client.id': 'load-consumer',
}
