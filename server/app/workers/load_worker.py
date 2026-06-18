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

        self.bronze_load_topic = KAFKA_TOPICS["load_bronze_licitacoes"]
        self.silver_load_topic = KAFKA_TOPICS["load_silver_licitacoes"]
        self.consumer.subscribe([self.bronze_load_topic, self.silver_load_topic])

        logger.info(
            "Inscrito nos topicos de entrada",
            extra={
                "event": "subscribed",
                "bronze_topic": self.bronze_load_topic,
                "silver_topic": self.silver_load_topic,
            },
        )

    def run(
        self,
        timeout_ms: int = 1000,
        batch_size: int = 10,
        max_idle_polls: Optional[int] = None,
        max_messages: Optional[int] = None,
    ):
        processed_count = 0
        error_count = 0
        idle_polls = 0
        batches = {
            self.bronze_load_topic: [],
            self.silver_load_topic: [],
        }
        started = time.monotonic()

        logger.info(
            "Carga iniciada",
            extra={
                "event": "stage_start",
                "batch_size": batch_size,
                "bronze_topic": self.bronze_load_topic,
                "silver_topic": self.silver_load_topic,
            },
        )

        try:
            while True:
                msg = self.consumer.poll(timeout=timeout_ms / 1000)

                if msg is None:
                    idle_polls += 1
                    flushed_count, flushed_errors = self._flush_pending_batches(batches)
                    processed_count += flushed_count
                    error_count += flushed_errors

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
                    topic = msg.topic()
                    if topic not in batches:
                        raise ValueError(f"Topico nao suportado pelo LoadWorker: {topic}")

                    record = json.loads(msg.value().decode("utf-8"))
                    batches[topic].append((msg, record))

                    if len(batches[topic]) >= batch_size:
                        success = self._persist_load_topic_batch(topic, batches[topic])
                        if success:
                            self._commit_batch(batches[topic])
                            processed_count += len(batches[topic])
                        else:
                            error_count += len(batches[topic])
                        batches[topic] = []

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
            flushed_count, flushed_errors = self._flush_pending_batches(batches)
            processed_count += flushed_count
            error_count += flushed_errors
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

    def _flush_pending_batches(self, batches: dict) -> tuple[int, int]:
        processed_count = 0
        error_count = 0

        for topic, batch in batches.items():
            if not batch:
                continue

            success = self._persist_load_topic_batch(topic, batch)
            if success:
                self._commit_batch(batch)
                processed_count += len(batch)
            else:
                error_count += len(batch)
            batches[topic] = []

        return processed_count, error_count

    def _commit_batch(self, batch: list):
        for kafka_msg, _ in batch:
            self.consumer.commit(message=kafka_msg, asynchronous=True)

    def _persist_load_topic_batch(self, topic: str, batch: list) -> bool:
        records = [record for _, record in batch]

        if topic == self.bronze_load_topic:
            return self._persist_bronze_load_batch(records)

        if topic == self.silver_load_topic:
            return self._persist_silver_load_batch(records)

        logger.error(
            "Topico nao suportado pelo LoadWorker",
            extra={"event": "unsupported_topic", "topic": topic},
        )
        return False

    def _persist_bronze_load_batch(self, batch: list) -> bool:
        """Persist raw records to the bronze MongoDB collection."""
        try:
            result = self.loader.persist_bronze(batch)
            logger.info(
                "Lote bronze persistido",
                extra={
                    "event": "bronze_batch_persisted",
                    "batch_size": len(batch),
                    "mongodb_inserted": result["inserted"],
                    "mongodb_errors": result["errors"],
                    "success": result["errors"] == 0,
                },
            )
            return result["errors"] == 0

        except Exception:
            logger.error("Erro ao persistir lote bronze", extra={"event": "error"}, exc_info=True)
            return False

    def _persist_silver_load_batch(self, batch: list) -> bool:
        """Persist transformed records to SQLite and the silver MongoDB collection."""
        try:
            result = self.loader.batch_persist(batch)

            sqlite_res = result["sqlite"]
            mongodb_res = result["mongodb"]

            logger.info(
                "Lote silver persistido",
                extra={
                    "event": "silver_batch_persisted",
                    "batch_size": result["total_records"],
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
            logger.error("Erro ao persistir lote silver", extra={"event": "error"}, exc_info=True)
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
