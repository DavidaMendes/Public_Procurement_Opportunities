"""Transform Worker - Kafka Consumer/Producer for data normalization."""
import argparse
import json
from typing import Optional

from confluent_kafka import Consumer, Producer

from app.etl.transform import Transform
from app.infrastructure.config import (
    KAFKA_TOPICS,
    PRODUCER_CONFIG,
    TRANSFORM_CONSUMER_CONFIG,
)


def delivery_report(err, msg):
    """Delivery report callback."""
    if err is not None:
        print(f"Erro na entrega: {err}")


class TransformWorker:
    def __init__(self):
        self.consumer = Consumer(TRANSFORM_CONSUMER_CONFIG)
        self.producer = Producer(PRODUCER_CONFIG)
        self.transformer = Transform()

        self.transform_input_topic = KAFKA_TOPICS["transform_licitacoes"]
        self.silver_load_topic = KAFKA_TOPICS["load_silver_licitacoes"]

        self.consumer.subscribe([self.transform_input_topic])
        print(f"[OK] Inscrito no topico: {self.transform_input_topic}")

    def _publish_transformed_record_to_silver_load_topic(self, transformed: dict):
        message = json.dumps(transformed, ensure_ascii=False, default=str)

        self.producer.produce(
            topic=self.silver_load_topic,
            value=message.encode("utf-8"),
            key=transformed.get("numero_controle_pncp", "").encode("utf-8"),
            callback=delivery_report,
        )

    def run(
        self,
        timeout_ms: int = 1000,
        max_idle_polls: Optional[int] = None,
        max_messages: Optional[int] = None,
    ):
        """
        Consume extracted data, transform it, and publish to the silver-load topic.

        max_idle_polls is useful for orchestrated runs: after the ExtractWorker finishes,
        the consumer exits once Kafka stays idle for the configured number of polls.
        """
        processed_count = 0
        error_count = 0
        idle_polls = 0

        try:
            print("[*] Aguardando mensagens...")

            while True:
                msg = self.consumer.poll(timeout=timeout_ms / 1000)

                if msg is None:
                    idle_polls += 1
                    if max_idle_polls and idle_polls >= max_idle_polls:
                        print(f"[*] Encerrando por ociosidade apos {idle_polls} polls sem mensagens.")
                        break
                    continue

                idle_polls = 0

                if msg.error():
                    if msg.error().code() != -191:  
                        print(f"Erro Kafka: {msg.error()}")
                    continue

                try:
                    record = json.loads(msg.value().decode("utf-8"))
                    transformed = self.transformer.transform_record(record)
                    self._publish_transformed_record_to_silver_load_topic(transformed)

                    self.consumer.commit(asynchronous=True)
                    processed_count += 1

                    if processed_count % 10 == 0:
                        self.producer.flush(timeout=5)
                        print(f"[OK] {processed_count} registros transformados")

                    if max_messages and processed_count >= max_messages:
                        print(f"[*] Limite de {max_messages} mensagens transformadas atingido.")
                        break

                except Exception as exc:
                    error_record = {
                        "error": str(exc),
                        "original_message": msg.value().decode("utf-8", errors="ignore"),
                        "timestamp": str(msg.timestamp()),
                    }
                    error_message = json.dumps(error_record, ensure_ascii=False, default=str)

                    self.producer.produce(
                        topic=KAFKA_TOPICS["load_silver_licitacoes_dlq"],
                        value=error_message.encode("utf-8"),
                        callback=delivery_report,
                    )

                    self.consumer.commit(asynchronous=True)
                    error_count += 1
                    print(f"[ERRO] Erro ao transformar registro: {exc}")

        except KeyboardInterrupt:
            print(f"\n[*] Parado. Processados: {processed_count}, Erros: {error_count}")
        finally:
            self.producer.flush(timeout=10)
            self.consumer.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transform PNCP data")
    parser.add_argument("--timeout", type=int, default=1000, help="Timeout em ms")
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

    worker = TransformWorker()
    worker.run(
        timeout_ms=args.timeout,
        max_idle_polls=args.maxIdlePolls,
        max_messages=args.maxMessages,
    )
