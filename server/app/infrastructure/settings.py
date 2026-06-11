"""Legacy settings module - consolidated into config.py for backward compatibility."""
from app.infrastructure.config import (
    PNCP_BASE_URL,
    RECIFE_PROCUREMENT,
    SQLITE_DB_PATH,
    DATABASE_URI,
    KAFKA_BOOTSTRAP_SERVERS,
)

__all__ = [
    'PNCP_BASE_URL',
    'RECIFE_PROCUREMENT',
    'SQLITE_DB_PATH',
    'DATABASE_URI',
    'KAFKA_BOOTSTRAP_SERVERS',
]
