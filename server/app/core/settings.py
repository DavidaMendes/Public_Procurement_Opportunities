import os
from dotenv import load_dotenv

load_dotenv()

PNCP_BASE_URL = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao"

RECIFE_PROCUREMENT = {
    "dataInicial": "20260601",
    "dataFinal": "20260602",
    "codigoModalidadeContratacao": "8",
    "codigoMunicipioIbge": "2611606",
    "pagina": "1",
    "tamanhoPagina": "3",
}

# Database Configuration
SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", "./data/licitacoes.db")
DATABASE_URI = os.getenv("DATABASE_URI")

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")