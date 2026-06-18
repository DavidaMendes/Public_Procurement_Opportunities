import argparse
import json
import time
from typing import Optional

from confluent_kafka import Consumer

from app.etl.load import Load
from app.infrastructure.config import KAFKA_TOPICS, LOAD_CONSUMER_CONFIG
from app.infrastructure.logging_config import configure_logging, get_logger

logger = get_logger("load")


class LoadWorker:
    def __init__(self):
        self.consumer = Consumer(LOAD_CONSUMER_CONFIG)
        self.loader = Load()

        self.consumer.subscribe([KAFKA_TOPICS["transformed_licitacoes"]])
        logger.info(
            "Inscrito no tópico de entrada",
            extra={"event": "subscribed", "topic": KAFKA_TOPICS["transformed_licitacoes"]},
        )

    def run(
        self,
        timeout_ms: int = 1000,
        batch_size: int = 10,
        max_idle_polls: Optional[int] = None,
        max_messages: Optional[int] = None,
    ):
        """Consume transformed data and persist to SQLite/MongoDB."""
        processed_count = 0
        error_count = 0
        idle_polls = 0
        batch = []
        started = time.monotonic()

        logger.info("Carga iniciada", extra={"event": "stage_start", "batch_size": batch_size})

        try:
            while True:
                msg = self.consumer.poll(timeout=timeout_ms / 1000)

                if msg is None:
                    idle_polls += 1
                    if batch:
                        success = self._persist_batch(batch)
                        if success:
                            self.consumer.commit(asynchronous=True)
                            processed_count += len(batch)
                        else:
                            error_count += len(batch)
                        batch = []

                    if max_idle_polls and idle_polls >= max_idle_polls:
                        logger.info(
                            "Encerrando por ociosidade",
                            extra={"event": "idle_shutdown", "idle_polls": idle_polls},
                        )
                        break
                    continue

                idle_polls = 0

                if msg.error():
                    if msg.error().code() != -191:  # _PARTITION_EOF
                        logger.warning(
                            "Erro reportado pelo Kafka",
                            extra={"event": "kafka_error", "reason": str(msg.error())},
                        )
                    continue

                try:
                    record = json.loads(msg.value().decode("utf-8"))
                    batch.append(record)

                    if len(batch) >= batch_size:
                        success = self._persist_batch(batch)
                        if success:
                            self.consumer.commit(asynchronous=True)
                            processed_count += len(batch)
                        else:
                            error_count += len(batch)
                        batch = []

                    if max_messages and processed_count >= max_messages:
                        logger.info(
                            "Limite de mensagens atingido",
                            extra={"event": "max_messages_reached", "count": processed_count},
                        )
                        break

                except Exception:
                    error_count += 1
                    logger.error("Erro ao processar registro", extra={"event": "error"}, exc_info=True)

        except KeyboardInterrupt:
            logger.info(
                "Carga interrompida manualmente",
                extra={"event": "interrupted", "count": processed_count, "error_count": error_count},
            )
        finally:
            if batch:
                self._persist_batch(batch)
            self.consumer.close()
            logger.info(
                "Carga finalizada",
                extra={
                    "event": "stage_end",
                    "count": processed_count,
                    "error_count": error_count,
                    "duration_ms": round((time.monotonic() - started) * 1000),
                },
            )

    def _persist_batch(self, batch: list) -> bool:
        """Persist a batch to SQLite and MongoDB; log structured results."""
        try:
            result = self.loader.batch_persist(batch)

            sqlite_res = result["sqlite"]
            mongodb_res = result["mongodb"]
            total = result["total_records"]

            logger.info(
                "Lote persistido",
                extra={
                    "event": "batch_persisted",
                    "batch_size": total,
                    "sqlite_inserted": sqlite_res["inserted"],
                    "sqlite_updated": sqlite_res["updated"],
                    "sqlite_errors": sqlite_res["errors"],
                    "mongodb_inserted": mongodb_res["inserted"],
                    "mongodb_errors": mongodb_res["errors"],
                    "success": result["success"],
                },
            )

            return result["success"]

        except Exception:
            logger.error("Erro ao persistir lote", extra={"event": "error"}, exc_info=True)
            return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load PNCP data to database")
    parser.add_argument("--timeout", type=int, default=1000, help="Timeout em ms")
    parser.add_argument("--batchSize", type=int, default=10, help="Tamanho do lote")
    parser.add_argument(
        "--maxIdlePolls",
        type=int,
        default=None,
        help="Encerra apos N polls sem mensagens (opcional)",
    )
    parser.add_argument(
        "--maxMessages",
        type=int,
        default=None,
        help="Encerra apos processar N mensagens (opcional)",
    )

    args = parser.parse_args()

    configure_logging(component="load")

    worker = LoadWorker()
    worker.run(
        timeout_ms=args.timeout,
        batch_size=args.batchSize,
        max_idle_polls=args.maxIdlePolls,
        max_messages=args.maxMessages,
    )
