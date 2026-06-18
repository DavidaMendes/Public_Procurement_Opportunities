"""Extract Worker - Kafka Producer for PNCP data extraction."""
import argparse
import json
import time
from datetime import datetime

from confluent_kafka import Producer

from app.etl.extract import Extract
from app.infrastructure.config import KAFKA_TOPICS, PRODUCER_CONFIG, RECIFE_PROCUREMENT
from app.infrastructure.logging_config import configure_logging, get_logger

logger = get_logger("extract")


def delivery_report(err, msg):
    """Delivery report callback."""
    if err is not None:
        logger.error(
            "Falha na entrega da mensagem ao Kafka",
            extra={
                "event": "delivery_failed",
                "topic": msg.topic() if msg is not None else None,
                "reason": str(err),
            },
        )
    else:
        logger.debug(
            "Mensagem entregue ao Kafka",
            extra={
                "event": "delivered",
                "topic": msg.topic(),
                "partition": msg.partition(),
                "offset": msg.offset(),
            },
        )


class ExtractWorker:
    def __init__(self):
        self.producer = Producer(PRODUCER_CONFIG)
        self.extractor = Extract()

    def run(self, params: dict, max_pages: int = None):
        """Extract data from PNCP API and publish to Kafka."""
        params['extracted_at'] = datetime.utcnow().isoformat() + 'Z'
        started = time.monotonic()

        logger.info(
            "Extração iniciada",
            extra={"event": "stage_start", "topic": KAFKA_TOPICS['raw_licitacoes'], "max_pages": max_pages},
        )

        try:
            record_count = 0
            error_count = 0

            for record in self.extractor.extract_paginated(params, max_pages):
                try:
                    message = json.dumps(record, ensure_ascii=False, default=str)
                    key = record['payload'].get('numeroControlePNCP', '')

                    self.producer.produce(
                        topic=KAFKA_TOPICS['raw_licitacoes'],
                        value=message.encode('utf-8'),
                        key=key.encode('utf-8'),
                        callback=delivery_report,
                    )

                    record_count += 1
                    logger.debug(
                        "Registro publicado",
                        extra={"event": "record_published", "topic": KAFKA_TOPICS['raw_licitacoes'], "key": key},
                    )

                    if record_count % 10 == 0:
                        self.producer.flush(timeout=5)
                        logger.info(
                            "Progresso de publicação",
                            extra={"event": "publish_progress", "count": record_count},
                        )

                except Exception as exc:
                    error_record = {
                        'error': str(exc),
                        'original_record': record,
                        'timestamp': datetime.utcnow().isoformat() + 'Z',
                    }
                    error_message = json.dumps(error_record, ensure_ascii=False, default=str)

                    self.producer.produce(
                        topic=KAFKA_TOPICS['raw_licitacoes_dlq'],
                        value=error_message.encode('utf-8'),
                        callback=delivery_report,
                    )

                    error_count += 1
                    logger.warning(
                        "Registro enviado para a DLQ",
                        extra={"event": "dlq_sent", "dlq_topic": KAFKA_TOPICS['raw_licitacoes_dlq'], "reason": str(exc)},
                    )

            self.producer.flush(timeout=10)
            logger.info(
                "Extração concluída",
                extra={
                    "event": "stage_end",
                    "count": record_count,
                    "error_count": error_count,
                    "duration_ms": round((time.monotonic() - started) * 1000),
                },
            )

        except Exception:
            logger.error("Erro durante a extração", extra={"event": "error"}, exc_info=True)
            raise


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Extract data from PNCP API')
    parser.add_argument('--dataInicial', type=str, default=RECIFE_PROCUREMENT['dataInicial'],
                        help=f"Data inicial (padrão: {RECIFE_PROCUREMENT['dataInicial']})")
    parser.add_argument('--dataFinal', type=str, default=RECIFE_PROCUREMENT['dataFinal'],
                        help=f"Data final (padrão: {RECIFE_PROCUREMENT['dataFinal']})")
    parser.add_argument('--codigoModalidadeContratacao', type=str,
                        default=RECIFE_PROCUREMENT.get('codigoModalidadeContratacao'),
                        help="Código modalidade (opcional)")
    parser.add_argument('--codigoMunicipioIbge', type=str,
                        default=RECIFE_PROCUREMENT.get('codigoMunicipioIbge'),
                        help="Código município IBGE (opcional)")
    parser.add_argument('--tamanhoPagina', type=int, default=50,
                        help="Tamanho página (padrão: 50)")
    parser.add_argument('--maxPages', type=int, default=None,
                        help='Máximo de páginas (opcional)')

    args = parser.parse_args()

    configure_logging(component="extract")

    params = {
        'dataInicial': args.dataInicial,
        'dataFinal': args.dataFinal,
        'tamanhoPagina': args.tamanhoPagina,
        'pagina': '1',
    }

    if args.codigoModalidadeContratacao:
        params['codigoModalidadeContratacao'] = args.codigoModalidadeContratacao

    if args.codigoMunicipioIbge:
        params['codigoMunicipioIbge'] = args.codigoMunicipioIbge

    worker = ExtractWorker()
    worker.run(params, max_pages=args.maxPages)
