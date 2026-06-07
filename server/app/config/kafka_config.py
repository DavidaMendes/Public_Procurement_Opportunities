"""Kafka configuration module."""
import os
from dotenv import load_dotenv

load_dotenv()

KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')

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

# Consumer Configuration
CONSUMER_CONFIG = {
    'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
    'auto.offset.reset': 'earliest',
    'enable.auto.commit': False,
    'session.timeout.ms': 30000,
}

# Transform Worker Consumer
TRANSFORM_CONSUMER_CONFIG = {
    **CONSUMER_CONFIG,
    'group.id': KAFKA_CONSUMER_GROUPS['transform'],
    'client.id': 'transform-consumer',
}

# Load Worker Consumer
LOAD_CONSUMER_CONFIG = {
    **CONSUMER_CONFIG,
    'group.id': KAFKA_CONSUMER_GROUPS['load'],
    'client.id': 'load-consumer',
}
