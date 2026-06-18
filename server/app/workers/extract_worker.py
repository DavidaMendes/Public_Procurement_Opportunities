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
    """Kafka delivery callback."""
    if err is not None:
        logger.error(
            "Falha na entrega da mensagem ao Kafka",
            extra={
                "event": "delivery_failed",
                "topic": msg.topic() if msg is not None else None,
                "reason": str(err),
            },
        )
        return

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
        self.bronze_load_topic = KAFKA_TOPICS["load_bronze_licitacoes"]
        self.transform_topic = KAFKA_TOPICS["transform_licitacoes"]
        self.extract_dlq_topic = KAFKA_TOPICS["transform_licitacoes_dlq"]

    def _publish_record_to_bronze_load_topic(self, message: bytes, message_key: bytes):
        self.producer.produce(
            topic=self.bronze_load_topic,
            value=message,
            key=message_key,
            callback=delivery_report,
        )

    def _publish_record_to_transform_topic(self, message: bytes, message_key: bytes):
        self.producer.produce(
            topic=self.transform_topic,
            value=message,
            key=message_key,
            callback=delivery_report,
        )

    def _publish_extracted_record_to_streaming_topics(self, record: dict) -> str:
        message = json.dumps(record, ensure_ascii=False, default=str).encode("utf-8")
        key = record["payload"].get("numeroControlePNCP", "")
        message_key = key.encode("utf-8")

        self._publish_record_to_bronze_load_topic(message, message_key)
        self._publish_record_to_transform_topic(message, message_key)
        self.producer.poll(0)

        return key

    def _publish_extract_error_to_dlq(self, record: dict, exc: Exception):
        error_record = {
            "error": str(exc),
            "original_record": record,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        error_message = json.dumps(error_record, ensure_ascii=False, default=str)

        self.producer.produce(
            topic=self.extract_dlq_topic,
            value=error_message.encode("utf-8"),
            callback=delivery_report,
        )

    def run(self, params: dict, max_pages: int = None):
        """Extract data from PNCP API and publish to bronze-load and transform topics."""
        params["extracted_at"] = datetime.utcnow().isoformat() + "Z"
        started = time.monotonic()
        record_count = 0
        error_count = 0

        logger.info(
            "Extracao iniciada",
            extra={
                "event": "stage_start",
                "bronze_topic": self.bronze_load_topic,
                "transform_topic": self.transform_topic,
                "max_pages": max_pages,
            },
        )

        try:
            for record in self.extractor.extract_paginated(params, max_pages):
                try:
                    key = self._publish_extracted_record_to_streaming_topics(record)
                    record_count += 1

                    logger.debug(
                        "Registro publicado",
                        extra={
                            "event": "record_published",
                            "bronze_topic": self.bronze_load_topic,
                            "transform_topic": self.transform_topic,
                            "key": key,
                        },
                    )

                    if record_count % 10 == 0:
                        self.producer.flush(timeout=5)
                        logger.info(
                            "Progresso de publicacao",
                            extra={"event": "publish_progress", "count": record_count},
                        )

                except Exception as exc:
                    self._publish_extract_error_to_dlq(record, exc)
                    error_count += 1
                    logger.warning(
                        "Registro enviado para a DLQ",
                        extra={
                            "event": "dlq_sent",
                            "dlq_topic": self.extract_dlq_topic,
                            "reason": str(exc),
                        },
                    )

            self.producer.flush(timeout=10)
            logger.info(
                "Extracao concluida",
                extra={
                    "event": "stage_end",
                    "count": record_count,
                    "error_count": error_count,
                    "duration_ms": round((time.monotonic() - started) * 1000),
                },
            )

        except Exception:
            logger.error("Erro durante a extracao", extra={"event": "error"}, exc_info=True)
            raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract data from PNCP API")
    parser.add_argument(
        "--dataInicial",
        type=str,
        default=RECIFE_PROCUREMENT["dataInicial"],
        help=f"Data inicial (padrao: {RECIFE_PROCUREMENT['dataInicial']})",
    )
    parser.add_argument(
        "--dataFinal",
        type=str,
        default=RECIFE_PROCUREMENT["dataFinal"],
        help=f"Data final (padrao: {RECIFE_PROCUREMENT['dataFinal']})",
    )
    parser.add_argument(
        "--codigoModalidadeContratacao",
        type=str,
        default=RECIFE_PROCUREMENT.get("codigoModalidadeContratacao"),
        help="Codigo modalidade (opcional)",
    )
    parser.add_argument(
        "--codigoMunicipioIbge",
        type=str,
        default=RECIFE_PROCUREMENT.get("codigoMunicipioIbge"),
        help="Codigo municipio IBGE (opcional)",
    )
    parser.add_argument("--tamanhoPagina", type=int, default=50, help="Tamanho pagina (padrao: 50)")
    parser.add_argument("--maxPages", type=int, default=None, help="Maximo de paginas (opcional)")

    args = parser.parse_args()

    configure_logging(component="extract")

    params = {
        "dataInicial": args.dataInicial,
        "dataFinal": args.dataFinal,
        "tamanhoPagina": args.tamanhoPagina,
        "pagina": "1",
    }

    if args.codigoModalidadeContratacao:
        params["codigoModalidadeContratacao"] = args.codigoModalidadeContratacao

    if args.codigoMunicipioIbge:
        params["codigoMunicipioIbge"] = args.codigoMunicipioIbge

    worker = ExtractWorker()
    worker.run(params, max_pages=args.maxPages)
